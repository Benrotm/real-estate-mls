'use client';

import { useState } from 'react';
import RoleSelector from '@/app/components/RoleSelector';
import PlanEditor from '../PlanEditor';
import { FeatureToggle } from '../FeatureToggle';
import NewFeatureForm from '../NewFeatureForm';
import NewPlanForm from './NewPlanForm';

interface PlanManagerProps {
    allPlans: any[];
    featuresByRole: any;
}

export default function PlanManager({ allPlans, featuresByRole }: PlanManagerProps) {
    const [selectedRole, setSelectedRole] = useState<'owner' | 'client' | 'agent' | 'developer'>('owner');

    // Filter plans for the selected role
    const plansForRole = allPlans.filter(p => p.role === selectedRole);
    const featuresForRole = featuresByRole[selectedRole] || {};

    // Get all features for existing plans + any plan that might not have features yet
    // Note: featuresByRole is grouped by [role][plan_name].
    // We should iterate over PLANS primarily, then look up features.

    return (
        <div className="space-y-12">
            {/* 1. Dynamic Role Selector */}
            <RoleSelector
                mode="selection"
                selectedRole={selectedRole}
                onSelect={setSelectedRole}
            />

            {/* 2. Plan Cards Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {plansForRole.map((plan: any) => {
                    const planFeatures = featuresForRole[plan.name] || [];

                    return (
                        <div key={plan.id} className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col">
                            <div className="mb-6 border-b border-slate-800 pb-6">
                                <h4 className="font-bold text-2xl text-white mb-4">{plan.name}</h4>
                                <PlanEditor plan={plan} />
                            </div>

                            <div className="flex-1 space-y-4">
                                <h5 className="text-sm font-bold text-slate-500 uppercase">System Features</h5>
                                <div className="space-y-3 mb-6">
                                    {planFeatures.filter((f: any) => ['leads_access', 'valuation_reports', 'market_insights'].includes(f.feature_key)).map((feature: any) => (
                                        <FeatureToggle key={feature.id} feature={feature} />
                                    ))}
                                </div>

                                <h5 className="text-sm font-bold text-slate-500 uppercase">Marketing Features</h5>
                                <div className="space-y-3">
                                    {planFeatures.filter((f: any) => !['leads_access', 'valuation_reports', 'market_insights'].includes(f.feature_key)).map((feature: any) => (
                                        <FeatureToggle key={feature.id} feature={feature} />
                                    ))}
                                    <NewFeatureForm role={selectedRole} planName={plan.name} />
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* 3. Add New Plan Card */}
                <NewPlanForm role={selectedRole} />
            </div>
        </div>
    );
}
