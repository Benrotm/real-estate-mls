import Link from 'next/link';
import { UserCheck, Building, ArrowRight, Search } from 'lucide-react';

export default function DashboardHome() {
    return (
        <div className="max-w-4xl mx-auto text-center mt-20">
            <h1 className="text-3xl font-bold mb-4">Welcome to EstateMLS Dashboard</h1>
            <p className="text-foreground/60 mb-12 max-w-lg mx-auto">
                Select a role to view the specific dashboard experience. In a real app, this would be determined by your login credentials.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Agent Card */}
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
