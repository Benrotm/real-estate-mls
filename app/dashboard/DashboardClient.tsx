"use client";
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Home, BarChart2, Calendar, Briefcase, LogOut, Menu, X, MessageSquare, Building, Shield, Settings, TrendingUp, Flag, LifeBuoy, Check, Globe, Camera, Heart, FileDown, CopyCheck, Target, Zap, Activity, DollarSign, Wand2, Coins, Calculator, Gift, ShieldAlert, History } from 'lucide-react';

import { SYSTEM_FEATURES } from '@/app/lib/auth/feature-keys';
import { supabase } from '@/app/lib/supabase/client';
import { getUnreadNotificationsCount } from '@/app/lib/actions/notifications';
import { getTotalUnreadMessagesCount } from '@/app/lib/actions/chat';
import { getCollaborationContractDeleteRequests } from '@/app/lib/actions/collaboration-contracts';

export default function DashboardClient({
    children,
    features = [],
    profile,
}: {
    children: React.ReactNode;
    features: string[];
    profile?: any;
}) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();
    const isAgent = pathname.includes('/dashboard/agent');
    const isOwner = pathname.includes('/dashboard/owner');
    const isDeveloper = pathname.includes('/dashboard/developer');
    const isClient = pathname.includes('/dashboard/client');
    const isAdmin = pathname.includes('/dashboard/admin');

    const hasFeature = (key: string) => features.includes(key);

    const [chatUnread, setChatUnread] = useState(0);
    const [leadsUnread, setLeadsUnread] = useState(0);
    const [credits, setCredits] = useState(0);
    const [deletionRequestsCount, setDeletionRequestsCount] = useState(0);
    const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);

    const fetchCounts = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Fetch REAL unread message count (bypassing notifications table latency)
        const unreadMsgCount = await getTotalUnreadMessagesCount(user.id);
        setChatUnread(unreadMsgCount);

        // Fetch User Profile info for Credits and Deletion Requests
        const { data: userProfile } = await supabase
            .from('profiles')
            .select('credits, role, plan_tier')
            .eq('id', user.id)
            .single();

        if (userProfile) {
            setCredits(userProfile.credits || 0);
            
            const isUserAdmin = userProfile.role === 'super_admin' || userProfile.role === 'admin';
            const isUserTeamLeader = userProfile.role === 'agent' && userProfile.plan_tier === 'enterprise';
            if (isUserAdmin || isUserTeamLeader) {
                const delRes = await getCollaborationContractDeleteRequests();
                if (delRes.success && delRes.contracts) {
                    setDeletionRequestsCount(delRes.contracts.length);
                }
            }
            if (isUserAdmin) {
                const { count, error } = await supabase
                    .from('credit_purchases')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'pending');
                if (!error && count !== null) {
                    setPendingPaymentsCount(count);
                }
            } else {
                setPendingPaymentsCount(0);
            }
        }

        // 2. Get Lead/CRM notifications by type for existing badges
        const { data: notifs } = await supabase
            .from('notifications')
            .select('type')
            .eq('user_id', user.id)
            .eq('is_read', false);

        if (notifs) {
            setLeadsUnread(notifs.filter(n => n.type === 'offer' || n.type === 'inquiry' || n.type === 'lead').length);
        }
    }, []);

    useEffect(() => {
        const setupRealtime = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            fetchCounts();

            // Listener for general notifications (Leads, etc.)
            const notifChannel = supabase
                .channel('dashboard-badges-notifs')
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
                    () => fetchCounts()
                )
                .subscribe();

            // Listener for REALTIME messages (Chat)
            const msgChannel = supabase
                .channel(`dashboard-badges-msgs-${user.id}`)
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'messages' },
                    () => fetchCounts()
                )
                .subscribe();

            const contractChannel = supabase
                .channel('dashboard-badges-contracts')
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'collaboration_contracts' },
                    () => fetchCounts()
                )
                .subscribe();

            // Listener for REALTIME credit purchases
            const purchaseChannel = supabase
                .channel('dashboard-badges-purchases')
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'credit_purchases' },
                    () => fetchCounts()
                )
                .subscribe();

            return () => {
                supabase.removeChannel(notifChannel);
                supabase.removeChannel(msgChannel);
                supabase.removeChannel(contractChannel);
                supabase.removeChannel(purchaseChannel);
            };
        };

        setupRealtime();
    }, [fetchCounts]);

    const isAgencyManager = isAgent && profile?.plan_tier === 'enterprise';

    // Define menu items based on "role" (derived from URL for this demo)
    const menuItems = isAdmin ? [
        { name: 'Console', icon: Shield, href: '/dashboard/admin' },
        { name: 'Leads & CRM', icon: Users, href: '/dashboard/admin/leads' },
        { name: 'ACP Market Insights', icon: Briefcase, href: '/dashboard/admin/market' },
        { name: 'Market Analytics', icon: TrendingUp, href: '/dashboard/admin/analytics' },
        { name: 'Pipeline', icon: BarChart2, href: '/dashboard/admin/pipeline' },
        { name: 'My Properties', icon: Home, href: '/dashboard/admin/my-properties' },
        { name: 'All Properties', icon: Building, href: '/dashboard/admin/properties' },
        { name: 'Contract Deletions', icon: ShieldAlert, href: '/dashboard/admin/contract-deletions' },
        { name: 'AI Studio', icon: Wand2, href: '/dashboard/admin/ai-staging' },
        { name: 'All Virtual Tours', icon: Globe, href: '/dashboard/admin/tours' },
        { name: 'Tour Maker', icon: Camera, href: '/dashboard/owner/tours' },
        { name: 'Valuation Settings', icon: TrendingUp, href: '/dashboard/admin/valuation' },
        { name: 'Valuation Reports', icon: BarChart2, href: '/dashboard/admin/valuation/reports' },
        { name: 'Plan Settings', icon: Briefcase, href: '/dashboard/admin/plans' },
        { name: 'Features', icon: Check, href: '/dashboard/admin/features' },
        { name: 'AI Matching Engine', icon: Zap, href: '/dashboard/admin/scoring/match' },
        { name: 'User Management', icon: Users, href: '/dashboard/admin/users' },
        { name: 'Tickets & Reports', icon: Flag, href: '/dashboard/admin/tickets' }, // Admin view
        { name: 'System Settings', icon: Settings, href: '/dashboard/admin/settings' },
        { name: 'Calculator Settings', icon: Calculator, href: '/dashboard/admin/settings/calculator-comisioane' },
        { name: 'Credit & Costs System', icon: Coins, href: '/dashboard/admin/credit-settings' },
        { name: 'Validare Plăți', icon: DollarSign, href: '/dashboard/admin/validare-plati' },
        { name: 'Istoric Credite Global', icon: History, href: '/dashboard/admin/credit-history' },
        { name: 'AI Provider Config', icon: Settings, href: '/dashboard/admin/ai-settings' },
        { name: 'Imoflux', icon: CopyCheck, href: '/dashboard/admin/imofluxmls' },
        { name: 'Sold Imoflux', icon: Target, href: '/dashboard/admin/sold-immoflux' },
        { name: 'FluxMLS', icon: CopyCheck, href: '/dashboard/admin/fluxmls' },
        { name: 'Single Import', icon: Globe, href: '/dashboard/admin/properties/import' },
        { name: 'Bulk Import', icon: FileDown, href: '/dashboard/admin/bulk-import' },
        { name: 'Bulk Import OLX', icon: Globe, href: '/dashboard/admin/bulk-import-olx' },
        { name: 'Alimentare Credite', icon: Coins, href: '/cont/plati' },
        { name: 'Invită un Prieten', icon: Gift, href: '/cont/profil' },
        { name: 'Chat', icon: MessageSquare, href: '/dashboard/admin/chat' },
        { name: 'Support Chat', icon: LifeBuoy, href: '/dashboard/admin/support-chat' },
    ] : isAgent ? [
        { name: 'Overview', icon: LayoutDashboard, href: '/dashboard/agent' },
        ...(isAgencyManager ? [
            { name: 'My Team', icon: Users, href: '/dashboard/agent/team' },
            { name: 'Agency ROI', icon: TrendingUp, href: '/dashboard/agent/roi' },
            { name: 'Team Activities', icon: Activity, href: '/dashboard/agent/team-activities' },
            { name: 'Contract Deletions', icon: ShieldAlert, href: '/dashboard/agent/contract-deletions' },
        ] : []),
        { name: 'My Finances', icon: DollarSign, href: '/dashboard/agent/finances' },
        { name: 'My Listings', icon: Home, href: '/dashboard/agent/listings' },
        { name: 'My Favorites', icon: Heart, href: '/dashboard/agent/favorites' }, // New
        { name: 'Leads & CRM', icon: Users, href: '/dashboard/agent/leads' },
        { name: 'Pipeline', icon: BarChart2, href: '/dashboard/agent/pipeline' },
        { name: 'Collaboration Contracts', icon: CopyCheck, href: '/dashboard/agent/collaboration-contracts' },
        ...(hasFeature(SYSTEM_FEATURES.AI_STUDIO) ? [{ name: 'AI Studio', icon: Wand2, href: '/dashboard/agent/ai-staging' }] : []),
        { name: 'Valuation Reports', icon: BarChart2, href: '/dashboard/agent/valuation' },
        { name: 'ACP Market Insights', icon: Briefcase, href: '/dashboard/agent/market' },
        { name: 'Market Analytics', icon: TrendingUp, href: '/dashboard/agent/analytics' },
        { name: 'Daily Activities', icon: Calendar, href: '/dashboard/agent/activities' },
        { name: 'Alimentare Credite', icon: Coins, href: '/cont/plati' },
        { name: 'Invită un Prieten', icon: Gift, href: '/cont/profil' },
        { name: 'Chat', icon: MessageSquare, href: '/dashboard/agent/chat' },
        { name: 'Support Chat', icon: LifeBuoy, href: '/dashboard/agent/support-chat' },
        { name: 'Report & Suggest', icon: Flag, href: '/dashboard/agent/report' },
    ] : isOwner ? [
        { name: 'Overview', icon: LayoutDashboard, href: '/dashboard/owner' },
        { name: 'My Properties', icon: Home, href: '/dashboard/owner/properties' },
        { name: 'My Favorites', icon: Heart, href: '/dashboard/owner/favorites' }, // New
        ...(hasFeature(SYSTEM_FEATURES.AI_STUDIO) ? [{ name: 'AI Studio', icon: Wand2, href: '/dashboard/owner/ai-staging' }] : []),
        { name: 'Virtual Tours', icon: Globe, href: '/dashboard/owner/tours' },
        { name: 'Leads & CRM', icon: Users, href: '/dashboard/owner/leads' }, // Always show for owners to upsell
        { name: 'Valuation Reports', icon: BarChart2, href: '/dashboard/owner/valuation' },
        { name: 'ACP Market Insights', icon: Briefcase, href: '/dashboard/owner/market' },
        { name: 'Market Analytics', icon: TrendingUp, href: '/dashboard/owner/analytics' },
        { name: 'Alimentare Credite', icon: Coins, href: '/cont/plati' },
        { name: 'Invită un Prieten', icon: Gift, href: '/cont/profil' },
        { name: 'Chat', icon: MessageSquare, href: '/dashboard/owner/chat' },
        { name: 'Support Chat', icon: LifeBuoy, href: '/dashboard/owner/support-chat' },
        { name: 'Report & Suggest', icon: Flag, href: '/dashboard/owner/report' },
    ] : isDeveloper ? [
        { name: 'Overview', icon: LayoutDashboard, href: '/dashboard/developer' },
        ...(hasFeature(SYSTEM_FEATURES.AI_STUDIO) ? [{ name: 'AI Studio', icon: Wand2, href: '/dashboard/developer/ai-staging' }] : []),
        { name: 'My Projects', icon: Building, href: '/dashboard/developer/projects' },
        ...(hasFeature(SYSTEM_FEATURES.VALUATION_REPORTS) ? [{ name: 'Valuation Reports', icon: BarChart2, href: '/dashboard/developer/valuation' }] : []),
        { name: 'Analytics', icon: BarChart2, href: '/dashboard/developer/analytics' },
        { name: 'Alimentare Credite', icon: Coins, href: '/cont/plati' },
        { name: 'Invită un Prieten', icon: Gift, href: '/cont/profil' },
        { name: 'Chat', icon: MessageSquare, href: '/dashboard/developer/chat' },
        { name: 'Support Chat', icon: LifeBuoy, href: '/dashboard/developer/support-chat' },
        { name: 'Report & Suggest', icon: Flag, href: '/dashboard/developer/report' },
    ] : isClient ? [
        { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard/client' },
        { name: 'Browse Properties', icon: Building, href: '/properties' },
        { name: 'My Favorites', icon: Heart, href: '/dashboard/client/favorites' }, // New
        { name: 'My Offers', icon: DollarSign, href: '/dashboard/client/offers' },
        { name: 'AI Studio', icon: Wand2, href: '/dashboard/client/ai-staging' },
        { name: 'Saved Searches', icon: Briefcase, href: '/dashboard/client/searches' },
        { name: 'Valuation Reports', icon: BarChart2, href: '/dashboard/client/valuation' },
        { name: 'ACP Market Insights', icon: BarChart2, href: '/dashboard/client/market' },
        { name: 'Market Analytics', icon: TrendingUp, href: '/dashboard/client/analytics' },
        { name: 'Alimentare Credite', icon: Coins, href: '/cont/plati' },
        { name: 'Invită un Prieten', icon: Gift, href: '/cont/profil' },
        { name: 'Chat', icon: MessageSquare, href: '/dashboard/client/chat' },
        { name: 'Support Chat', icon: LifeBuoy, href: '/dashboard/client/support-chat' },
        { name: 'Report & Suggest', icon: Flag, href: '/dashboard/client/report' },
    ] : [
        // Default / Selection View
        { name: 'Choose Role', icon: Users, href: '/dashboard' }
    ];

    const NavContent = () => (
        <>
            <div className="p-6">
                <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                    <span className="w-8 h-8 bg-orange-500 text-white rounded-lg flex items-center justify-center text-sm font-bold">D</span>
                    Dashboard
                </h2>
                <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
                    {isAdmin ? 'Super Admin' : isAgent ? 'Agent Workspace' : isOwner ? 'Property Owner' : isDeveloper ? 'Developer' : isClient ? 'Client Dashboard' : 'Welcome'}
                </p>
                <Link href="/cont/plati" className="mt-4 flex items-center justify-between bg-black/30 border border-slate-700/50 hover:border-yellow-500/50 p-2.5 rounded-xl transition-colors cursor-pointer group">
                    <span className="text-xs font-semibold text-slate-400 group-hover:text-white transition-colors flex items-center gap-1.5"><Coins className="w-4 h-4 text-yellow-500" /> Balanță Credite</span>
                    <span className="text-sm font-bold text-yellow-500">{credits}</span>
                </Link>
            </div>

            <nav className="flex-1 px-4 space-y-1">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-colors ${isActive
                                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon className="w-5 h-5" />
                                {item.name}
                            </div>
                            {(item.name === 'Chat' || item.name === 'Support Chat') && chatUnread > 0 && (
                                <span className="bg-green-500 text-white text-[10px] font-normal px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-md">
                                    {chatUnread > 9 ? '9+' : chatUnread}
                                </span>
                            )}
                            {item.name === 'Leads & CRM' && leadsUnread > 0 && (
                                <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                    {leadsUnread > 9 ? '9+' : leadsUnread}
                                </span>
                            )}
                            {item.name === 'Contract Deletions' && deletionRequestsCount > 0 && (
                                <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                    {deletionRequestsCount}
                                </span>
                            )}
                            {item.name === 'Validare Plăți' && pendingPaymentsCount > 0 && (
                                <span className="bg-yellow-500 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-md animate-pulse">
                                    {pendingPaymentsCount}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <Link href="/" className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors">
                    <LogOut className="w-5 h-5" />
                    Sign Out
                </Link>
            </div>
        </>
    );

    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Desktop Sidebar */}
            <aside className="w-64 bg-slate-900 border-r border-slate-800 hidden md:flex flex-col shadow-xl z-20">
                <NavContent />
            </aside>

            {/* Mobile Header & Overlay */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile Top Bar */}
                <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 md:hidden text-white shadow-md z-30 sticky top-0">
                    <div className="flex items-center gap-2">
                        <span className="w-8 h-8 bg-orange-500 text-white rounded-lg flex items-center justify-center text-sm font-bold">D</span>
                        <span className="font-bold text-lg">Dashboard</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/cont/plati" className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700 hover:border-yellow-500/50 transition-colors">
                           <Coins className="w-3 h-3 text-yellow-500" />
                           <span className="text-xs font-bold text-yellow-500">{credits}</span>
                        </Link>
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                            aria-label="Toggle Menu"
                    >
                        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                    </div>
                </header>

                {/* Mobile Full Screen Menu Overlay */}
                {isMobileMenuOpen && (
                    <div className="fixed inset-0 top-16 z-20 bg-slate-900 md:hidden flex flex-col animate-in fade-in slide-in-from-top-4 duration-200">
                        <div className="flex-1 overflow-y-auto">
                            <NavContent />
                        </div>
                    </div>
                )}

                {/* Main page content */}
                <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
