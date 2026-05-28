
import { hasFeature, SYSTEM_FEATURES } from '@/app/lib/auth/features';
import { fetchLeads, getUnlockedLeadIds } from '@/app/lib/actions/leads';
import { getUserCredits } from '@/app/lib/actions/credits';
import { getFeatureCosts } from '@/app/lib/actions/settings';
import LeadList from '@/app/components/dashboard/LeadList';
import NotificationSync from '@/app/components/notifications/NotificationSync';
import { ArrowUpRight, Coins, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/app/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function OwnerLeadsPage() {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return redirect('/login');
    }

    const hasLeadsAccess = await hasFeature(SYSTEM_FEATURES.LEADS_ACCESS);

    // Fetch leads. Owners can view all raw leads on their properties but contact info will be masked.
    const rawLeads = await fetchLeads();

    let leads = rawLeads;
    let unlockedLeadIds: string[] = [];
    let leadUnlockCost = 5;
    let userCredits = 0;

    if (!hasLeadsAccess) {
        // Fetch user's credits
        const creditsRes = await getUserCredits();
        userCredits = creditsRes && 'credits' in creditsRes ? (creditsRes.credits || 0) : 0;

        // Fetch feature cost for leads_access
        const costsRes = await getFeatureCosts();
        const costs = costsRes.costs || {};
        leadUnlockCost = costs['leads_access'] !== undefined ? costs['leads_access'] : 5;

        // Fetch unlocked lead IDs
        unlockedLeadIds = await getUnlockedLeadIds();

        // Server-side masking for locked leads (only own leads, not partner leads)
        leads = rawLeads.map((lead: any) => {
            const isOwnLead = lead.agent_id === user.id;
            if (!isOwnLead) {
                return lead;
            }

            const isUnlocked = unlockedLeadIds.includes(lead.id);
            if (isUnlocked) {
                return {
                    ...lead,
                    isLocked: false,
                };
            } else {
                return {
                    ...lead,
                    isLocked: true,
                    name: 'Client Interest',
                    email: null,
                    phone: null,
                    notes: `Locked. Cost to unlock: ${leadUnlockCost} credits.`,
                };
            }
        });
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <NotificationSync types={['lead', 'inquiry', 'offer']} />
            {/* Header Stripe */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Leads & CRM</h1>
                            <p className="text-slate-500 text-sm">Potential buyers and tenants for your properties.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            {!hasLeadsAccess && (
                                <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1.5 rounded-lg text-yellow-700 text-sm font-bold">
                                    <Coins className="w-4 h-4 text-yellow-600" />
                                    <span>Balanță: {userCredits} CR</span>
                                </div>
                            )}
                            {(hasLeadsAccess || rawLeads.length > 0) && (
                                <button className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors">
                                    <ArrowUpRight className="w-4 h-4" /> Export
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {!hasLeadsAccess && (
                    <div className="bg-gradient-to-r from-orange-600 to-amber-500 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse shrink-0" />
                                <span className="font-extrabold uppercase tracking-wider text-xs text-orange-100">Plan Limitări Active</span>
                            </div>
                            <h2 className="text-xl font-bold tracking-tight">Deblochează Contactele din Leads & CRM</h2>
                            <p className="text-orange-50 text-sm max-w-2xl font-medium">
                                Sunteți pe un plan gratuit. Puteți vedea cererile și bugetele clienților, însă detaliile de contact sunt ascunse. Deblocați lead-urile individual folosind credite.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 shrink-0">
                            <Link href="/cont/plati" className="px-5 py-2.5 bg-orange-700 hover:bg-orange-800 text-white rounded-xl font-bold text-sm border border-orange-600 transition-all shadow-md active:scale-95 flex items-center gap-1.5">
                                <Coins className="w-4 h-4" /> Alimentează Credite
                            </Link>
                        </div>
                    </div>
                )}

                <LeadList
                    leads={leads}
                    basePath="/dashboard/owner/leads"
                    allowEdit={false}
                    hasLeadsAccess={hasLeadsAccess}
                    userCredits={userCredits}
                    leadUnlockCost={leadUnlockCost}
                    currentUserId={user.id}
                />
            </div>
        </div>
    );
}
