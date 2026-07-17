"use client";
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, LayoutDashboard, Users, Home, BarChart2, Calendar, Briefcase, LogOut, Menu, X, MessageSquare, Building, Shield, Settings, TrendingUp, Flag, LifeBuoy, Check, Globe, Camera, Heart, FileDown, CopyCheck, Target, Zap, Activity, DollarSign, Wand2, Coins, Calculator, Gift, ShieldAlert, History, FileText, Key, Share2, HelpCircle, ChevronLeft, ChevronRight } from 'lucide-react';

import { SYSTEM_FEATURES } from '@/app/lib/auth/feature-keys';
import { supabase } from '@/app/lib/supabase/client';
import { getUnreadNotificationsCount } from '@/app/lib/actions/notifications';
import { getTotalUnreadMessagesCount } from '@/app/lib/actions/chat';
import { getCollaborationContractDeleteRequests } from '@/app/lib/actions/collaboration-contracts';
import { getMenuOrderings, getMenuVisibilitySettings } from '@/app/lib/actions/admin-settings';
import { DEFAULT_MENUS, MENU_ICONS } from '@/app/lib/constants/menu';

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
    const primaryRole = profile?.role;
    const isPrimaryAdmin = primaryRole === 'admin' || primaryRole === 'super_admin' || primaryRole === 'superadmin';
    const isPrimaryAgent = primaryRole === 'agent';

    const activeRole = isPrimaryAdmin ? 'admin'
        : isPrimaryAgent ? 'agent'
        : pathname.includes('/dashboard/agent') ? 'agent'
        : pathname.includes('/dashboard/owner') ? 'owner'
        : pathname.includes('/dashboard/developer') ? 'developer'
        : pathname.includes('/dashboard/client') ? 'client'
        : pathname.includes('/dashboard/admin') ? 'admin'
        : primaryRole;

    const isAgent = activeRole === 'agent';
    const isOwner = activeRole === 'owner';
    const isDeveloper = activeRole === 'developer';
    const isClient = activeRole === 'client';
    const isAdmin = activeRole === 'admin' || activeRole === 'super_admin' || activeRole === 'superadmin';

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

    const [customOrderings, setCustomOrderings] = useState<Record<string, string[]>>({});
    const [hiddenMenuItems, setHiddenMenuItems] = useState<Record<string, string[]>>({});
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        async function loadMenuOrderAndVisibility() {
            const order = await getMenuOrderings();
            if (order) {
                setCustomOrderings(order);
            }
            const hidden = await getMenuVisibilitySettings();
            if (hidden) {
                setHiddenMenuItems(hidden);
            }
        }
        loadMenuOrderAndVisibility();
    }, []);

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    const roleKey = isAdmin ? 'admin'
        : isAgent ? 'agent'
        : isOwner ? 'owner'
        : isDeveloper ? 'developer'
        : isClient ? 'client'
        : '';

    const defaultList = roleKey ? DEFAULT_MENUS[roleKey] : [];
    const activeHidden = hiddenMenuItems[roleKey] || [];

    const filteredList = defaultList.filter(item => {
        if (activeHidden.includes(item.name)) {
            return false;
        }
        if (item.superAdminOnly && profile?.role !== 'super_admin') {
            return false;
        }
        if (item.isAgencyManagerOnly && !isAgencyManager) {
            return false;
        }
        if (item.requiresFeature && !hasFeature(item.requiresFeature)) {
            return false;
        }
        return true;
    });

    const activeOrder = customOrderings[roleKey] || [];
    const sortedList = [...filteredList].sort((a, b) => {
        const indexA = activeOrder.indexOf(a.name);
        const indexB = activeOrder.indexOf(b.name);
        
        const hasA = indexA !== -1;
        const hasB = indexB !== -1;

        if (hasA && hasB) return indexA - indexB;
        if (hasA) return -1;
        if (hasB) return 1;
        
        return defaultList.indexOf(a) - defaultList.indexOf(b);
    });

    const menuItems = sortedList.map(item => ({
        name: item.name,
        icon: MENU_ICONS[item.icon] || HelpCircle,
        href: item.href
    }));

    const NavContent = ({ forceOpen = false }: { forceOpen?: boolean }) => {
        const collapsed = isCollapsed && !forceOpen;
        return (
            <>
                <div className="p-6">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                        <span className="w-8 h-8 bg-orange-500 text-white rounded-lg flex items-center justify-center text-sm font-bold shrink-0">D</span>
                        {!collapsed && <span className="animate-in fade-in duration-300">Dashboard</span>}
                    </h2>
                    {!collapsed && (
                        <div className="animate-in fade-in duration-300">
                            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold truncate">
                                {isAdmin ? 'Super Admin' : isAgent ? 'Agent Workspace' : isOwner ? 'Property Owner' : isDeveloper ? 'Developer' : isClient ? 'Client Dashboard' : 'Welcome'}
                            </p>
                            <Link href="/cont/plati" className="mt-4 flex items-center justify-between bg-black/30 border border-slate-700/50 hover:border-yellow-500/50 p-2.5 rounded-xl transition-colors cursor-pointer group">
                                <span className="text-xs font-semibold text-slate-400 group-hover:text-white transition-colors flex items-center gap-1.5"><Coins className="w-4 h-4 text-yellow-500" /> Balanță Credite</span>
                                <span className="text-sm font-bold text-yellow-500">{credits}</span>
                            </Link>
                        </div>
                    )}
                    {collapsed && (
                        <Link href="/cont/plati" className="mt-4 flex items-center justify-center bg-black/30 border border-slate-700/50 hover:border-yellow-500/50 p-2 rounded-xl transition-colors cursor-pointer text-yellow-500 animate-in fade-in duration-300" title={`Balance: ${credits} Credits`}>
                            <Coins className="w-5 h-5" />
                        </Link>
                    )}
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                title={collapsed ? item.name : undefined}
                                className={`relative flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-4 py-3 text-sm font-medium rounded-lg transition-colors ${isActive
                                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <item.icon className="w-5 h-5 shrink-0" />
                                    {!collapsed && <span className="truncate animate-in fade-in duration-300">{item.name}</span>}
                                </div>
                                
                                {!collapsed && (
                                    <div className="flex items-center gap-1">
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
                                    </div>
                                )}
                                {collapsed && (
                                    <>
                                        {((item.name === 'Chat' || item.name === 'Support Chat') && chatUnread > 0) && (
                                            <span className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full" />
                                        )}
                                        {(item.name === 'Leads & CRM' && leadsUnread > 0) && (
                                            <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full" />
                                        )}
                                        {(item.name === 'Contract Deletions' && deletionRequestsCount > 0) && (
                                            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full" />
                                        )}
                                        {(item.name === 'Validare Plăți' && pendingPaymentsCount > 0) && (
                                            <span className="absolute top-2 right-2 w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                                        )}
                                    </>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <Link href="/" className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors`} title={collapsed ? "Sign Out" : undefined}>
                        <LogOut className="w-5 h-5 shrink-0" />
                        {!collapsed && <span className="animate-in fade-in duration-300">Sign Out</span>}
                    </Link>
                </div>
            </>
        );
    };

    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Desktop Sidebar */}
            <aside className={`bg-slate-900 border-r border-slate-800 hidden md:flex flex-col shadow-xl z-20 transition-all duration-300 relative ${isCollapsed ? 'w-20' : 'w-64'}`}>
                {/* Floating Expand/Collapse Button */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute top-8 -right-3 w-6 h-6 bg-orange-500 hover:bg-orange-600 rounded-full flex items-center justify-center text-white border border-slate-900 shadow-md z-30 transition-all transform hover:scale-110 active:scale-95 cursor-pointer group animate-in fade-in duration-300"
                    title={isCollapsed ? "Expand Menu" : "Collapse Menu"}
                >
                    {isCollapsed ? (
                        <ChevronRight className="w-3.5 h-3.5 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5 animate-bounce-horizontal" />
                    ) : (
                        <ChevronLeft className="w-3.5 h-3.5 transition-transform duration-300 ease-in-out group-hover:-translate-x-0.5 animate-bounce-horizontal-left" />
                    )}
                </button>
                <NavContent />
            </aside>

            {/* Mobile Header & Overlay */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile Top Bar */}
                <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 md:hidden text-white shadow-md z-40 sticky top-16">
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
                    <div className="fixed inset-0 top-32 z-30 bg-slate-900 md:hidden flex flex-col animate-in fade-in slide-in-from-top-4 duration-200">
                        <div className="flex-1 overflow-y-auto">
                            <NavContent forceOpen={true} />
                        </div>
                    </div>
                )}

                {/* Main page content */}
                <main className="flex-1 p-1 md:p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
