import { redirect } from 'next/navigation';
import { getUserProfile } from '@/app/lib/auth';
import { UserCheck, Building, ArrowRight, Search, Shield } from 'lucide-react';
import Link from 'next/link';

export default async function DashboardHome() {
    const profile = await getUserProfile();

    if (!profile) {
        redirect('/auth/login');
    }

    // Automatic redirection based on role
    if (profile.role === 'owner') redirect('/dashboard/owner');
    if (profile.role === 'agent') redirect('/dashboard/agent');
    if (profile.role === 'developer') redirect('/dashboard/developer');
    if (profile.role === 'super_admin') redirect('/dashboard/admin');
    if (profile.role === 'client') redirect('/properties');

    // Fallback UI (e.g. if role is missing or invalid, though uncommon)
    // We keep the old UI as a fallback/debug view
    return (
        <div className="max-w-4xl mx-auto text-center mt-20">
            <h1 className="text-3xl font-bold mb-4">Welcome to Imobum Dashboard</h1>
            <p className="text-foreground/60 mb-12 max-w-lg mx-auto">
                We couldn't determine your specific dashboard. Please select one below or contact support.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Admin Card */}
                <Link href="/dashboard/admin" className="group text-left p-6 bg-card border border-border rounded-2xl hover:border-sidebar-primary hover:shadow-xl transition-all relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center mb-4 group-hover:bg-red-500 group-hover:text-white transition-colors relative z-10">
                        <Shield className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">Super Admin</h2>
                    <p className="text-foreground/60 text-sm mb-4">
                        Configure plans, manage users, and system settings.
                    </p>
                    <div className="flex items-center text-red-500 text-sm font-medium">
                        Open Console <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                </Link>
                <Link href="/dashboard/agent" className="group text-left p-8 bg-card border border-border rounded-2xl hover:border-secondary hover:shadow-xl transition-all">
                    <div className="w-14 h-14 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                        <UserCheck className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Real Estate Agent</h2>
                    <p className="text-foreground/60 mb-6">
                        Manage listings, track leads, input daily activities (calls, appointments), and monitor your sales pipeline.
                    </p>
                    <div className="flex items-center text-primary font-medium">
                        Enter Workspace <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                </Link>

                {/* Owner Card */}
                <Link href="/dashboard/owner" className="group text-left p-8 bg-card border border-border rounded-2xl hover:border-secondary hover:shadow-xl transition-all">
                    <div className="w-14 h-14 bg-secondary/10 text-secondary rounded-xl flex items-center justify-center mb-6 group-hover:bg-secondary group-hover:text-white transition-colors">
                        <Building className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Property Owner</h2>
                    <p className="text-foreground/60 mb-6">
                        View your property performance, check estimated market valuations, and see incoming inquiries.
                    </p>
                    <div className="flex items-center text-secondary font-medium">
                        View Properties <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                </Link>

                {/* Client/Visitor Card */}
                <Link href="/properties" className="group text-left p-8 bg-card border border-border rounded-2xl hover:border-secondary hover:shadow-xl transition-all">
                    <div className="w-14 h-14 bg-accent text-foreground rounded-xl flex items-center justify-center mb-6 group-hover:bg-secondary group-hover:text-white transition-colors">
                        <Search className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Client / Visitor</h2>
                    <p className="text-foreground/60 mb-6">
                        Browse properties, explore virtual tours, check market prices, and contact agents.
                    </p>
                    <div className="flex items-center text-foreground font-medium group-hover:text-secondary transition-colors">
                        Explore Listings <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                </Link>
            </div>
        </div>
    );
}
