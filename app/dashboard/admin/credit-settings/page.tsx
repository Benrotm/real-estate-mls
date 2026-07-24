'use client';

import { useState, useEffect, useTransition } from 'react';
import { Coins, Save, AlertCircle, Wand2, Calculator, Settings, Plus, Globe, Gavel } from 'lucide-react';
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
        { key: 'ai_room_builder', title: 'Room Builder — Animație', icon: Wand2 },
        { key: 'instant_ai_activation_cost', title: 'Cost Activare Instantă cu AI (Client Self-Service)', icon: Wand2 }
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

                {/* Listing & Promotion Features Section */}
                <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2 border-b border-slate-800 pb-4">
                        <Plus className="text-emerald-500" /> Listing & Promotion Features
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
                            <span className="font-semibold">Adăugare Slot Anunț Suplimentar</span>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number"
                                    min="0"
                                    value={costs['add_listing'] !== undefined ? costs['add_listing'] : 5}
                                    onChange={(e) => handleChange('add_listing', e.target.value)}
                                    className="w-20 bg-slate-900 border border-slate-700 text-center rounded py-1 outline-none focus:border-yellow-500 transition-colors font-mono"
                                />
                                <Coins size={14} className="text-yellow-500" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
                            <span className="font-semibold">Adăugare Slot Promovat (Featured)</span>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number"
                                    min="0"
                                    value={costs['featured_listing'] !== undefined ? costs['featured_listing'] : 10}
                                    onChange={(e) => handleChange('featured_listing', e.target.value)}
                                    className="w-20 bg-slate-900 border border-slate-700 text-center rounded py-1 outline-none focus:border-yellow-500 transition-colors font-mono"
                                />
                                <Coins size={14} className="text-yellow-500" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800 col-span-1 md:col-span-2">
                            <span className="font-semibold">Cost Prelungire Anunț (după 30 de zile)</span>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number"
                                    min="0"
                                    value={costs['listing_renewal'] !== undefined ? costs['listing_renewal'] : 2}
                                    onChange={(e) => handleChange('listing_renewal', e.target.value)}
                                    className="w-20 bg-slate-900 border border-slate-700 text-center rounded py-1 outline-none focus:border-yellow-500 transition-colors font-mono"
                                />
                                <Coins size={14} className="text-yellow-500" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Live Open Offers Section */}
                <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2 border-b border-slate-800 pb-4">
                        <Gavel className="text-violet-500" /> Live Open Offers Features
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
                            <span className="font-semibold">Deschidere Sesiune Oferte (Cost Proprietar)</span>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number"
                                    min="0"
                                    value={costs['open_offers_start'] !== undefined ? costs['open_offers_start'] : 5}
                                    onChange={(e) => handleChange('open_offers_start', e.target.value)}
                                    className="w-20 bg-slate-900 border border-slate-700 text-center rounded py-1 outline-none focus:border-yellow-500 transition-colors font-mono"
                                />
                                <Coins size={14} className="text-yellow-500" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
                            <span className="font-semibold">Trimitere Ofertă (Cost Ofertant)</span>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number"
                                    min="0"
                                    value={costs['open_offers_submit'] !== undefined ? costs['open_offers_submit'] : 1}
                                    onChange={(e) => handleChange('open_offers_submit', e.target.value)}
                                    className="w-20 bg-slate-900 border border-slate-700 text-center rounded py-1 outline-none focus:border-yellow-500 transition-colors font-mono"
                                />
                                <Coins size={14} className="text-yellow-500" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800 col-span-1 md:col-span-2">
                            <span className="font-semibold">Anulare Sesiune manual (Penalizare Proprietar)</span>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number"
                                    min="0"
                                    value={costs['open_offers_cancel'] !== undefined ? costs['open_offers_cancel'] : 10}
                                    onChange={(e) => handleChange('open_offers_cancel', e.target.value)}
                                    className="w-20 bg-slate-900 border border-slate-700 text-center rounded py-1 outline-none focus:border-yellow-500 transition-colors font-mono"
                                />
                                <Coins size={14} className="text-yellow-500" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Rewards & Contributions Section */}
                <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2 border-b border-slate-800 pb-4">
                        <Coins className="text-yellow-500 animate-pulse" /> Rewards & Contributions
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
                            <span className="font-semibold">Recompensă Raportare SOLD (Contribuție Preț)</span>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number"
                                    min="0"
                                    value={costs['price_contribution_reward'] !== undefined ? costs['price_contribution_reward'] : 10}
                                    onChange={(e) => handleChange('price_contribution_reward', e.target.value)}
                                    className="w-20 bg-slate-900 border border-slate-700 text-center rounded py-1 outline-none focus:border-yellow-500 transition-colors font-mono"
                                />
                                <Coins size={14} className="text-yellow-500" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
                            <span className="font-semibold">Recompensă Adăugare Anunț Activ</span>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number"
                                    min="0"
                                    value={costs['add_listing_reward'] !== undefined ? costs['add_listing_reward'] : 5}
                                    onChange={(e) => handleChange('add_listing_reward', e.target.value)}
                                    className="w-20 bg-slate-900 border border-slate-700 text-center rounded py-1 outline-none focus:border-yellow-500 transition-colors font-mono"
                                />
                                <Coins size={14} className="text-yellow-500" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800 col-span-1 md:col-span-2">
                            <div>
                                <span className="font-semibold block text-white">Comision Referral Client Fără Agenție (%)</span>
                                <span className="text-xs text-slate-400">Procentul din credite acordat ca comision referrer-ului pentru consumul clienților invitați</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <input 
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={costs['referral_client_no_agency_commission_percentage'] !== undefined ? costs['referral_client_no_agency_commission_percentage'] : 15}
                                    onChange={(e) => handleChange('referral_client_no_agency_commission_percentage', e.target.value)}
                                    className="w-20 bg-slate-900 border border-slate-700 text-center rounded py-1 outline-none focus:border-yellow-500 transition-colors font-mono"
                                />
                                <span className="text-yellow-500 font-bold text-sm">%</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800 col-span-1 md:col-span-2">
                            <div>
                                <span className="font-semibold block text-white">Credite Inițiale Alocate la Înregistrare Client Fără Agenție</span>
                                <span className="text-xs text-slate-400">Numărul de credite cadou acordat automat la crearea contului unui client nou</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <input 
                                    type="number"
                                    min="0"
                                    value={costs['client_no_agency_initial_credits'] !== undefined ? costs['client_no_agency_initial_credits'] : 15}
                                    onChange={(e) => handleChange('client_no_agency_initial_credits', e.target.value)}
                                    className="w-20 bg-slate-900 border border-slate-700 text-center rounded py-1 outline-none focus:border-yellow-500 transition-colors font-mono"
                                />
                                <Coins size={14} className="text-yellow-500" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800 col-span-1 md:col-span-2">
                            <div>
                                <span className="font-semibold block text-white">Credite Cadou Acordate Referrer-ului la Înregistrare Client Nou</span>
                                <span className="text-xs text-slate-400">Numărul de credite oferite cadou utilizatorului/agentului care trimite invitația când un prieten își creează cont</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <input 
                                    type="number"
                                    min="0"
                                    value={costs['referral_gift_credits_per_friend'] !== undefined ? costs['referral_gift_credits_per_friend'] : 15}
                                    onChange={(e) => handleChange('referral_gift_credits_per_friend', e.target.value)}
                                    className="w-20 bg-slate-900 border border-slate-700 text-center rounded py-1 outline-none focus:border-yellow-500 transition-colors font-mono"
                                />
                                <Coins size={14} className="text-yellow-500" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Advanced Feature Upgrades Section */}
                <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2 border-b border-slate-800 pb-4">
                        <Settings className="text-yellow-500" /> Advanced Feature Upgrades
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
                            <span className="font-semibold">Cost Deblocare ACP Market Insights</span>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number"
                                    min="0"
                                    value={costs['unlock_market_insights'] !== undefined ? costs['unlock_market_insights'] : 20}
                                    onChange={(e) => handleChange('unlock_market_insights', e.target.value)}
                                    className="w-20 bg-slate-900 border border-slate-700 text-center rounded py-1 outline-none focus:border-yellow-500 transition-colors font-mono"
                                />
                                <Coins size={14} className="text-yellow-500" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
                            <span className="font-semibold">Cost Upgrade la cont Agency</span>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number"
                                    min="0"
                                    value={costs['upgrade_agency_cost'] !== undefined ? costs['upgrade_agency_cost'] : 500}
                                    onChange={(e) => handleChange('upgrade_agency_cost', e.target.value)}
                                    className="w-20 bg-slate-900 border border-slate-700 text-center rounded py-1 outline-none focus:border-yellow-500 transition-colors font-mono"
                                />
                                <Coins size={14} className="text-yellow-500" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Portal Export Features Section */}
                <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2 border-b border-slate-800 pb-4">
                        <Globe className="text-blue-400" /> Portal Export Features
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
                            <span className="font-semibold">Export Imobiliare.ro</span>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number"
                                    min="0"
                                    value={costs['publish_imobiliare'] !== undefined ? costs['publish_imobiliare'] : 2}
                                    onChange={(e) => handleChange('publish_imobiliare', e.target.value)}
                                    className="w-20 bg-slate-900 border border-slate-700 text-center rounded py-1 outline-none focus:border-yellow-500 transition-colors font-mono"
                                />
                                <Coins size={14} className="text-yellow-500" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
                            <span className="font-semibold">Export Storia / OLX</span>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number"
                                    min="0"
                                    value={costs['publish_storia'] !== undefined ? costs['publish_storia'] : 2}
                                    onChange={(e) => handleChange('publish_storia', e.target.value)}
                                    className="w-20 bg-slate-900 border border-slate-700 text-center rounded py-1 outline-none focus:border-yellow-500 transition-colors font-mono"
                                />
                                <Coins size={14} className="text-yellow-500" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
                            <span className="font-semibold">Export Romimo / Publi24</span>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number"
                                    min="0"
                                    value={costs['publish_romimo'] !== undefined ? costs['publish_romimo'] : 2}
                                    onChange={(e) => handleChange('publish_romimo', e.target.value)}
                                    className="w-20 bg-slate-900 border border-slate-700 text-center rounded py-1 outline-none focus:border-yellow-500 transition-colors font-mono"
                                />
                                <Coins size={14} className="text-yellow-500" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
                            <span className="font-semibold">Promovare Romimo / Publi24 (Promo Points)</span>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number"
                                    min="0"
                                    value={costs['promote_romimo'] !== undefined ? costs['promote_romimo'] : 5}
                                    onChange={(e) => handleChange('promote_romimo', e.target.value)}
                                    className="w-20 bg-slate-900 border border-slate-700 text-center rounded py-1 outline-none focus:border-yellow-500 transition-colors font-mono"
                                />
                                <Coins size={14} className="text-yellow-500" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
                            <span className="font-semibold">Export HomeZZ / LaJumate</span>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number"
                                    min="0"
                                    value={costs['publish_homezz'] !== undefined ? costs['publish_homezz'] : 2}
                                    onChange={(e) => handleChange('publish_homezz', e.target.value)}
                                    className="w-20 bg-slate-900 border border-slate-700 text-center rounded py-1 outline-none focus:border-yellow-500 transition-colors font-mono"
                                />
                                <Coins size={14} className="text-yellow-500" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
                            <span className="font-semibold">Export ImobiliarePret.ro</span>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number"
                                    min="0"
                                    value={costs['publish_imobiliarepret'] !== undefined ? costs['publish_imobiliarepret'] : 2}
                                    onChange={(e) => handleChange('publish_imobiliarepret', e.target.value)}
                                    className="w-20 bg-slate-900 border border-slate-700 text-center rounded py-1 outline-none focus:border-yellow-500 transition-colors font-mono"
                                />
                                <Coins size={14} className="text-yellow-500" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
                            <span className="font-semibold">Social: WhatsApp Groups</span>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number"
                                    min="0"
                                    value={costs['publish_whatsapp_groups'] !== undefined ? costs['publish_whatsapp_groups'] : 2}
                                    onChange={(e) => handleChange('publish_whatsapp_groups', e.target.value)}
                                    className="w-20 bg-slate-900 border border-slate-700 text-center rounded py-1 outline-none focus:border-yellow-500 transition-colors font-mono"
                                />
                                <Coins size={14} className="text-yellow-500" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
                            <span className="font-semibold">Social: Facebook Groups</span>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number"
                                    min="0"
                                    value={costs['publish_facebook_groups'] !== undefined ? costs['publish_facebook_groups'] : 2}
                                    onChange={(e) => handleChange('publish_facebook_groups', e.target.value)}
                                    className="w-20 bg-slate-900 border border-slate-700 text-center rounded py-1 outline-none focus:border-yellow-500 transition-colors font-mono"
                                />
                                <Coins size={14} className="text-yellow-500" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
                            <span className="font-semibold">Social: Facebook Page</span>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number"
                                    min="0"
                                    value={costs['publish_facebook_page'] !== undefined ? costs['publish_facebook_page'] : 2}
                                    onChange={(e) => handleChange('publish_facebook_page', e.target.value)}
                                    className="w-20 bg-slate-900 border border-slate-700 text-center rounded py-1 outline-none focus:border-yellow-500 transition-colors font-mono"
                                />
                                <Coins size={14} className="text-yellow-500" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
                            <span className="font-semibold">Social: Instagram Page</span>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number"
                                    min="0"
                                    value={costs['publish_instagram'] !== undefined ? costs['publish_instagram'] : 2}
                                    onChange={(e) => handleChange('publish_instagram', e.target.value)}
                                    className="w-20 bg-slate-900 border border-slate-700 text-center rounded py-1 outline-none focus:border-yellow-500 transition-colors font-mono"
                                />
                                <Coins size={14} className="text-yellow-500" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
                            <span className="font-semibold">Social: TikTok Page</span>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number"
                                    min="0"
                                    value={costs['publish_tiktok'] !== undefined ? costs['publish_tiktok'] : 2}
                                    onChange={(e) => handleChange('publish_tiktok', e.target.value)}
                                    className="w-20 bg-slate-900 border border-slate-700 text-center rounded py-1 outline-none focus:border-yellow-500 transition-colors font-mono"
                                />
                                <Coins size={14} className="text-yellow-500" />
                            </div>
                        </div>
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
