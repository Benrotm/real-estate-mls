import { fetchAllFeatures, fetchAllPlans, deleteGlobalFeature } from '@/app/lib/admin';
import { getUserProfile } from '@/app/lib/auth';
import { redirect } from 'next/navigation';
import { Check, Trash2, List, AppWindow, Shield } from 'lucide-react';
import AddGlobalFeatureForm from './AddGlobalFeatureForm';
import SyncFeaturesButton from './SyncFeaturesButton';

export default async function FeaturesPage() {
    const profile = await getUserProfile();

    if (!profile || profile.role !== 'super_admin') {
        redirect('/dashboard');
    }

    const [allFeatures, allPlans] = await Promise.all([
        fetchAllFeatures(),
        fetchAllPlans()
    ]);

    // Deduplicate feature keys
    const uniqueFeatures = Array.from(new Set(allFeatures.map(f => f.feature_key))).map(key => {
        const featureInstances = allFeatures.filter(f => f.feature_key === key);
        return {
            key,
            label: featureInstances[0]?.feature_label || key, // Use first label found
            totalPlans: allPlans.length,
            enabledCount: featureInstances.filter(f => f.is_included).length,
            instances: featureInstances
        };
    });

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8">
            <div className="max-w-7xl mx-auto">
                <header className="flex justify-between items-center mb-12 border-b border-slate-800 pb-8">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold flex items-center gap-3">
                                <List className="w-8 h-8 text-purple-500" />
                                System Features
                            </h1>
                            <SyncFeaturesButton />
                        </div>
                        <p className="text-slate-400 mt-2">Manage all available features across the platform.</p>
                    </div>
                    <AddGlobalFeatureForm />
                </header>

                <div className="grid gap-4">
                    {uniqueFeatures.map(feature => (
                        <div key={feature.key} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 flex items-center justify-between group hover:border-slate-700 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400">
                                    <AppWindow className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">{feature.label}</h3>
                                    <code className="text-xs text-slate-500 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                                        {feature.key}
                                    </code>
                                </div>
                            </div>

                            <div className="flex items-center gap-8">
                                <div className="text-right">
                                    <div className="text-sm font-medium text-slate-300">
                                        Enabled on <span className="text-white font-bold">{feature.enabledCount}</span> / {feature.totalPlans} plans
                                    </div>
                                    <div className="w-32 h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                                        <div
                                            className="h-full bg-purple-500 rounded-full"
                                            style={{ width: `${(feature.enabledCount / feature.totalPlans) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                <form action={async () => {
                                    'use server';
                                    await deleteGlobalFeature(feature.key);
                                }}>
                                    <button
                                        type="submit"
                                        className="p-3 hover:bg-red-500/10 text-slate-500 hover:text-red-500 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                                        title="Delete Global Feature"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </form>
                            </div>
                        </div>
                    ))}

                    {uniqueFeatures.length === 0 && (
                        <div className="text-center py-20 text-slate-500">
                            No features found. Creates one to get started.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
