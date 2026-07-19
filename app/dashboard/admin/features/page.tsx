import { fetchAllFeatures, fetchAllPlans, deleteGlobalFeature } from '@/app/lib/admin';
import { getUserProfile } from '@/app/lib/auth';
import { redirect } from 'next/navigation';
import { Check, Trash2, List, AppWindow, Shield } from 'lucide-react';
import AddGlobalFeatureForm from './AddGlobalFeatureForm';
import SyncFeaturesButton from './SyncFeaturesButton';
import FeaturesListClient from './FeaturesListClient';

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

                <FeaturesListClient initialFeatures={uniqueFeatures} />
            </div>
        </div>
    );
}
