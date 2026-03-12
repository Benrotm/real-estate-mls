'use server'

import { createClient } from '@/app/lib/supabase/server';
import { subDays, subMonths, subYears, startOfMonth, format, isAfter, isBefore } from 'date-fns';

export interface AnalyticsFilters {
    timeRange: '30d' | '6m' | '1y' | 'all';
    propertyType: string;
    category: string;
    city: string;
}

export interface AnalyticsData {
    kpis: {
        totalSupply: number;
        totalDemand: number;
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
}

export async function getMarketAnalyticsData(filters: AnalyticsFilters): Promise<AnalyticsData> {
    const supabase = await createClient();

    // 1. Determine Date Range
    const now = new Date();
    let startDate: Date;
    switch (filters.timeRange) {
        case '30d': startDate = subDays(now, 30); break;
        case '6m': startDate = subMonths(now, 6); break;
        case '1y': startDate = subYears(now, 1); break;
        default: startDate = new Date(0); // All time
    }

    // --- Base Queries ---

    // Supply Query (Active properties)
    let supplyQuery = supabase
        .from('properties')
        .select('id, title, price, area_usable, created_at, type, location_city')
        .eq('status', 'active');

    // Sales Query (property_sold_history)
    let salesQuery = supabase
        .from('property_sold_history')
        .select(`
            id, sold_price, sold_date, days_on_market, property_id,
            properties!inner (type, category, location_city, area_usable)
        `);

    // Demand Query (Leads/Inquiries)
    let demandQuery = supabase
        .from('leads')
        .select(`
            id, created_at, source, property_id,
            properties (type, category, location_city)
        `)
        .gte('created_at', startDate.toISOString());

    // Apply Global Filters to Queries
    if (filters.propertyType && filters.propertyType !== 'All') {
        supplyQuery = supplyQuery.eq('type', filters.propertyType);
        salesQuery = salesQuery.eq('properties.type', filters.propertyType);
        // Note: For leads, we might need to filter manually if the join doesn't perfectly support it in postgrest
    }
    if (filters.category && filters.category !== 'All') {
        supplyQuery = supplyQuery.eq('category', filters.category);
        salesQuery = salesQuery.eq('properties.category', filters.category);
    }
    if (filters.city) {
        supplyQuery = supplyQuery.eq('location_city', filters.city);
        salesQuery = salesQuery.eq('properties.location_city', filters.city);
    }

    // Apply Time Range to Sales (Supply is everything active right now)
    if (filters.timeRange !== 'all') {
        salesQuery = salesQuery.gte('sold_date', startDate.toISOString());
    }

    // --- Execute Queries ---

    console.log("Analytics: Fetching data...");
    const [
        { data: supplyData, error: supplyError },
        { data: salesData, error: salesError },
        { data: leadsData, error: leadsError }
    ] = await Promise.all([
        supplyQuery,
        salesQuery,
        demandQuery
    ]);

    if (supplyError) console.error("Supply error:", supplyError);
    if (salesError) console.error("Sales error:", salesError);
    if (leadsError) console.error("Leads error:", leadsError);

    // Provide fallbacks
    const activeProperties = supplyData || [];
    const soldHistory = salesData || [];
    // Filter leads manually if needed because of the nested property filter
    let allLeads = leadsData || [];
    if (filters.propertyType && filters.propertyType !== 'All') {
        allLeads = allLeads.filter(l => (l.properties as any)?.type === filters.propertyType);
    }
    if (filters.category && filters.category !== 'All') {
        allLeads = allLeads.filter(l => (l.properties as any)?.category === filters.category);
    }
    if (filters.city) {
        allLeads = allLeads.filter(l => (l.properties as any)?.location_city === filters.city);
    }

    // --- Calculate KPIs ---

    // Price Stats (From Sales preferably, fallback to Supply)
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
        // Fallback to active prices
        const tVal = activeProperties.reduce((sum, p) => sum + Number(p.price || 0), 0);
        const tArea = activeProperties.reduce((sum, p) => sum + Number(p.area_usable || 0), 0);
        avgPrice = tVal / activeProperties.length;
        if (tArea > 0) avgPricePerSqm = tVal / tArea;
    }

    // Supply & Demand Numbers
    const totalSupply = activeProperties.length;
    const totalDemand = allLeads.length;

    // Market Temperature: 0 = Extreme Buyer's Market (High Supply, Low Demand)
    // 50 = Balanced, 100 = Extreme Seller's Market (Low Supply, High Demand)
    // Simple heuristic: ratio of leads per active listing per month.
    let marketTemp = 50;
    if (totalSupply > 0) {
        const ratio = totalDemand / totalSupply;
        // Let's say 3 leads per active listing is perfectly balanced (50).
        // 0 leads = 0. 6+ leads = 100.
        marketTemp = Math.min(100, Math.max(0, (ratio / 6) * 100));
    } else if (totalDemand > 0) {
        marketTemp = 100; // Tons of demand, no supply
    }

    const kpis = {
        totalSupply,
        totalDemand,
        avgPrice: Math.round(avgPrice),
        avgPricePerSqm: Math.round(avgPricePerSqm),
        avgDaysOnMarket: compsWithDOMCount > 0 ? Math.round(totalDOM / compsWithDOMCount) : 0,
        marketTemperature: Math.round(marketTemp)
    };

    // --- Construct Trends (Grouped by Month) ---
    const trendsMap = new Map<string, { supply: number; demand: number; salesCount: number; salesTotal: number }>();

    // Initialize map with empty months for the range
    let curDate = startOfMonth(startDate);
    const end = startOfMonth(now);
    while (!isAfter(curDate, end)) {
        trendsMap.set(format(curDate, 'MMM yyyy'), { supply: 0, demand: 0, salesCount: 0, salesTotal: 0 });
        curDate = subMonths(curDate, -1);
    }

    // Bin Sales
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

    // Bin Demand (Leads by created_at)
    allLeads.forEach(lead => {
        if (!lead.created_at) return;
        const d = startOfMonth(new Date(lead.created_at));
        const key = format(d, 'MMM yyyy');
        if (trendsMap.has(key)) {
            const entry = trendsMap.get(key)!;
            entry.demand++;
        }
    });

    // Bin Supply (Active listings by created_at)
    // Note: This shows when current active inventory was added, not a historical snapshot of total inventory at that time.
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

    // --- Distribution (Property Types in Supply) ---
    const distMap = new Map<string, number>();
    activeProperties.forEach(p => {
        const type = p.type || 'Other';
        distMap.set(type, (distMap.get(type) || 0) + 1);
    });
    const distribution = Array.from(distMap.entries()).map(([name, value]) => ({ name, value }));

    // --- Heatmap (Demand by City/Region) ---
    const heatMapR = new Map<string, number>();
    allLeads.forEach(l => {
        const city = (l.properties as any)?.location_city || 'Unknown';
        heatMapR.set(city, (heatMapR.get(city) || 0) + 1);
    });
    const heatMap = Array.from(heatMapR.entries())
        .map(([name, leads]) => ({ name, leads }))
        .sort((a, b) => b.leads - a.leads)
        .slice(0, 5); // Top 5

    // --- Recent Activity Feed ---
    const recentActivity: AnalyticsData['recentActivity'] = [];

    // Add top 3 recent sales
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

    // Add top 3 recent listings
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

    // Sort combined by date
    recentActivity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
        kpis,
        trends,
        distribution,
        heatMap,
        recentActivity: recentActivity.slice(0, 8)
    };
}
