'use server'

import { createClient } from '@/app/lib/supabase/server';
import { createAdminClient } from '@/app/lib/supabase/admin';
import { fetchAirQuality, fetchSolarPotential } from '@/app/lib/services/google-maps';

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
}

export async function submitSoldPrice(propertyId: string, price: number, date: Date, notes?: string) {
    const supabase = await createClient();

    // Check if user is authenticated (RLS will also handle this, but good for validation)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        throw new Error("Unauthorized");
    }

    const { error } = await supabase
        .from('property_sold_history')
        .insert({
            property_id: propertyId,
            sold_price: price,
            sold_date: date,
            notes: notes,
            reporter_id: user.id
        });

    if (error) {
        console.error("Error submitting sold price:", error);
        throw new Error("Failed to submit sold price");
    }

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
            comparables: []
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
    // Radius ~2km. 1 deg lat ~ 111km. 2km ~ 0.018 deg.
    const LAT_RANGE = 0.02;
    const LNG_RANGE = 0.025; // Roughly adjusted for longitude at typical latitudes

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
        return diff <= 0.2; // 20% variance
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
            ...comp,
            sold_date: comp.sold_date instanceof Date ? comp.sold_date.toISOString() : comp.sold_date,
            sold_price: safeNumber(comp.sold_price),
            properties: comp.properties ? {
                ...comp.properties,
                area_usable: safeNumber(comp.properties.area_usable)
            } : null
        }))
    };
}
