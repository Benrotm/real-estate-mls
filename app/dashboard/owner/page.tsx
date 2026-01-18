import { MOCK_PROPERTIES } from "@/app/lib/properties";
import Link from 'next/link';
import { ArrowRight, TrendingUp } from 'lucide-react';

export default function OwnerDashboard() {
    // Filter mock properties for a specific "owner" (simulated)
    const myProperties = MOCK_PROPERTIES.slice(0, 2);
    const totalValue = myProperties.reduce((acc, p) => acc + (p.valuation?.estimatedPrice || p.price), 0);

    const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold mb-2">My Portfolio</h1>
                <p className="text-foreground/60">Overview of your real estate assets and their market performance.</p>
            </div>

            {/* Portfolio Summary */}
            <div className="bg-gradient-to-r from-primary to-slate-900 rounded-2xl p-8 text-white shadow-lg">
                <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                    <div>
                        <div className="text-white/60 mb-1">Total Portfolio Value (Est.)</div>
                        <div className="text-4xl font-bold">{formatter.format(totalValue)}</div>
                        <div className="flex items-center gap-2 mt-2 text-green-400 text-sm font-medium">
                            <TrendingUp className="w-4 h-4" /> +5.2% in last 3 months
                        </div>
                    </div>
                    <button className="bg-white/10 hover:bg-white/20 px-6 py-2 rounded-lg font-medium transition-colors border border-white/20">
                        View Detailed Report
                    </button>
                </div>
            </div>

            {/* Property List */}
            <div>
                <h2 className="text-xl font-bold mb-4">My Properties</h2>
                <div className="space-y-4">
                    {myProperties.map(property => (
                        <div key={property.id} className="bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row items-center gap-6 hover:shadow-md transition-shadow">
                            <img src={property.images[0]} alt={property.title} className="w-full md:w-32 h-32 md:h-24 object-cover rounded-lg" />

                            <div className="flex-1">
                                <h3 className="font-bold text-lg mb-1">{property.title}</h3>
                                <p className="text-sm text-foreground/60 mb-2">{property.location.address}</p>
                                <div className="flex gap-4 text-sm">
                                    <span className="flex items-center gap-1 text-green-600 font-medium">
                                        Est: {formatter.format(property.valuation?.estimatedPrice || 0)}
                                    </span>
                                    <span className="text-foreground/40">|</span>
                                    <span className="text-foreground/60">Listed: {formatter.format(property.price)}</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 w-full md:w-auto">
                                <Link href={`/properties/${property.id}`} className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-secondary/10 hover:text-secondary hover:border-secondary transition-colors text-center">
                                    View Listing
                                </Link>
                                <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                                    Inquiries (3)
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
