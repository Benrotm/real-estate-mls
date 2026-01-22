'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, X, Building, Users, Briefcase, Zap, Star, ShieldCheck } from 'lucide-react';
import RoleSelector from '../components/RoleSelector';

interface PricingClientProps {
    allFeatures: any[];
    allPlans: any[];
}

export default function PricingClient({ allFeatures, allPlans }: PricingClientProps) {
    const searchParams = useSearchParams();
    const roleParam = searchParams.get('role');

    const [userType, setUserType] = useState<'owner' | 'client' | 'agent' | 'developer'>('owner');

    useEffect(() => {
        if (roleParam && ['owner', 'client', 'agent', 'developer'].includes(roleParam)) {
            setUserType(roleParam as any);
        }
    }, [roleParam]);

    // Construct Plans Dynamic Object
    const buildPlans = () => {
        const plansByRole: any = {};

        // 1. Initialize all plans from the DB first
        allPlans.forEach(plan => {
            if (!plansByRole[plan.role]) plansByRole[plan.role] = [];

            // Fallback icons logic
            let icon = <Building className="w-6 h-6" />;
            if (plan.name.includes('Premium') || plan.name.includes('Pro') || plan.name.includes('Growth')) {
                icon = <Zap className="w-6 h-6" />;
            } else if (plan.name.includes('Enterprise') || plan.name.includes('Scale')) {
                icon = <Briefcase className="w-6 h-6" />;
            }

            plansByRole[plan.role].push({
                name: plan.name,
                price: plan.price,
                description: plan.description,
                listings_limit: plan.listings_limit || 1,
                featured_limit: plan.featured_limit || 0,
                features: [],
                missing: [],
                popular: plan.is_popular,
                icon
            });
        });

        // 2. Map features to the existing plans
        allFeatures.forEach(f => {
            if (!plansByRole[f.role]) return; // Should not happen if plans are synced

            const plan = plansByRole[f.role].find((p: any) => p.name === f.plan_name);
            if (plan) {
                if (f.is_included) {
                    plan.features.push(f.feature_label);
                } else {
                    plan.missing.push(f.feature_label);
                }
            }
        });

        return plansByRole;
    };

    const plans = buildPlans();
    // Default fallback if DB is empty
    const currentPlans = plans[userType] || [];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-8">
                    <div className="inline-block mb-4 px-5 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-bold uppercase tracking-wider shadow-xl shadow-cyan-500/50">
                        <span className="mr-1">⭐</span> Flexible Plans
                    </div>
                    <p className="text-xl text-gray-100 max-w-2xl mx-auto font-medium" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.8)' }}>
                        Select the perfect plan for your needs. Managed dynamically by Super Admin.
                    </p>
                </div>

                <RoleSelector
                    mode="selection"
                    selectedRole={userType}
                    onSelect={setUserType}
                />

                <div className="flex flex-wrap justify-center gap-8">
                    {currentPlans.length === 0 ? (
                        <div className="text-white">No plans configured for this role.</div>
                    ) : (
                        currentPlans.map((plan: any) => (
                            <div key={plan.name} className={`relative rounded-3xl p-8 transition-all duration-500 flex flex-col w-full sm:w-[calc(50%-1rem)] lg:w-[calc(25%-1.5rem)] min-w-[300px] max-w-[340px] group ${plan.popular
                                ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-cyan-400/50 shadow-2xl shadow-cyan-500/20 scale-105 z-10'
                                : 'bg-slate-800/50 backdrop-blur-sm border-2 border-slate-700 hover:border-cyan-500/30 shadow-xl'}`}>

                                {plan.popular && (
                                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg shadow-cyan-500/50 border border-cyan-400">
                                        Most Popular
                                    </div>
                                )}

                                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8 mx-auto transition-transform group-hover:scale-110 duration-300 bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30">
                                    {plan.icon}
                                </div>

                                <div className="text-center mb-8">
                                    <h3 className="text-2xl font-extrabold text-white mb-2 tracking-tight">{plan.name}</h3>
                                    <p className="text-sm text-gray-400 mb-6 h-10 leading-relaxed">{plan.description}</p>
                                    <div className="flex items-baseline justify-center gap-1">
                                        <span className="text-5xl font-black text-white tracking-tighter">${plan.price}</span>
                                        <span className="text-gray-400 text-sm font-medium uppercase tracking-wider">/month</span>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-10 flex-grow">
                                    {/* Dynamic Limits */}
                                    <div className="flex items-start gap-4 text-sm text-gray-200 font-bold bg-slate-700/30 p-2 rounded-lg border border-slate-700">
                                        <div className="mt-1 bg-cyan-500/20 rounded-full p-1 border border-cyan-500/30">
                                            <Check className="w-3 h-3 text-cyan-400" />
                                        </div>
                                        <span>
                                            {plan.listings_limit >= 1000 ? 'Unlimited' : plan.listings_limit} Active Listings
                                        </span>
                                    </div>
                                    <div className="flex items-start gap-4 text-sm text-gray-200 font-bold bg-slate-700/30 p-2 rounded-lg border border-slate-700">
                                        <div className="mt-1 bg-cyan-500/20 rounded-full p-1 border border-cyan-500/30">
                                            <Star className="w-3 h-3 text-cyan-400" />
                                        </div>
                                        <span>
                                            {plan.featured_limit} Featured Listings
                                        </span>
                                    </div>

                                    {plan.features.map((feature: string) => (
                                        <div key={feature} className="flex items-start gap-4 text-sm text-gray-300">
                                            <div className="mt-1 bg-emerald-500/20 rounded-full p-1 border border-emerald-500/30">
                                                <Check className="w-3 h-3 text-emerald-400" />
                                            </div>
                                            <span className="font-medium">{feature}</span>
                                        </div>
                                    ))}
                                    {plan.missing.map((feature: string) => (
                                        <div key={feature} className="flex items-start gap-4 text-sm text-gray-500">
                                            <div className="mt-1 bg-slate-700/50 rounded-full p-1 border border-slate-600">
                                                <X className="w-3 h-3 text-gray-500" />
                                            </div>
                                            <span className="line-through decoration-gray-600">{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    className={`w-full py-4 rounded-xl font-black text-lg transition-all duration-300 transform hover:-translate-y-1 active:scale-95 ${plan.price === 0
                                        ? 'bg-slate-700 text-gray-500 cursor-default opacity-50'
                                        : plan.popular
                                            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-xl shadow-cyan-500/40 hover:shadow-cyan-500/60 border-2 border-cyan-400/50'
                                            : 'bg-white text-slate-900 hover:bg-cyan-50 hover:text-cyan-600 border-2 border-transparent shadow-lg'
                                        }`}
                                >
                                    {plan.price === 0 ? 'Current Plan' : 'Get Started Now'}
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
