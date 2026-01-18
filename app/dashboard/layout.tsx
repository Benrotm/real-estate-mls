"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Home, BarChart2, Calendar, Phone, Briefcase, Settings, LogOut } from 'lucide-react';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isAgent = pathname.includes('/dashboard/agent');
    const isOwner = pathname.includes('/dashboard/owner');

    // Define menu items based on "role" (derived from URL for this demo)
    const menuItems = isAgent ? [
        { name: 'Overview', icon: LayoutDashboard, href: '/dashboard/agent' },
        { name: 'My Listings', icon: Home, href: '/dashboard/agent/listings' },
        { name: 'Leads & CRM', icon: Users, href: '/dashboard/agent/leads' },
        { name: 'Daily Activities', icon: Calendar, href: '/dashboard/agent/activities' },
        { name: 'Pipeline', icon: BarChart2, href: '/dashboard/agent/pipeline' },
    ] : isOwner ? [
        { name: 'My Properties', icon: Home, href: '/dashboard/owner' },
        { name: 'Valuation Reports', icon: BarChart2, href: '/dashboard/owner/valuation' },
        { name: 'Market Insights', icon: Briefcase, href: '/dashboard/owner/market' },
    ] : [
        // Default / Selection View
        { name: 'Choose Role', icon: Users, href: '/dashboard' }
    ];

    return (
        <div className="flex min-h-screen bg-gray-50/50">
            {/* Sidebar */}
            <aside className="w-64 bg-card border-r border-border hidden md:flex flex-col">
                <div className="p-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <span className="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center text-sm">D</span>
                        Dashboard
                    </h2>
                    <p className="text-xs text-foreground/60 mt-1 uppercase tracking-wider font-semibold">
                        {isAgent ? 'Agent Workspace' : isOwner ? 'Property Owner' : 'Welcome'}
                    </p>
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${isActive
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-foreground/70 hover:bg-secondary/10 hover:text-secondary'
                                    }`}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-border">
                    <Link href="/" className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                <header className="h-16 bg-card border-b border-border flex items-center justify-between px-8 md:hidden">
                    <span className="font-bold">Dashboard</span>
                    {/* Mobile toggle would go here */}
                </header>
                <main className="flex-1 p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
