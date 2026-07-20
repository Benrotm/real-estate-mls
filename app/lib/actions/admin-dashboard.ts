'use server';

import { createAdminClient } from '@/app/lib/supabase/admin';
import { subDays, subMonths, startOfMonth, endOfMonth, format } from 'date-fns';

export interface DashboardData {
    users: {
        total: number;
        byRole: Record<string, number>;
        newThisMonth: number;
        newLastMonth: number;
        recentUsers: { id: string; full_name: string; role: string; plan_tier: string; created_at: string; email?: string }[];
    };
    properties: {
        total: number;
        active: number;
        draft: number;
        sold: number;
        newThisMonth: number;
        newLastMonth: number;
        avgPrice: number;
    };
    leads: {
        total: number;
        byStatus: Record<string, number>;
        newThisMonth: number;
        newLastMonth: number;
    };
    revenue: {
        totalApprovedRon: number;
        totalCreditsSold: number;
        pendingPayments: number;
        pendingAmountRon: number;
        thisMonthRon: number;
        lastMonthRon: number;
    };
    tickets: {
        total: number;
        open: number;
        byPriority: Record<string, number>;
        recentTickets: { id: string; subject: string; status: string; priority: string; created_at: string; user_name?: string }[];
    };
    services: {
        totalRequests: number;
        pendingRequests: number;
        totalProviders: number;
        pendingProviders: number;
    };
    tours: {
        total: number;
        published: number;
    };
    monthlyGrowth: {
        month: string;
        users: number;
        properties: number;
        leads: number;
    }[];
    recentActivity: {
        type: 'user' | 'property' | 'lead' | 'credit' | 'ticket' | 'service_request';
        icon: string;
        title: string;
        detail: string;
        timestamp: string;
    }[];
    pendingApprovals: {
        creditPurchases: { id: string; user_name: string; user_email: string; amount_ron: number; credits: number; reference_id: string; created_at: string }[];
        serviceProviders: { id: string; brand_name: string; category_slug: string; city: string; phone: string; email: string; selected_plan: string; created_at: string }[];
        portalActivations: { id: string; user_name: string; user_email: string; portal_name: string; requested_at: string }[];
        userApprovals: { id: string; full_name: string; email: string; role: string; plan_tier: string; created_at: string }[];
    };
    requestQueues: {
        serviceRequests: { id: string; client_name: string; client_phone: string; category_title: string; request_details: string; status: string; created_at: string }[];
        calculatorRequests: { id: string; name: string; phone: string; property_value: number; selected_model: string; created_at: string }[];
        openTickets: { id: string; subject: string; type: string; priority: string; status: string; user_name: string; user_email: string; created_at: string }[];
    };
}

export async function getDashboardData(): Promise<DashboardData> {
    const supabase = createAdminClient();
    const now = new Date();
    const thisMonthStart = startOfMonth(now).toISOString();
    const lastMonthStart = startOfMonth(subMonths(now, 1)).toISOString();
    const lastMonthEnd = endOfMonth(subMonths(now, 1)).toISOString();

    // ─── 1. USERS ───────────────────────────────────────────────
    const [
        { count: totalUsers },
        { data: allProfiles },
        { count: newUsersThisMonth },
        { count: newUsersLastMonth },
    ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('id, full_name, role, plan_tier, created_at, email').order('created_at', { ascending: false }).limit(200),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', thisMonthStart),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', lastMonthStart).lte('created_at', lastMonthEnd),
    ]);

    const profiles = allProfiles || [];
    const byRole: Record<string, number> = {};
    profiles.forEach((p: any) => {
        byRole[p.role] = (byRole[p.role] || 0) + 1;
    });

    // ─── 2. PROPERTIES ──────────────────────────────────────────
    const [
        { count: totalProperties },
        { count: activeProperties },
        { count: draftProperties },
        { count: soldProperties },
        { count: newPropsThisMonth },
        { count: newPropsLastMonth },
        { data: priceData },
    ] = await Promise.all([
        supabase.from('properties').select('*', { count: 'exact', head: true }),
        supabase.from('properties').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('properties').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
        supabase.from('properties').select('*', { count: 'exact', head: true }).eq('status', 'sold'),
        supabase.from('properties').select('*', { count: 'exact', head: true }).gte('created_at', thisMonthStart),
        supabase.from('properties').select('*', { count: 'exact', head: true }).gte('created_at', lastMonthStart).lte('created_at', lastMonthEnd),
        supabase.from('properties').select('price').eq('status', 'active').not('price', 'is', null).limit(500),
    ]);

    const prices = (priceData || []).map((p: any) => p.price).filter((p: number) => p > 0);
    const avgPrice = prices.length > 0 ? Math.round(prices.reduce((a: number, b: number) => a + b, 0) / prices.length) : 0;

    // ─── 3. LEADS ───────────────────────────────────────────────
    const [
        { count: totalLeads },
        { data: leadStatusData },
        { count: newLeadsThisMonth },
        { count: newLeadsLastMonth },
    ] = await Promise.all([
        supabase.from('leads').select('*', { count: 'exact', head: true }),
        supabase.from('leads').select('status').limit(2000),
        supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', thisMonthStart),
        supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', lastMonthStart).lte('created_at', lastMonthEnd),
    ]);

    const leadsByStatus: Record<string, number> = {};
    (leadStatusData || []).forEach((l: any) => {
        const s = l.status || 'unknown';
        leadsByStatus[s] = (leadsByStatus[s] || 0) + 1;
    });

    // ─── 4. REVENUE (Credit Purchases) ─────────────────────────
    const [
        { data: approvedPurchases },
        { count: pendingPayments },
        { data: pendingPurchaseData },
        { data: thisMonthPurchases },
        { data: lastMonthPurchases },
    ] = await Promise.all([
        supabase.from('credit_purchases').select('amount_ron, credits').eq('status', 'approved'),
        supabase.from('credit_purchases').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('credit_purchases').select('amount_ron').eq('status', 'pending'),
        supabase.from('credit_purchases').select('amount_ron').eq('status', 'approved').gte('created_at', thisMonthStart),
        supabase.from('credit_purchases').select('amount_ron').eq('status', 'approved').gte('created_at', lastMonthStart).lte('created_at', lastMonthEnd),
    ]);

    const totalApprovedRon = (approvedPurchases || []).reduce((sum: number, p: any) => sum + (p.amount_ron || 0), 0);
    const totalCreditsSold = (approvedPurchases || []).reduce((sum: number, p: any) => sum + (p.credits || 0), 0);
    const pendingAmountRon = (pendingPurchaseData || []).reduce((sum: number, p: any) => sum + (p.amount_ron || 0), 0);
    const thisMonthRon = (thisMonthPurchases || []).reduce((sum: number, p: any) => sum + (p.amount_ron || 0), 0);
    const lastMonthRon = (lastMonthPurchases || []).reduce((sum: number, p: any) => sum + (p.amount_ron || 0), 0);

    // ─── 5. TICKETS ─────────────────────────────────────────────
    const [
        { count: totalTickets },
        { count: openTickets },
        { data: ticketPriorityData },
        { data: recentTicketsData },
    ] = await Promise.all([
        supabase.from('tickets').select('*', { count: 'exact', head: true }),
        supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('tickets').select('priority').eq('status', 'open'),
        supabase.from('tickets').select('id, subject, status, priority, created_at, user_id').order('created_at', { ascending: false }).limit(5),
    ]);

    const byPriority: Record<string, number> = {};
    (ticketPriorityData || []).forEach((t: any) => {
        const p = t.priority || 'medium';
        byPriority[p] = (byPriority[p] || 0) + 1;
    });

    // ─── 6. SERVICES ────────────────────────────────────────────
    const [
        { count: totalServiceRequests },
        { count: pendingServiceRequests },
        { count: totalProviders },
        { count: pendingProviders },
    ] = await Promise.all([
        supabase.from('service_requests').select('*', { count: 'exact', head: true }),
        supabase.from('service_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('service_providers').select('*', { count: 'exact', head: true }),
        supabase.from('service_providers').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);

    // ─── 7. TOURS ───────────────────────────────────────────────
    const [
        { count: totalTours },
        { count: publishedTours },
    ] = await Promise.all([
        supabase.from('tours').select('*', { count: 'exact', head: true }),
        supabase.from('tours').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    ]);

    // ─── 8. MONTHLY GROWTH (last 6 months) ──────────────────────
    const monthlyGrowth: DashboardData['monthlyGrowth'] = [];
    for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const mStart = startOfMonth(monthDate).toISOString();
        const mEnd = endOfMonth(monthDate).toISOString();
        const label = format(monthDate, 'MMM yyyy');

        const [
            { count: mUsers },
            { count: mProps },
            { count: mLeads },
        ] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', mStart).lte('created_at', mEnd),
            supabase.from('properties').select('*', { count: 'exact', head: true }).gte('created_at', mStart).lte('created_at', mEnd),
            supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', mStart).lte('created_at', mEnd),
        ]);

        monthlyGrowth.push({
            month: label,
            users: mUsers || 0,
            properties: mProps || 0,
            leads: mLeads || 0,
        });
    }

    // ─── 9. RECENT ACTIVITY FEED ────────────────────────────────
    const recentActivity: DashboardData['recentActivity'] = [];

    // Recent users (last 5)
    const recentUsersSlice = profiles.slice(0, 5);
    recentUsersSlice.forEach((u: any) => {
        recentActivity.push({
            type: 'user',
            icon: '👤',
            title: `Utilizator nou înregistrat`,
            detail: `${u.full_name || 'Anonim'} (${u.role}) — ${u.plan_tier}`,
            timestamp: u.created_at,
        });
    });

    // Recent properties
    const { data: recentProps } = await supabase
        .from('properties')
        .select('id, title, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

    (recentProps || []).forEach((p: any) => {
        recentActivity.push({
            type: 'property',
            icon: '🏠',
            title: `Proprietate ${p.status === 'active' ? 'publicată' : p.status === 'sold' ? 'vândută' : 'adăugată'}`,
            detail: p.title || `Proprietate #${p.id?.slice(0, 8)}`,
            timestamp: p.created_at,
        });
    });

    // Recent leads
    const { data: recentLeads } = await supabase
        .from('leads')
        .select('id, full_name, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

    (recentLeads || []).forEach((l: any) => {
        recentActivity.push({
            type: 'lead',
            icon: '📋',
            title: `Lead nou adăugat`,
            detail: `${l.full_name || 'Anonim'} — Status: ${l.status || 'nou'}`,
            timestamp: l.created_at,
        });
    });

    // Recent credit purchases
    const { data: recentCredits } = await supabase
        .from('credit_purchases')
        .select('id, amount_ron, credits, status, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

    (recentCredits || []).forEach((c: any) => {
        recentActivity.push({
            type: 'credit',
            icon: '💰',
            title: `Achiziție credite ${c.status === 'approved' ? 'aprobată' : c.status === 'pending' ? 'în așteptare' : c.status}`,
            detail: `${c.amount_ron} RON → ${c.credits} credite`,
            timestamp: c.created_at,
        });
    });

    // Recent service requests
    const { data: recentServiceReqs } = await supabase
        .from('service_requests')
        .select('id, client_name, category_title, status, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

    (recentServiceReqs || []).forEach((sr: any) => {
        recentActivity.push({
            type: 'service_request',
            icon: '🔧',
            title: `Solicitare serviciu nouă`,
            detail: `${sr.client_name} — ${sr.category_title}`,
            timestamp: sr.created_at,
        });
    });

    // Recent tickets
    (recentTicketsData || []).forEach((t: any) => {
        recentActivity.push({
            type: 'ticket',
            icon: '🎫',
            title: `Ticket suport: ${t.status}`,
            detail: t.subject || 'Fără subiect',
            timestamp: t.created_at,
        });
    });

    // Sort all activity by timestamp descending
    recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // ─── 10. PENDING APPROVALS ───────────────────────────────────
    const [
        { data: pendingCreditPurchases },
        { data: pendingServiceProvidersList },
        { data: pendingPortalActivations },
        { data: unapprovedUsers },
    ] = await Promise.all([
        supabase.from('credit_purchases').select('id, user_id, amount_ron, credits, reference_id, created_at, profiles:user_id(full_name, email)').eq('status', 'pending').order('created_at', { ascending: false }).limit(20),
        supabase.from('service_providers').select('id, brand_name, category_slug, city, phone, email, selected_plan, created_at').eq('status', 'pending').order('created_at', { ascending: false }).limit(20),
        supabase.from('portal_activations').select('id, user_id, portal_name, requested_at, profiles:user_id(full_name, email)').eq('status', 'pending').order('requested_at', { ascending: false }).limit(20),
        supabase.from('profiles').select('id, full_name, email, role, plan_tier, created_at').eq('is_approved', false).order('created_at', { ascending: false }).limit(20),
    ]);

    // ─── 11. REQUEST QUEUES ──────────────────────────────────────
    const [
        { data: serviceRequestsList },
        { data: calculatorRequestsList },
        { data: openTicketsList },
    ] = await Promise.all([
        supabase.from('service_requests').select('id, client_name, client_phone, category_title, request_details, status, created_at').order('created_at', { ascending: false }).limit(30),
        supabase.from('calculator_requests').select('id, name, phone, property_value, selected_model, created_at').order('created_at', { ascending: false }).limit(20),
        supabase.from('tickets').select('id, subject, type, priority, status, created_at, user_id, profiles:user_id(full_name, email)').in('status', ['open', 'in_progress']).order('created_at', { ascending: false }).limit(20),
    ]);

    return {
        users: {
            total: totalUsers || 0,
            byRole,
            newThisMonth: newUsersThisMonth || 0,
            newLastMonth: newUsersLastMonth || 0,
            recentUsers: recentUsersSlice.map((u: any) => ({
                id: u.id,
                full_name: u.full_name,
                role: u.role,
                plan_tier: u.plan_tier,
                created_at: u.created_at,
                email: u.email,
            })),
        },
        properties: {
            total: totalProperties || 0,
            active: activeProperties || 0,
            draft: draftProperties || 0,
            sold: soldProperties || 0,
            newThisMonth: newPropsThisMonth || 0,
            newLastMonth: newPropsLastMonth || 0,
            avgPrice,
        },
        leads: {
            total: totalLeads || 0,
            byStatus: leadsByStatus,
            newThisMonth: newLeadsThisMonth || 0,
            newLastMonth: newLeadsLastMonth || 0,
        },
        revenue: {
            totalApprovedRon,
            totalCreditsSold,
            pendingPayments: pendingPayments || 0,
            pendingAmountRon,
            thisMonthRon,
            lastMonthRon,
        },
        tickets: {
            total: totalTickets || 0,
            open: openTickets || 0,
            byPriority,
            recentTickets: (recentTicketsData || []).map((t: any) => ({
                id: t.id,
                subject: t.subject,
                status: t.status,
                priority: t.priority,
                created_at: t.created_at,
            })),
        },
        services: {
            totalRequests: totalServiceRequests || 0,
            pendingRequests: pendingServiceRequests || 0,
            totalProviders: totalProviders || 0,
            pendingProviders: pendingProviders || 0,
        },
        tours: {
            total: totalTours || 0,
            published: publishedTours || 0,
        },
        monthlyGrowth,
        recentActivity: recentActivity.slice(0, 20),
        pendingApprovals: {
            creditPurchases: (pendingCreditPurchases || []).map((p: any) => ({
                id: p.id,
                user_name: p.profiles?.full_name || 'Necunoscut',
                user_email: p.profiles?.email || '',
                amount_ron: p.amount_ron,
                credits: p.credits,
                reference_id: p.reference_id,
                created_at: p.created_at,
            })),
            serviceProviders: (pendingServiceProvidersList || []).map((sp: any) => ({
                id: sp.id,
                brand_name: sp.brand_name,
                category_slug: sp.category_slug,
                city: sp.city,
                phone: sp.phone,
                email: sp.email,
                selected_plan: sp.selected_plan,
                created_at: sp.created_at,
            })),
            portalActivations: (pendingPortalActivations || []).map((pa: any) => ({
                id: pa.id,
                user_name: pa.profiles?.full_name || 'Necunoscut',
                user_email: pa.profiles?.email || '',
                portal_name: pa.portal_name,
                requested_at: pa.requested_at,
            })),
            userApprovals: (unapprovedUsers || []).map((u: any) => ({
                id: u.id,
                full_name: u.full_name || 'Anonim',
                email: u.email || '',
                role: u.role,
                plan_tier: u.plan_tier,
                created_at: u.created_at,
            })),
        },
        requestQueues: {
            serviceRequests: (serviceRequestsList || []).map((sr: any) => ({
                id: sr.id,
                client_name: sr.client_name,
                client_phone: sr.client_phone,
                category_title: sr.category_title,
                request_details: sr.request_details || '',
                status: sr.status,
                created_at: sr.created_at,
            })),
            calculatorRequests: (calculatorRequestsList || []).map((cr: any) => ({
                id: cr.id,
                name: cr.name,
                phone: cr.phone,
                property_value: cr.property_value,
                selected_model: cr.selected_model,
                created_at: cr.created_at,
            })),
            openTickets: (openTicketsList || []).map((t: any) => ({
                id: t.id,
                subject: t.subject,
                type: t.type || 'general',
                priority: t.priority,
                status: t.status,
                user_name: t.profiles?.full_name || 'Anonim',
                user_email: t.profiles?.email || '',
                created_at: t.created_at,
            })),
        },
    };
}
