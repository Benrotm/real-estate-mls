'use server'

import { createAdminClient } from '@/app/lib/supabase/admin';
import { subDays, subMonths, subYears, startOfMonth, format, isAfter, isBefore } from 'date-fns';

export interface AnalyticsFilters {
    timeRange: '30d' | '6m' | '1y' | 'all';
    propertyType: string;
    category: string;
    city: string;
    scope?: 'mine' | 'all';
    userId?: string;
}

export interface AnalyticsData {
    kpis: {
        totalSupply: number;
        totalDemand: number;
        totalSoldListings: number;
        avgPrice: number;
        avgPricePerSqm: number;
        avgDaysOnMarket: number;
        marketTemperature: number; // 0-100 indicating buyer/seller market
    };
    trends: {
        date: string;
        avgPrice: number;
        supply: number;
        demand: number;
        sales: number;
    }[];
    distribution: {
        name: string;
        value: number;
    }[];
    heatMap: {
        name: string;
        leads: number;
    }[];
    recentActivity: {
        type: 'sale' | 'listing' | 'lead';
        id: string;
        title: string;
        price: number;
        date: string;
    }[];
    categoryStats: Record<string, {
        total: number;
        sale: number;
        rent: number;
        avgPrice: number;
        avgPricePerSqm: number;
    }>;
    transactionStats: {
        sale: { count: number; avgPrice: number; avgPricePerSqm: number };
        rent: { count: number; avgPrice: number; avgPricePerSqm: number };
    };
    cityStats: { name: string; count: number; avgPrice: number; avgPricePerSqm: number }[];
    areaStats: { name: string; count: number; avgPrice: number; avgPricePerSqm: number }[];
    priceRangeStats: { range: string; count: number; avgPrice: number; avgPricePerSqm: number }[];
    roomStats: { rooms: string; count: number; avgPrice: number; avgPricePerSqm: number }[];
    forecasts: Record<string, {
        currentPricePerSqm: number;
        projectedPricePerSqm12m: number;
        growthRate: number;
        confidence: 'High' | 'Medium' | 'Low';
        trendDirection: 'up' | 'stable' | 'down';
        historicalTrend: { date: string; avgPricePerSqm: number }[];
    }>;
}

export async function getMarketAnalyticsData(filters: AnalyticsFilters): Promise<AnalyticsData> {
    const supabase = createAdminClient();

    // 1. Determine Date Range
    const now = new Date();
    let startDate: Date;
    switch (filters.timeRange) {
        case '30d': startDate = subDays(now, 30); break;
        case '6m': startDate = subMonths(now, 6); break;
        case '1y': startDate = subYears(now, 1); break;
        default: startDate = new Date(0); // All time
    }

    // --- Execute Queries in page-by-page chunks ---
    console.log("Analytics: Fetching data in page-by-page chunks...");
    const pageSize = 1000;

    // Fetch all active properties
    let activeProperties: any[] = [];
    let page = 0;
    let hasMore = true;

    while (hasMore) {
        let chunkQuery = supabase
            .from('properties')
            .select('id, title, price, area_usable, created_at, type, listing_type, location_city, location_area, rooms, owner_id')
            .eq('status', 'active');

        if (filters.scope === 'mine' && filters.userId) {
            chunkQuery = chunkQuery.eq('owner_id', filters.userId);
        }
        if (filters.propertyType && filters.propertyType !== 'All') {
            chunkQuery = chunkQuery.ilike('type', filters.propertyType);
        }
        if (filters.category && filters.category !== 'All') {
            chunkQuery = chunkQuery.eq('listing_type', filters.category === 'Sale' ? 'For Sale' : 'For Rent');
        }
        if (filters.city) {
            chunkQuery = chunkQuery.ilike('location_city', filters.city);
        }

        const { data: chunk, error } = await chunkQuery.range(page * pageSize, (page + 1) * pageSize - 1);
        if (error) {
            console.error("Properties fetch error at page " + page + ":", error);
            break;
        }
        if (chunk && chunk.length > 0) {
            activeProperties = [...activeProperties, ...chunk];
            if (chunk.length < pageSize) {
                hasMore = false;
            } else {
                page++;
            }
        } else {
            hasMore = false;
        }
    }

    // Fetch all sales (sold history)
    let soldHistory: any[] = [];
    let salesPage = 0;
    let hasMoreSales = true;
    while (hasMoreSales) {
        let salesQuery = supabase
            .from('property_sold_history')
            .select(`
                id, sold_price, sold_date, days_on_market, property_id,
                properties (type, listing_type, location_city, location_area, area_usable, rooms)
            `);
        
        if (filters.timeRange !== 'all') {
            salesQuery = salesQuery.gte('sold_date', startDate.toISOString());
        }

        const { data: chunk, error } = await salesQuery.range(salesPage * pageSize, (salesPage + 1) * pageSize - 1);
        if (error) {
            console.error("Sales fetch error:", error);
            break;
        }
        if (chunk && chunk.length > 0) {
            soldHistory = [...soldHistory, ...chunk];
            if (chunk.length < pageSize) {
                hasMoreSales = false;
            } else {
                salesPage++;
            }
        } else {
            hasMoreSales = false;
        }
    }

    // Fetch all leads
    let allLeads: any[] = [];
    let leadsPage = 0;
    let hasMoreLeads = true;
    while (hasMoreLeads) {
        let demandQuery = supabase
            .from('leads')
            .select('id, created_at, source, preference_type, preference_listing_type, preference_location_city')
            .gte('created_at', startDate.toISOString());

        const { data: chunk, error } = await demandQuery.range(leadsPage * pageSize, (leadsPage + 1) * pageSize - 1);
        if (error) {
            console.error("Leads fetch error:", error);
            break;
        }
        if (chunk && chunk.length > 0) {
            allLeads = [...allLeads, ...chunk];
            if (chunk.length < pageSize) {
                hasMoreLeads = false;
            } else {
                leadsPage++;
            }
        } else {
            hasMoreLeads = false;
        }
    }

    console.log(`Analytics raw counts => Supply: ${activeProperties.length}, Sales: ${soldHistory.length}, Leads: ${allLeads.length}`);

    // In-memory filters for sales and leads to match property types / categories / cities
    if (filters.propertyType && filters.propertyType !== 'All') {
        const typeLower = filters.propertyType.toLowerCase();
        soldHistory = soldHistory.filter(s => (s.properties as any)?.type?.toLowerCase() === typeLower);
        allLeads = allLeads.filter(l => (l as any).preference_type?.toLowerCase() === typeLower);
    }
    if (filters.category && filters.category !== 'All') {
        const lt = filters.category === 'Sale' ? 'For Sale' : 'For Rent';
        soldHistory = soldHistory.filter(s => (s.properties as any)?.listing_type === lt);
        allLeads = allLeads.filter(l => (l as any).preference_listing_type === lt);
    }
    if (filters.city) {
        const cityLower = filters.city.toLowerCase();
        soldHistory = soldHistory.filter(s => (s.properties as any)?.location_city?.toLowerCase() === cityLower);
        allLeads = allLeads.filter(l => (l as any).preference_location_city?.toLowerCase() === cityLower);
    }

    console.log(`Analytics filtered counts => Sales: ${soldHistory.length}, Leads: ${allLeads.length}`);

    // --- Calculate KPIs ---
    let totalValue = 0;
    let totalArea = 0;
    let totalDOM = 0;
    let compsWithDOMCount = 0;

    soldHistory.forEach(sale => {
        totalValue += Number(sale.sold_price || 0);
        totalArea += Number((sale.properties as any)?.area_usable || 0);
        if (sale.days_on_market) {
            totalDOM += sale.days_on_market;
            compsWithDOMCount++;
        }
    });

    let avgPrice = 0;
    let avgPricePerSqm = 0;
    if (soldHistory.length > 0) {
        avgPrice = totalValue / soldHistory.length;
        if (totalArea > 0) avgPricePerSqm = totalValue / totalArea;
    } else if (activeProperties.length > 0) {
        const tVal = activeProperties.reduce((sum, p) => sum + Number(p.price || 0), 0);
        const tArea = activeProperties.reduce((sum, p) => sum + Number(p.area_usable || 0), 0);
        avgPrice = tVal / activeProperties.length;
        if (tArea > 0) avgPricePerSqm = tVal / tArea;
    }

    const totalSupply = activeProperties.length;
    const totalDemand = allLeads.length;

    let marketTemp = 50;
    if (totalSupply > 0) {
        const ratio = totalDemand / totalSupply;
        marketTemp = Math.min(100, Math.max(0, (ratio / 6) * 100));
    } else if (totalDemand > 0) {
        marketTemp = 100;
    }

    const kpis = {
        totalSupply,
        totalDemand,
        totalSoldListings: soldHistory.length,
        avgPrice: Math.round(avgPrice),
        avgPricePerSqm: Math.round(avgPricePerSqm),
        avgDaysOnMarket: compsWithDOMCount > 0 ? Math.round(totalDOM / compsWithDOMCount) : 0,
        marketTemperature: Math.round(marketTemp)
    };

    // --- Construct Trends ---
    const trendsMap = new Map<string, { supply: number; demand: number; salesCount: number; salesTotal: number }>();
    let curDate = startOfMonth(startDate);
    const end = startOfMonth(now);
    while (!isAfter(curDate, end)) {
        trendsMap.set(format(curDate, 'MMM yyyy'), { supply: 0, demand: 0, salesCount: 0, salesTotal: 0 });
        curDate = subMonths(curDate, -1);
    }

    soldHistory.forEach(sale => {
        if (!sale.sold_date) return;
        const d = startOfMonth(new Date(sale.sold_date));
        const key = format(d, 'MMM yyyy');
        if (trendsMap.has(key)) {
            const entry = trendsMap.get(key)!;
            entry.salesCount++;
            entry.salesTotal += Number(sale.sold_price || 0);
        }
    });

    allLeads.forEach(lead => {
        if (!lead.created_at) return;
        const d = startOfMonth(new Date(lead.created_at));
        const key = format(d, 'MMM yyyy');
        if (trendsMap.has(key)) {
            const entry = trendsMap.get(key)!;
            entry.demand++;
        }
    });

    activeProperties.forEach(prop => {
        if (!prop.created_at) return;
        const d = startOfMonth(new Date(prop.created_at));
        const key = format(d, 'MMM yyyy');
        if (trendsMap.has(key)) {
            const entry = trendsMap.get(key)!;
            entry.supply++;
        }
    });

    const trends = Array.from(trendsMap.entries()).map(([date, data]) => ({
        date,
        avgPrice: data.salesCount > 0 ? Math.round(data.salesTotal / data.salesCount) : 0,
        supply: data.supply,
        demand: data.demand,
        sales: data.salesCount,
    }));

    // --- Distribution ---
    const distMap = new Map<string, number>();
    activeProperties.forEach(p => {
        const type = p.type || 'Other';
        distMap.set(type, (distMap.get(type) || 0) + 1);
    });
    const distribution = Array.from(distMap.entries()).map(([name, value]) => ({ name, value }));

    // --- Heatmap ---
    const heatMapR = new Map<string, number>();
    allLeads.forEach(l => {
        const city = (l as any).preference_location_city || 'Unknown';
        heatMapR.set(city, (heatMapR.get(city) || 0) + 1);
    });
    const heatMap = Array.from(heatMapR.entries())
        .map(([name, leads]) => ({ name, leads }))
        .sort((a, b) => b.leads - a.leads)
        .slice(0, 5);

    // --- Recent Activity ---
    const recentActivity: AnalyticsData['recentActivity'] = [];
    soldHistory.sort((a, b) => new Date(b.sold_date).getTime() - new Date(a.sold_date).getTime())
        .slice(0, 4)
        .forEach(s => {
            recentActivity.push({
                type: 'sale',
                id: s.id,
                title: 'Property Sold',
                price: Number(s.sold_price || 0),
                date: new Date(s.sold_date).toLocaleDateString()
            });
        });

    activeProperties.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 4)
        .forEach(p => {
            recentActivity.push({
                type: 'listing',
                id: p.id,
                title: p.title || 'New Listing',
                price: Number(p.price || 0),
                date: new Date(p.created_at).toLocaleDateString()
            });
        });

    recentActivity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // --- 1. Category Stats (7 categories, Sale vs Rent) ---
    const categoryTypes = ['Apartment', 'House', 'Commercial', 'Land', 'Industrial', 'Business', 'Other'];
    const categoryStats: AnalyticsData['categoryStats'] = {};
    categoryTypes.forEach(t => {
        categoryStats[t] = { total: 0, sale: 0, rent: 0, avgPrice: 0, avgPricePerSqm: 0 };
    });

    activeProperties.forEach(p => {
        const type = p.type || 'Other';
        const key = categoryStats[type] ? type : 'Other';
        categoryStats[key].total++;
        if (p.listing_type === 'For Sale') {
            categoryStats[key].sale++;
        } else if (p.listing_type === 'For Rent') {
            categoryStats[key].rent++;
        }
    });

    categoryTypes.forEach(t => {
        const props = activeProperties.filter(p => (p.type || 'Other') === t);
        if (props.length > 0) {
            const totalPrice = props.reduce((sum, p) => sum + Number(p.price || 0), 0);
            const totalArea = props.reduce((sum, p) => sum + Number(p.area_usable || 0), 0);
            categoryStats[t].avgPrice = Math.round(totalPrice / props.length);
            categoryStats[t].avgPricePerSqm = totalArea > 0 ? Math.round(totalPrice / totalArea) : 0;
        }
    });

    // --- 2. Transaction Stats ---
    const salesProps = activeProperties.filter(p => p.listing_type === 'For Sale');
    const rentProps = activeProperties.filter(p => p.listing_type === 'For Rent');
    const saleTotalPrice = salesProps.reduce((sum, p) => sum + Number(p.price || 0), 0);
    const saleTotalArea = salesProps.reduce((sum, p) => sum + Number(p.area_usable || 0), 0);
    const rentTotalPrice = rentProps.reduce((sum, p) => sum + Number(p.price || 0), 0);
    const rentTotalArea = rentProps.reduce((sum, p) => sum + Number(p.area_usable || 0), 0);

    const transactionStats = {
        sale: {
            count: salesProps.length,
            avgPrice: salesProps.length > 0 ? Math.round(saleTotalPrice / salesProps.length) : 0,
            avgPricePerSqm: saleTotalArea > 0 ? Math.round(saleTotalPrice / saleTotalArea) : 0
        },
        rent: {
            count: rentProps.length,
            avgPrice: rentProps.length > 0 ? Math.round(rentTotalPrice / rentProps.length) : 0,
            avgPricePerSqm: rentTotalArea > 0 ? Math.round(rentTotalPrice / rentTotalArea) : 0
        }
    };

    // --- 3. City Stats (Top 10) ---
    const cityMap = new Map<string, { count: number; totalPrice: number; totalArea: number }>();
    activeProperties.forEach(p => {
        const cityName = p.location_city || 'Unknown';
        if (!cityMap.has(cityName)) {
            cityMap.set(cityName, { count: 0, totalPrice: 0, totalArea: 0 });
        }
        const stat = cityMap.get(cityName)!;
        stat.count++;
        stat.totalPrice += Number(p.price || 0);
        stat.totalArea += Number(p.area_usable || 0);
    });

    const cityStats = Array.from(cityMap.entries())
        .map(([name, stat]) => ({
            name,
            count: stat.count,
            avgPrice: Math.round(stat.totalPrice / stat.count),
            avgPricePerSqm: stat.totalArea > 0 ? Math.round(stat.totalPrice / stat.totalArea) : 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    // --- 4. Area Stats (Top 10) ---
    const areaMap = new Map<string, { count: number; totalPrice: number; totalArea: number }>();
    activeProperties.forEach(p => {
        const areaName = p.location_area;
        if (!areaName || areaName.trim() === '') return;
        if (!areaMap.has(areaName)) {
            areaMap.set(areaName, { count: 0, totalPrice: 0, totalArea: 0 });
        }
        const stat = areaMap.get(areaName)!;
        stat.count++;
        stat.totalPrice += Number(p.price || 0);
        stat.totalArea += Number(p.area_usable || 0);
    });

    const areaStats = Array.from(areaMap.entries())
        .map(([name, stat]) => ({
            name,
            count: stat.count,
            avgPrice: Math.round(stat.totalPrice / stat.count),
            avgPricePerSqm: stat.totalArea > 0 ? Math.round(stat.totalPrice / stat.totalArea) : 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    // --- 5. Price Range Stats ---
    const rangeBuckets = [
        { name: 'Sale: Under €50k', min: 0, max: 50000, type: 'For Sale' },
        { name: 'Sale: €50k - €100k', min: 50000, max: 100000, type: 'For Sale' },
        { name: 'Sale: €100k - €150k', min: 100000, max: 150000, type: 'For Sale' },
        { name: 'Sale: €150k - €250k', min: 150000, max: 250000, type: 'For Sale' },
        { name: 'Sale: €250k+', min: 250000, max: Infinity, type: 'For Sale' },
        { name: 'Rent: Under €300/mo', min: 0, max: 300, type: 'For Rent' },
        { name: 'Rent: €300 - €500/mo', min: 300, max: 500, type: 'For Rent' },
        { name: 'Rent: €500 - €800/mo', min: 500, max: 800, type: 'For Rent' },
        { name: 'Rent: €800 - €1,200/mo', min: 800, max: 1200, type: 'For Rent' },
        { name: 'Rent: €1,200+/mo', min: 1200, max: Infinity, type: 'For Rent' }
    ];

    const priceRangeStats = rangeBuckets.map(b => {
        const props = activeProperties.filter(p => p.listing_type === b.type && p.price >= b.min && p.price < b.max);
        const totalPrice = props.reduce((sum, p) => sum + Number(p.price || 0), 0);
        const totalArea = props.reduce((sum, p) => sum + Number(p.area_usable || 0), 0);
        return {
            range: b.name,
            count: props.length,
            avgPrice: props.length > 0 ? Math.round(totalPrice / props.length) : 0,
            avgPricePerSqm: totalArea > 0 ? Math.round(totalPrice / totalArea) : 0
        };
    }).filter(r => r.count > 0);

    // --- 6. Room Stats (Apartments by Room Count) ---
    const apartmentProps = activeProperties.filter(p => (p.type || '').toLowerCase() === 'apartment');
    const roomStats = [
        { label: '1 Room', filter: (p: any) => p.rooms === 1 || p.rooms === 0 || !p.rooms },
        { label: '2 Rooms', filter: (p: any) => p.rooms === 2 },
        { label: '3 Rooms', filter: (p: any) => p.rooms === 3 },
        { label: '4+ Rooms', filter: (p: any) => p.rooms >= 4 }
    ].map(r => {
        const props = apartmentProps.filter(r.filter);
        const totalPrice = props.reduce((sum, p) => sum + Number(p.price || 0), 0);
        const totalArea = props.reduce((sum, p) => sum + Number(p.area_usable || 0), 0);
        return {
            rooms: r.label,
            count: props.length,
            avgPrice: props.length > 0 ? Math.round(totalPrice / props.length) : 0,
            avgPricePerSqm: totalArea > 0 ? Math.round(totalPrice / totalArea) : 0
        };
    });

    // --- 7. Forecasts ---
    const forecasts: AnalyticsData['forecasts'] = {};
    const majorCategories = ['Apartment', 'House', 'Commercial', 'Land'];

    majorCategories.forEach(cat => {
        const catActive = activeProperties.filter(p => p.type === cat);
        const activePriceSum = catActive.reduce((sum, p) => sum + Number(p.price || 0), 0);
        const activeAreaSum = catActive.reduce((sum, p) => sum + Number(p.area_usable || 0), 0);
        let currentPricePerSqm = activeAreaSum > 0 ? activePriceSum / activeAreaSum : 1200;

        const catSales = soldHistory.filter(s => (s.properties as any)?.type === cat && s.sold_date && s.sold_price && (s.properties as any)?.area_usable);
        const salesByMonth = new Map<string, { totalVal: number; totalArea: number }>();
        const monthNames: string[] = [];
        for (let i = 5; i >= 0; i--) {
            const d = subMonths(now, i);
            const mKey = format(d, 'MMM yyyy');
            monthNames.push(mKey);
            salesByMonth.set(mKey, { totalVal: 0, totalArea: 0 });
        }

        catSales.forEach(s => {
            const d = new Date(s.sold_date);
            const mKey = format(d, 'MMM yyyy');
            if (salesByMonth.has(mKey)) {
                const cell = salesByMonth.get(mKey)!;
                cell.totalVal += Number(s.sold_price);
                cell.totalArea += Number((s.properties as any).area_usable);
            }
        });

        const historicalPoints = monthNames.map((mKey, idx) => {
            const cell = salesByMonth.get(mKey)!;
            let avgPricePerSqmVal = cell.totalArea > 0 ? cell.totalVal / cell.totalArea : 0;
            return { date: mKey, avgPricePerSqm: avgPricePerSqmVal, monthIdx: idx };
        });

        const validPoints = historicalPoints.filter(pt => pt.avgPricePerSqm > 0);
        let annualGrowthRate = 0.052;
        if (cat === 'House') annualGrowthRate = 0.045;
        else if (cat === 'Commercial') annualGrowthRate = 0.038;
        else if (cat === 'Land') annualGrowthRate = 0.060;

        let monthlySlope = (currentPricePerSqm * annualGrowthRate) / 12;
        let confidence: 'High' | 'Medium' | 'Low' = 'Low';

        if (validPoints.length >= 2) {
            const n = validPoints.length;
            let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
            validPoints.forEach(pt => {
                sumX += pt.monthIdx;
                sumY += pt.avgPricePerSqm;
                sumXY += pt.monthIdx * pt.avgPricePerSqm;
                sumXX += pt.monthIdx * pt.monthIdx;
            });

            const denominator = n * sumXX - sumX * sumX;
            if (denominator !== 0) {
                const rawSlope = (n * sumXY - sumX * sumY) / denominator;
                const maxSaneSlope = currentPricePerSqm * 0.015;
                const minSaneSlope = -currentPricePerSqm * 0.01;
                const blendFactor = Math.min(1, n / 6);
                const calculatedSlope = Math.min(maxSaneSlope, Math.max(minSaneSlope, rawSlope));
                monthlySlope = calculatedSlope * blendFactor + (monthlySlope * (1 - blendFactor));
                confidence = n >= 5 ? 'High' : 'Medium';
            }
        }

        let lastVal = currentPricePerSqm - (monthlySlope * 5);
        const smoothedHistory = historicalPoints.map((pt) => {
            let val = pt.avgPricePerSqm;
            if (val === 0) {
                val = Math.round(lastVal + monthlySlope);
            } else {
                const trendVal = lastVal + monthlySlope;
                val = Math.round(val * 0.4 + trendVal * 0.6);
            }
            lastVal = val;
            return { date: pt.date, avgPricePerSqm: val };
        });

        const projectedPoints: { date: string; avgPricePerSqm: number }[] = [];
        for (let i = 1; i <= 6; i++) {
            const d = subMonths(now, -i);
            const mKey = format(d, 'MMM yyyy');
            const val = Math.round(currentPricePerSqm + (monthlySlope * i));
            projectedPoints.push({ date: mKey, avgPricePerSqm: val });
        }

        const trendLine = [...smoothedHistory, ...projectedPoints];
        const projectedPricePerSqm12m = currentPricePerSqm + (monthlySlope * 12);
        const growthRate = ((projectedPricePerSqm12m - currentPricePerSqm) / currentPricePerSqm) * 100;

        forecasts[cat] = {
            currentPricePerSqm: Math.round(currentPricePerSqm),
            projectedPricePerSqm12m: Math.round(projectedPricePerSqm12m),
            growthRate: Number(growthRate.toFixed(1)),
            confidence,
            trendDirection: growthRate > 1 ? 'up' : growthRate < -1 ? 'down' : 'stable',
            historicalTrend: trendLine
        };
    });

    return {
        kpis,
        trends,
        distribution,
        heatMap,
        recentActivity: recentActivity.slice(0, 8),
        categoryStats,
        transactionStats,
        cityStats,
        areaStats,
        priceRangeStats,
        roomStats,
        forecasts
    };
}
