import { fetchAllFeatures, fetchAllPlans, impersonateRole, stopImpersonation, updatePlanFeature } from '@/app/lib/admin';
import { getUserProfile } from '@/app/lib/auth';
import { redirect } from 'next/navigation';
import { Shield, Eye, Settings, Check, X, LogOut, Users } from 'lucide-react';
import PlanManager from './PlanManager';

export default async function PlansPage() {
    const profile = await getUserProfile();

    if (!profile || profile.role !== 'super_admin') {
        redirect('/dashboard');
    }

    const allFeatures = await fetchAllFeatures();
    const allPlans = await fetchAllPlans() || [];

    // Group Features by Plan/Role
    const featuresByRole: any = {};
    allFeatures?.forEach(f => {
        if (!featuresByRole[f.role]) featuresByRole[f.role] = {};
        if (!featuresByRole[f.role][f.plan_name]) featuresByRole[f.role][f.plan_name] = [];
        featuresByRole[f.role][f.plan_name].push(f);
    });

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-12 border-b border-slate-800 pb-8">
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Settings className="w-8 h-8 text-blue-500" />
                        Plan Settings & Pricing
                    </h1>
                    <p className="text-slate-400 mt-2">Configure pricing tiers and feature availability.</p>
                </header>

                <PlanManager allPlans={allPlans} featuresByRole={featuresByRole} />
            </div>
        </div>
    );
}
