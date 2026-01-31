"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Home, BarChart2, Calendar, Briefcase, LogOut, Menu, X, MessageSquare, Building, Shield, Settings } from 'lucide-react';

import { SYSTEM_FEATURES } from '@/app/lib/auth/feature-keys';

export default function DashboardClient({
    children,
    features = [],
}: {
    children: React.ReactNode;
    features: string[];
}) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();
    const isAgent = pathname.includes('/dashboard/agent');
    const isOwner = pathname.includes('/dashboard/owner');
    const isDeveloper = pathname.includes('/dashboard/developer');
    const isAdmin = pathname.includes('/dashboard/admin');

    const hasFeature = (key: string) => features.includes(key);

    // Define menu items based on "role" (derived from URL for this demo)
    const menuItems = isAdmin ? [
        { name: 'Console', icon: Shield, href: '/dashboard/admin' },
        { name: 'All Leads', icon: Users, href: '/dashboard/admin/leads' },
        { name: 'All Properties', icon: Building, href: '/dashboard/admin/properties' },
        { name: 'Plan Settings', icon: Briefcase, href: '/dashboard/admin/plans' },
        { name: 'Lead Scoring', icon: BarChart2, href: '/dashboard/admin/scoring' },
        { name: 'Property Scoring', icon: Building, href: '/dashboard/admin/scoring/properties' },
        { name: 'User Management', icon: Users, href: '/dashboard/admin/users' },
        { name: 'System Settings', icon: Settings, href: '/dashboard/admin/settings' },
    ] : isAgent ? [
        { name: 'Overview', icon: LayoutDashboard, href: '/dashboard/agent' },
        { name: 'My Listings', icon: Home, href: '/dashboard/agent/listings' },
        ...(hasFeature(SYSTEM_FEATURES.VALUATION_REPORTS) ? [{ name: 'Valuation Reports', icon: BarChart2, href: '/dashboard/agent/valuation' }] : []),
        ...(hasFeature(SYSTEM_FEATURES.LEADS_ACCESS) ? [{ name: 'Leads & CRM', icon: Users, href: '/dashboard/agent/leads' }] : []),
        { name: 'Daily Activities', icon: Calendar, href: '/dashboard/agent/activities' },
        { name: 'Pipeline', icon: BarChart2, href: '/dashboard/agent/pipeline' },
        { name: 'Chat', icon: MessageSquare, href: '/dashboard/agent/chat' },
    ] : isOwner ? [
        { name: 'My Properties', icon: Home, href: '/dashboard/owner' },
        ...(hasFeature(SYSTEM_FEATURES.VALUATION_REPORTS) ? [{ name: 'Valuation Reports', icon: BarChart2, href: '/dashboard/owner/valuation' }] : []),
        ...(hasFeature(SYSTEM_FEATURES.MARKET_INSIGHTS) ? [{ name: 'Market Insights', icon: Briefcase, href: '/dashboard/owner/market' }] : []),
        { name: 'Chat', icon: MessageSquare, href: '/dashboard/owner/chat' },
    ] : isDeveloper ? [
        { name: 'Overview', icon: LayoutDashboard, href: '/dashboard/developer' },
        { name: 'My Projects', icon: Building, href: '/dashboard/developer/projects' },
        ...(hasFeature(SYSTEM_FEATURES.VALUATION_REPORTS) ? [{ name: 'Valuation Reports', icon: BarChart2, href: '/dashboard/developer/valuation' }] : []),
        { name: 'Analytics', icon: BarChart2, href: '/dashboard/developer/analytics' },
        { name: 'Chat', icon: MessageSquare, href: '/dashboard/developer/chat' },
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
                    {isAdmin ? 'Super Admin' : isAgent ? 'Agent Workspace' : isOwner ? 'Property Owner' : isDeveloper ? 'Developer' : 'Welcome'}
                </p>
            </div>

            <nav className="flex-1 px-4 space-y-1">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${isActive
                                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.name}
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
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                        aria-label="Toggle Menu"
                    >
                        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
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
