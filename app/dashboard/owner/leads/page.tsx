
import { hasFeature, SYSTEM_FEATURES } from '@/app/lib/auth/features';
import { fetchLeads } from '@/app/lib/actions/leads';
import LeadList from '@/app/components/dashboard/LeadList';
import UpgradeBanner from '@/app/components/dashboard/UpgradeBanner';
import { ArrowUpRight, Search } from 'lucide-react';

export default async function OwnerLeadsPage() {
    const hasLeadsAccess = await hasFeature(SYSTEM_FEATURES.LEADS_ACCESS);

    // If access is allowed, fetch leads. Otherwise leads will be empty/undefined.
    const leads = hasLeadsAccess ? await fetchLeads() : [];

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header Stripe */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Leads & CRM</h1>
                            <p className="text-slate-500 text-sm">Potential buyers and tenants for your properties.</p>
                        </div>
                        {hasLeadsAccess && (
                            <div className="flex items-center gap-3">
                                <button className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors">
                                    <ArrowUpRight className="w-4 h-4" /> Export
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {hasLeadsAccess ? (
                    <>
                        {/* Summary Stats or other owner specific info could go here */}
                        <div className="mb-6 flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search leads..."
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        <LeadList leads={leads} basePath="/dashboard/owner/leads" allowEdit={false} />
                    </>
                ) : (
                    <UpgradeBanner
                        title="Unlock Your Property Leads"
                        description="See exactly who is interested in your properties. Upgrade to our Pro plan to access detailed lead profiles, contact information, and manage your pipeline directly"
                        buttonLink="/dashboard/owner/billing" // Assumed path, or just /pricing
                        buttonText="Upgrade to Pro"
                    />
                )}
            </div>
        </div>
    );
}
