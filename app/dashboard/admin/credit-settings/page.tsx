'use client';

import { useState, useEffect, useTransition } from 'react';
import { Coins, Save, AlertCircle, Wand2, Calculator, Settings } from 'lucide-react';
import { getFeatureCosts, updateFeatureCosts } from '@/app/lib/actions/settings';
import { fetchAllFeatures } from '@/app/lib/admin';

export default function CreditSettingsPage() {
    const [costs, setCosts] = useState<Record<string, number>>({});
    const [features, setFeatures] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        const load = async () => {
            const [costsRes, featuresRes] = await Promise.all([
                getFeatureCosts(),
                fetchAllFeatures()
            ]);
            
            if (costsRes.costs) {
                setCosts(costsRes.costs);
            }
            
            if (featuresRes) {
                setFeatures(featuresRes);
            }
            setIsLoading(false);
        };
        load();
    }, []);

    const handleChange = (key: string, val: string) => {
        setCosts(prev => ({
            ...prev,
            [key]: parseInt(val) || 0
        }));
    };

    const handleSave = () => {
        startTransition(async () => {
            const res = await updateFeatureCosts(costs);
            if (res.error) {
                alert('Eroare: ' + res.error);
            } else {
                alert('Setările au fost salvate cu succes!');
            }
        });
    };

    // Helper map for AI specific features that aren't natively in the generic 'features' db array usually
    // The AI Studio tools are 5 distinct features.
    const aiTools = [
        { key: 'ai_virtual_staging', title: 'Virtual Staging cu AI', icon: Wand2 },
        { key: 'ai_video_generator', title: 'Generator Video AI', icon: Wand2 },
        { key: 'ai_plan_3d', title: 'Plan 2D → 3D', icon: Wand2 },
        { key: 'ai_description', title: 'Generator Descrieri', icon: Wand2 },
        { key: 'ai_room_builder', title: 'Room Builder — Animație', icon: Wand2 }
    ];

    if (isLoading) {
        return <div className="p-8 text-center text-slate-400">Încărcare setări...</div>;
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <header>
                    <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
                        <Coins className="w-8 h-8 text-yellow-500" />
                        Credit & Costs Matrix
                    </h1>
                    <p className="text-slate-400">
                        Set the credit cost for every systemic feature. Users will be deducted these amounts when they use the respective tools.
                    </p>
                </header>

                {/* AI Tools Section */}
                <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2 border-b border-slate-800 pb-4">
                        <Wand2 className="text-purple-500" /> AI Studio Features
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {aiTools.map(tool => (
                            <div key={tool.key} className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="font-semibold">{tool.title}</span>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="number"
                                        min="0"
                                        value={costs[tool.key] !== undefined ? costs[tool.key] : 0}
                                        onChange={(e) => handleChange(tool.key, e.target.value)}
                                        className="w-20 bg-slate-900 border border-slate-700 text-center rounded py-1 outline-none focus:border-yellow-500 transition-colors font-mono"
                                    />
                                    <Coins size={14} className="text-yellow-500" />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* General Features Section */}
                <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2 border-b border-slate-800 pb-4">
                        <Settings className="text-blue-500" /> Standard Platform Features
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Deduplicate features by key to avoid repeating rendering for each Role/Plan combo */}
                        {Array.from(new Map(features.map(item => [item.feature_key, item])).values()).map(feat => (
                            <div key={feat.feature_key} className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
                                <span className="font-semibold capitalize">{feat.feature_label}</span>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="number"
                                        min="0"
                                        value={costs[feat.feature_key] !== undefined ? costs[feat.feature_key] : (feat.feature_key === 'leads_access' ? 5 : 0)}
                                        onChange={(e) => handleChange(feat.feature_key, e.target.value)}
                                        className="w-20 bg-slate-900 border border-slate-700 text-center rounded py-1 outline-none focus:border-yellow-500 transition-colors font-mono"
                                    />
                                    <Coins size={14} className="text-yellow-500" />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <div className="flex justify-end pt-4">
                    <button
                        onClick={handleSave}
                        disabled={isPending}
                        className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                        {isPending ? 'Se salvează...' : <><Save size={20} /> Salvează Costurile</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
