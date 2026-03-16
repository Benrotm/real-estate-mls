'use server'

import { createClient } from '@/app/lib/supabase/server';
import { createAdminClient } from '@/app/lib/supabase/admin';
import { fetchAirQuality, fetchSolarPotential } from '@/app/lib/services/google-maps';
import { revalidatePath } from 'next/cache';
import { getPropertyScoreBreakdown } from '@/app/lib/actions/scoring';

interface ValuationResult {
    estimatedValue: number;
    confidenceScore: number; // 0-100
    baseValue: number;
    pricePerSqm: number;
    comparablesCount: number;
    lifestyleFactors: {
        aqi: { value: number; category: string; impact: number };
        solar: { score: number; kwh: number; impact: number };
        offers?: { count: number; avgPrice: number; impact: number };
    };
    comparables: any[];
    medianComparablePrice: number;
    currentSupply: any[];
    medianSupplyPrice: number;
    amenityScore: number;
    amenityBreakdown: { category: string; label: string; points: number }[];
}

export async function submitSoldPrice(
    propertyId: string,
    price: number,
    date: Date,
    notes?: string,
    daysOnMarket?: number
) {
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        throw new Error("Unauthorized");
    }

    // 1. Insert into history
    const { error: historyError } = await supabase
        .from('property_sold_history')
        .insert({
            property_id: propertyId,
            sold_price: price,
            sold_date: date,
            notes: notes,
            reporter_id: user.id,
            days_on_market: daysOnMarket
        });

    if (historyError) {
        console.error("Error submitting sold price:", historyError);
        throw new Error("Failed to submit sold price");
    }

    // 2. Update property status to 'sold'
    const { error: propError } = await supabase
        .from('properties')
        .update({ status: 'sold' })
        .eq('id', propertyId);

    if (propError) {
        console.error("Error updating property status:", propError);
        // We don't necessarily want to fail the whole thing if the history was saved, 
        // but it's better to be consistent.
    }

    // Revalidate paths to clear Next.js cache
    revalidatePath('/dashboard/owner/market');
    revalidatePath('/dashboard/agent/market');
    revalidatePath('/dashboard/admin/market');
    revalidatePath('/dashboard/owner/properties');
    revalidatePath('/dashboard/admin/properties');
    revalidatePath('/dashboard/admin/my-properties');

    return { success: true };
}

export async function getSmartValuation(propertyId: string): Promise<ValuationResult | null> {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // 1. Fetch Target Property
    const { data: property, error: propError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();

    if (propError || !property) {
        console.error("Property not found", propError);
        return null; // Or throw
    }

    // Scoring Breakdown
    const { totalScore, breakdown } = await getPropertyScoreBreakdown(property);

    if (!property.latitude || !property.longitude || !property.area_usable) {
        // Return fallback valuation using listing price when location/size data is missing
        const listingPrice = Number(property.price) || 0;
        return {
            estimatedValue: listingPrice,
            confidenceScore: 30, // Low confidence due to missing data
            baseValue: listingPrice,
            pricePerSqm: property.area_usable ? Math.round(listingPrice / property.area_usable) : 0,
            comparablesCount: 0,
            lifestyleFactors: {
                aqi: { value: 0, category: 'N/A', impact: 0 },
                solar: { score: 0, kwh: 0, impact: 0 }
            },
            comparables: [],
            medianComparablePrice: listingPrice,
            currentSupply: [],
            medianSupplyPrice: listingPrice,
            amenityScore: totalScore,
            amenityBreakdown: breakdown
        };
    }

    // 2. Fetch/Update Environmental Metrics (Cache Strategy)
    let envMetrics = null;

    const { data: cachedMetrics } = await adminSupabase
        .from('property_environmental_metrics')
        .select('*')
        .eq('property_id', propertyId)
        .single();

    // Check if stale (older than 30 days)
    const isStale = !cachedMetrics || (new Date().getTime() - new Date(cachedMetrics.last_updated).getTime() > 30 * 24 * 60 * 60 * 1000);

    if (isStale) {
        // Fetch fresh
        const [aqiData, solarData] = await Promise.all([
            fetchAirQuality(property.latitude, property.longitude),
            fetchSolarPotential(property.latitude, property.longitude)
        ]);

        if (aqiData || solarData) {
            const upsertData = {
                property_id: propertyId,
                air_quality_index: aqiData?.aqi || null,
                air_quality_category: aqiData?.category || null,
                solar_potential_score: solarData?.solarPotentialScore || null,
                solar_yearly_potential_kwh: solarData?.maxSunshineHoursPerYear || null, // Mapping sunshine to potential roughly
                pollen_level_score: 0, // Placeholder
                last_updated: new Date().toISOString()
            };

            await adminSupabase
                .from('property_environmental_metrics')
                .upsert(upsertData, { onConflict: 'property_id' }); // Requires unique constraint

            envMetrics = upsertData;
        } else {
            envMetrics = cachedMetrics; // Fallback
        }
    } else {
        envMetrics = cachedMetrics;
    }

    // 3. Find Comparables (Sold History)
    // Radius ~5km. 1 deg lat ~ 111km. 5km ~ 0.045 deg.
    const LAT_RANGE = 0.05;
    const LNG_RANGE = 0.06; // Roughly adjusted for longitude at typical latitudes

    // We can't join explicitly easily with Supabase client syntax for complex filtering across tables efficiently without views/functions.
    // Instead, we'll fetch sold history for ALL properties, then filter by those properties' location.
    // OPTIMIZATION: Fetch properties in range FIRST, then get their sold history.

    const { data: nearbyProperties } = await supabase
        .from('properties')
        .select('id, latitude, longitude, year_built, rooms, area_usable')
        .gte('latitude', property.latitude - LAT_RANGE)
        .lte('latitude', property.latitude + LAT_RANGE)
        .gte('longitude', property.longitude - LNG_RANGE)
        .lte('longitude', property.longitude + LNG_RANGE)
        .eq('type', property.type) // Same type
        // .eq('rooms', property.rooms) // Maybe loose match?
        .neq('id', propertyId); // Exclude self

    const nearbyIds = nearbyProperties?.map(p => p.id) || [];

    let comparables: any[] = [];
    if (nearbyIds.length > 0) {
        const { data: soldHistory } = await supabase
            .from('property_sold_history')
            .select(`
                *,
                properties (
                    id, address, rooms, area_usable, year_built
                )
            `)
            .in('property_id', nearbyIds)
            .order('sold_date', { ascending: false })
            .limit(10);

        comparables = soldHistory || [];
    }

    // 3.5 Find Current Supply (Active Listings)
    let currentSupply: any[] = [];
    if (nearbyIds.length > 0) {
        const { data: activeListings } = await supabase
            .from('properties')
            .select(`
                id, title, address, rooms, area_usable, year_built, price, type, location_city, images
            `)
            .in('id', nearbyIds)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(15);

        currentSupply = activeListings || [];
    }


    // 4. Find Offers
    const { data: offers } = await supabase
        .from('property_offers')
        .select('offer_amount')
        .eq('property_id', propertyId)
        .in('status', ['pending', 'accepted']);

    const offersCount = offers?.length || 0;
    const avgOfferPrice = (offersCount > 0 && offers)
        ? offers.reduce((sum, o) => {
            const val = Number(o.offer_amount);
            return sum + (isNaN(val) ? 0 : val);
        }, 0) / offersCount
        : 0;

    // 5. Calculate Base Value
    // Filter comps by size similarity (+/- 20%)
    const validComps = comparables.filter(c => {
        const size = c.properties?.area_usable;
        if (!size) return false;
        const diff = Math.abs(size - property.area_usable) / property.area_usable;
        return diff <= 0.6; // Increased variance to 60% to show more comparables in demo
    });

    let baseValue = 0;
    let pricePerSqm = 0;

    if (validComps.length > 0) {
        const totalPpsm = validComps.reduce((sum, c) => {
            const ppsm = c.sold_price / c.properties.area_usable;
            return sum + ppsm;
        }, 0);
        pricePerSqm = totalPpsm / validComps.length;
        baseValue = pricePerSqm * property.area_usable;
    } else {
        // Fallback: If no sold data, maybe use active listings? (Optional, skipping for now)
        // Or return Listing Price if available as base?
        baseValue = Number(property.price); // Use listing price as fallback anchor
        pricePerSqm = baseValue / (property.area_usable || 1);
    }

    // Calculate median comparable price
    let medianCompPrice = 0;
    if (validComps.length > 0) {
        const sortedPrices = validComps.map(c => Number(c.sold_price)).sort((a, b) => a - b);
        const mid = Math.floor(sortedPrices.length / 2);
        medianCompPrice = sortedPrices.length % 2 !== 0
            ? sortedPrices[mid]
            : (sortedPrices[mid - 1] + sortedPrices[mid]) / 2;
    } else {
        medianCompPrice = baseValue;
    }

    // Calculate median supply price
    let medianSupplyPrice = 0;
    const validSupply = currentSupply.filter(s => {
        const size = s.area_usable;
        if (!size) return false;
        const diff = Math.abs(size - property.area_usable) / property.area_usable;
        return diff <= 0.6; // Increased variance to 60% for supply
    });

    if (validSupply.length > 0) {
        const sortedPrices = validSupply.map(s => Number(s.price)).sort((a, b) => a - b);
        const mid = Math.floor(sortedPrices.length / 2);
        medianSupplyPrice = sortedPrices.length % 2 !== 0
            ? sortedPrices[mid]
            : (sortedPrices[mid - 1] + sortedPrices[mid]) / 2;
    } else {
        medianSupplyPrice = Number(property.price) || baseValue;
    }


    // 6. Apply Lifestyle & Market Modifiers
    let metricsImpact = 0; // percentage
    let aqiImpact = 0;
    let solarImpact = 0;
    let marketInterestImpact = 0;

    const aqi = envMetrics?.air_quality_index;
    if (aqi) {
        if (aqi <= 50) { aqiImpact = 0.02; } // +2% for great air
        else if (aqi > 100) { aqiImpact = -0.02; } // -2% for bad air
    }

    const solar = envMetrics?.solar_potential_score;
    if (solar) {
        if (solar > 80) { solarImpact = 0.01; } // +1% for great solar potential
    }

    // Market interest impact (offers)
    // If average offer is higher than listing price, it indicates strong market demand
    if (avgOfferPrice > 0 && property.price > 0) {
        const offerVsListing = (avgOfferPrice - property.price) / property.price;
        if (!isNaN(offerVsListing)) {
            // Limit the impact to +/- 5% to avoid extreme swings
            marketInterestImpact = Math.max(-0.05, Math.min(0.05, offerVsListing * 0.5));
        }
    } else if (offersCount > 3) {
        // High volume of offers even without price data gives a small boost
        marketInterestImpact = 0.01;
    }

    metricsImpact = aqiImpact + solarImpact + marketInterestImpact;
    const finalValue = baseValue * (1 + metricsImpact);

    // Helper to ensure numbers are serializable (no NaN, no Infinity)
    const safeNumber = (val: any, fallback = 0) => {
        if (typeof val !== 'number' || isNaN(val) || !Number.isFinite(val)) {
            return fallback;
        }
        return val;
    };

    return {
        estimatedValue: Math.round(safeNumber(finalValue, Number(property.price) || 0)),
        confidenceScore: Math.min(100, Math.max(0, Math.round(
            (validComps.length >= 3 ? 90 : (validComps.length > 0 ? 60 : 30)) + (offersCount > 0 ? 5 : 0)
        ))),
        baseValue: Math.round(safeNumber(baseValue, Number(property.price) || 0)),
        pricePerSqm: Math.round(safeNumber(pricePerSqm)),
        comparablesCount: validComps.length,
        lifestyleFactors: {
            aqi: { value: safeNumber(aqi), category: envMetrics?.air_quality_category || 'N/A', impact: safeNumber(aqiImpact) },
            solar: { score: safeNumber(solar), kwh: safeNumber(envMetrics?.solar_yearly_potential_kwh), impact: safeNumber(solarImpact) },
            offers: { count: offersCount, avgPrice: safeNumber(avgOfferPrice), impact: safeNumber(marketInterestImpact) }
        },
        comparables: validComps.map(comp => ({
            id: comp.id,
            property_id: comp.property_id,
            sold_price: safeNumber(comp.sold_price),
            sold_date: comp.sold_date instanceof Date ? comp.sold_date.toISOString() : (comp.sold_date || null),
            source: comp.source || null,
            properties: comp.properties ? {
                title: comp.properties.title || '',
                type: comp.properties.type || 'Other',
                location_city: comp.properties.location_city || '',
                area_usable: safeNumber(comp.properties.area_usable),
                images: comp.properties.images || []
            } : null
        })),
        medianComparablePrice: Math.round(safeNumber(medianCompPrice, Number(property.price) || 0)),
        currentSupply: currentSupply.map(s => ({
            id: s.id,
            title: s.title || '',
            price: safeNumber(s.price),
            address: s.address || '',
            rooms: safeNumber(s.rooms),
            area_usable: safeNumber(s.area_usable),
            type: s.type || 'Other',
            location_city: s.location_city || '',
            images: s.images || []
        })),
        medianSupplyPrice: Math.round(safeNumber(medianSupplyPrice, Number(property.price) || 0)),
        amenityScore: totalScore,
        amenityBreakdown: breakdown
    };
}

export async function getSoldProperties(filters: {
    city?: string;
    area?: string;
    type?: string;
    minRooms?: number;
    maxRooms?: number;
    minPrice?: number;
    maxPrice?: number;
    minArea?: number;
    maxArea?: number;
    yearBuilt?: number;
}) {
    const supabase = await createClient();

    let query = supabase
        .from('property_sold_history')
        .select(`
            id,
            sold_price,
            sold_date,
            days_on_market,
            properties (
                id,
                title,
                type,
                location_city,
                location_area,
                latitude,
                longitude,
                price,
                currency,
                rooms,
                area_usable,
                year_built,
                images,
                created_at
            )
        `)
        .order('sold_date', { ascending: false });

    if (filters.city) {
        query = query.filter('properties.location_city', 'eq', filters.city);
    }
    if (filters.area) {
        query = query.filter('properties.location_area', 'eq', filters.area);
    }
    if (filters.type && filters.type !== 'All') {
        query = query.filter('properties.type', 'eq', filters.type);
    }
    if (filters.minRooms) {
        query = query.filter('properties.rooms', 'gte', filters.minRooms);
    }
    if (filters.maxRooms) {
        query = query.filter('properties.rooms', 'lte', filters.maxRooms);
    }
    if (filters.minPrice) {
        query = query.filter('properties.price', 'gte', filters.minPrice);
    }
    if (filters.maxPrice) {
        query = query.filter('properties.price', 'lte', filters.maxPrice);
    }
    if (filters.minArea) {
        query = query.filter('properties.area_usable', 'gte', filters.minArea);
    }
    if (filters.maxArea) {
        query = query.filter('properties.area_usable', 'lte', filters.maxArea);
    }
    if (filters.yearBuilt) {
        query = query.filter('properties.year_built', 'eq', filters.yearBuilt);
    }

    const { data: historyData, error: historyError } = await query.limit(50);

    if (historyError) {
        console.error("Error fetching sold history:", historyError);
    }

    // 2. Fetch from market_insights (Scraped Data)
    let miQuery = supabase
        .from('market_insights')
        .select('*')
        .order('scraped_at', { ascending: false });

    if (filters.city) miQuery = miQuery.ilike('city', `%${filters.city}%`);
    if (filters.area) miQuery = miQuery.ilike('area', `%${filters.area}%`);
    if (filters.type && filters.type !== 'All') miQuery = miQuery.eq('property_type', filters.type);
    if (filters.minRooms) miQuery = miQuery.gte('rooms', filters.minRooms);
    if (filters.maxRooms) miQuery = miQuery.lte('rooms', filters.maxRooms);
    if (filters.minPrice) miQuery = miQuery.gte('price', filters.minPrice);
    if (filters.maxPrice) miQuery = miQuery.lte('price', filters.maxPrice);
    if (filters.minArea) miQuery = miQuery.gte('usable_area', filters.minArea);
    if (filters.maxArea) miQuery = miQuery.lte('usable_area', filters.maxArea);
    if (filters.yearBuilt) miQuery = miQuery.eq('year_built', filters.yearBuilt);

    const { data: miData, error: miError } = await miQuery.limit(50);

    if (miError) {
        console.error("Error fetching market insights:", miError);
    }

    // 3. Merge and Format
    const formattedHistory = (historyData || []).map(item => ({
        ...item,
        source: 'internal'
    }));

    const formattedMI = (miData || []).map(mi => ({
        id: mi.id,
        sold_price: mi.price,
        sold_date: mi.scraped_at,
        days_on_market: mi.days_on_market,
        source: 'scraped',
        properties: {
            id: mi.id,
            title: mi.title,
            type: mi.property_type || 'Apartment',
            location_city: mi.city,
            location_area: mi.area,
            latitude: mi.raw_extracted_data?.lat || 0,
            longitude: mi.raw_extracted_data?.lng || 0,
            price: mi.price, // Fallback to sold price if listing price not available separately
            currency: mi.currency || 'EUR',
            rooms: mi.rooms,
            area_usable: mi.usable_area,
            year_built: mi.year_built,
            images: mi.images || [],
            created_at: mi.scraped_at
        }
    }));

    const combined = [...formattedHistory, ...formattedMI].sort((a, b) => 
        new Date(b.sold_date).getTime() - new Date(a.sold_date).getTime()
    );

    return combined.slice(0, 50);
}
