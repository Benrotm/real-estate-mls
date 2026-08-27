'use client';

import { useState, useEffect, useTransition } from 'react';
import { Coins, Save, AlertCircle, Wand2, Calculator, Settings, Plus, Globe, Gavel, Info, ExternalLink, HelpCircle, X, Sparkles, RefreshCw } from 'lucide-react';
import { getFeatureCosts, updateFeatureCosts } from '@/app/lib/actions/settings';
import { fetchAllFeatures } from '@/app/lib/admin';

export default function CreditSettingsPage() {
    const [costs, setCosts] = useState<Record<string, number>>({});
    const [features, setFeatures] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPending, startTransition] = useTransition();
    const [selectedInfoTool, setSelectedInfoTool] = useState<any | null>(null);

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

    const handleChange = (key: string, value: string) => {
        const val = parseInt(value, 10);
        setCosts(prev => ({
            ...prev,
            [key]: isNaN(val) ? 0 : val
        }));
    };

    const handleSave = () => {
        startTransition(async () => {
            const res = await updateFeatureCosts(costs);
            if (res.error) {
                alert(`Eroare: ${res.error}`);
            } else {
                alert('Setările au fost salvate cu succes!');
            }
        });
    };

    // AI Tools detailed catalog with provider, model, pricing and official pricing URLs
    const aiTools = [
        { 
            key: 'ai_virtual_staging', 
            title: 'Virtual Staging cu AI', 
            icon: Wand2,
            provider: 'Fal.ai / Replicate',
            model: 'Flux Dev / ControlNet Inpainting',
            apiCostEstimate: '~0.03$ - 0.05$ / randare',
            recommendedCredits: '5 credite',
            description: 'Înlocuiește sau adaugă mobilier într-un spațiu gol, păstrând pereții, ferestrele și pardoseala.',
            pricingUrl: 'https://fal.ai/models/fal-ai/flux/dev'
        },
        { 
            key: 'ai_panorama_360', 
            title: 'Tur Virtual 360° Panoramic per Cameră', 
            icon: Wand2,
            provider: 'Fal.ai / Google AI Studio',
            model: 'Fal Flux Equirectangular 360 / Imagen 3',
            apiCostEstimate: '~0.025$ / panoramă (Fal) | ~0.03$ (Google)',
            recommendedCredits: '5 credite',
            description: 'Generează o imagine panoramică sferică 2:1 explorabilă interactiv la 360° cu mouse-ul sau pe telefon.',
            pricingUrl: 'https://fal.ai/models/fal-ai/flux/dev'
        },
        { 
            key: 'ai_walkthrough_2stage', 
            title: 'Walkthrough 2-Stage (Plan → Render Interior → Video)', 
            icon: Wand2,
            provider: 'Fal.ai & Google DeepMind',
            model: 'Etapa 1: Flux Dev / Imagen 3 | Etapa 2: Kling AI / Veo 3.1',
            apiCostEstimate: '~0.03$ (foto) + ~0.25$ - 0.40$ (video)',
            recommendedCredits: '12 - 18 credite',
            description: 'Cea mai fidelă abordare: Randează mai întâi o fotografie la nivelul ochilor din schiță, apoi o animă în video HD.',
            pricingUrl: 'https://fal.ai/models/fal-ai/kling-video/v1/standard/image-to-video'
        },
        { 
            key: 'ai_walkthrough_isometric', 
            title: 'Tur Video Izometric 3D (Fly-Through din Schiță)', 
            icon: Wand2,
            provider: 'Fal.ai (Kling AI) / Google Veo 3.1',
            model: 'Kling Video v1 Standard / Veo 3.1 Fast',
            apiCostEstimate: '~0.25$ (5s) | ~0.50$ (10s)',
            recommendedCredits: '10 - 16 credite',
            description: 'Generează o animație cinematică aeriană orbitală 3D deasupra schiței, păstrând pereții și camerele 100% fidele.',
            pricingUrl: 'https://ai.google.dev/pricing'
        },
        { 
            key: 'ai_video_generator', 
            title: 'Generator Video AI (Slideshow / Motion)', 
            icon: Wand2,
            provider: 'Fal.ai / Replicate',
            model: 'Kling Video / Luma Dream Machine',
            apiCostEstimate: '~0.20$ - 0.40$ / clip video',
            recommendedCredits: '10 credite',
            description: 'Transformă pozele proprietății într-un videoclip cu tranziții fluide, titluri și muzică de fundal.',
            pricingUrl: 'https://fal.ai/pricing'
        },
        { 
            key: 'ai_plan_3d', 
            title: 'Plan 2D → Vizualizare 3D', 
            icon: Wand2,
            provider: 'Google AI Studio / Fal.ai',
            model: 'Gemini 3.6 Flash + Imagen 3 / Flux',
            apiCostEstimate: '~0.02$ - 0.04$ / randare',
            recommendedCredits: '4 credite',
            description: 'Transformă schița desenată sau planul 2D într-o machetă axonometrică 3D mobilată.',
            pricingUrl: 'https://ai.google.dev/pricing'
        },
        { 
            key: 'ai_description', 
            title: 'Generator Descrieri Imobiliare AI', 
            icon: Wand2,
            provider: 'Google AI Studio / OpenAI',
            model: 'Gemini 3.6 Flash / GPT-4o Mini',
            apiCostEstimate: '< 0.001$ (sub 1 cent) / descriere',
            recommendedCredits: '1 credit (sau inclus gratuit)',
            description: 'Generează titluri atractive și descrieri persuasive în limba română adaptate pentru site sau rețele sociale.',
            pricingUrl: 'https://ai.google.dev/pricing'
        },
        { 
            key: 'ai_room_builder', 
            title: 'Room Builder — Animație Mobilare', 
            icon: Wand2,
            provider: 'Fal.ai',
            model: 'Kling Video v1 Image-to-Video',
            apiCostEstimate: '~0.25$ / animație',
            recommendedCredits: '8 credite',
            description: 'Animație scurtă în care piesele de mobilier apar treptat în cameră.',
            pricingUrl: 'https://fal.ai/models/fal-ai/kling-video/v1/standard/image-to-video'
        },
        { 
            key: 'ai_walkthrough_video', 
            title: 'Video Walkthrough 3D Standard (5–8 sec)', 
            icon: Wand2,
            provider: 'Google Veo 3.1 / Fal.ai Kling',
            model: 'veo-3.1-fast-generate-preview / kling-video-v1',
            apiCostEstimate: '~0.20$ - 0.30$ / randare',
            recommendedCredits: '10 credite',
            description: 'Randare video directă de 5-8 secunde pe baza schiței și a promptului tehnic.',
            pricingUrl: 'https://ai.google.dev/pricing'
        },
        { 
            key: 'ai_walkthrough_video_extended', 
            title: 'Video Walkthrough 3D Extins (10–15 sec)', 
            icon: Wand2,
            provider: 'Fal.ai Kling Video Extended',
            model: 'kling-video/v1/standard (durată 10s sau 15s)',
            apiCostEstimate: '~0.50$ - 0.75$ / randare extinsă',
            recommendedCredits: '18 credite',
            description: 'Randare video extinsă de 10 sau 15 secunde pentru prezentări mai ample de apartament.',
            pricingUrl: 'https://fal.ai/pricing'
        },
        { 
            key: 'instant_ai_activation_cost', 
            title: 'Cost Activare Instantă cu AI (Client Self-Service)', 
            icon: Wand2,
            provider: 'Sistem Intern Imobum',
            model: 'Pipeline automat AI Data Extraction',
            apiCostEstimate: '~0.05$',
            recommendedCredits: '5 credite',
            description: 'Cost dedus din balanța utilizatorului când activează un anunț instant cu asistență AI.',
            pricingUrl: 'https://imobum.com'
        }
    ];

    if (isLoading) {
        return <div className="p-8 text-center text-slate-400">Încărcare setări...</div>;
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8">
            <div className="max-w-5xl mx-auto space-y-8">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
                            <Coins className="w-8 h-8 text-yellow-500" />
                            Matrice Credite & Costuri AI Platformă
                        </h1>
                        <p className="text-slate-400 text-sm">
                            Configurează câte credite consumă fiecare acțiune și consultă modelele AI, costurile API reale per rulare și linkurile oficiale de prețuri.
                        </p>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={isPending}
                        className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-bold rounded-xl shadow-lg flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 flex-shrink-0"
                    >
                        <Save size={18} />
                        {isPending ? 'Salvare...' : 'Salvează Toate Modificările'}
                    </button>
                </header>

                {/* AI Tools Section */}
                <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
                        <div className="flex items-center gap-2.5">
                            <Sparkles className="text-yellow-400 w-5 h-5" />
                            <h2 className="text-xl font-bold text-white">Instrumente AI Studio & Generatoare</h2>
                        </div>
                        <span className="text-xs text-slate-400">
                            💡 Apasă pe pictograma <Info size={14} className="inline text-cyan-400 mx-0.5" /> pentru a vedea furnizorul, modelul și costul API în dolari
                        </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {aiTools.map(tool => (
                            <div key={tool.key} className="flex flex-col justify-between p-4 bg-slate-950/80 hover:bg-slate-950 rounded-xl border border-slate-800 hover:border-slate-700 transition-all space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-2.5">
                                        <div className="p-2 bg-slate-900 rounded-lg text-yellow-400 mt-0.5 border border-white/5">
                                            <tool.icon size={16} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-semibold text-sm text-slate-100">{tool.title}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedInfoTool(tool)}
                                                    className="text-slate-400 hover:text-cyan-300 transition-colors p-1 rounded-md hover:bg-cyan-500/10 cursor-pointer"
                                                    title="Detalii Furnizor, Model AI & Costuri"
                                                >
                                                    <Info size={15} className="text-cyan-400" />
                                                </button>
                                            </div>
                                            <span className="text-[11px] text-slate-400 block font-mono mt-0.5">
                                                {tool.provider} • <span className="text-cyan-400/90">{tool.apiCostEstimate}</span>
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <input 
                                            type="number"
                                            min="0"
                                            value={costs[tool.key] !== undefined ? costs[tool.key] : 0}
                                            onChange={(e) => handleChange(tool.key, e.target.value)}
                                            className="w-20 bg-slate-900 border border-slate-700 text-center rounded-lg py-1.5 text-yellow-300 font-bold outline-none focus:border-yellow-500 transition-colors font-mono text-sm"
                                        />
                                        <span className="text-xs text-slate-400 font-medium">credite</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* MODAL DETALII INFO MODEL & COSTURI */}
                    {selectedInfoTool && (
                        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
                                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-400 border border-yellow-500/20">
                                            <Sparkles size={18} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white text-base">{selectedInfoTool.title}</h3>
                                            <span className="text-[11px] font-mono text-slate-400">Cheie: {selectedInfoTool.key}</span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setSelectedInfoTool(null)}
                                        className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3.5 rounded-xl border border-white/5">
                                    {selectedInfoTool.description}
                                </p>

                                <div className="space-y-3 text-xs">
                                    <div className="flex justify-between py-2 border-b border-slate-800">
                                        <span className="text-slate-400">Furnizor AI Utilizat:</span>
                                        <span className="font-semibold text-slate-200">{selectedInfoTool.provider}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-slate-800">
                                        <span className="text-slate-400">Model(e) AI Active:</span>
                                        <span className="font-mono text-cyan-300">{selectedInfoTool.model}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-slate-800">
                                        <span className="text-slate-400">Cost API Brut Estimativ:</span>
                                        <span className="font-bold text-amber-300">{selectedInfoTool.apiCostEstimate}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-slate-800">
                                        <span className="text-slate-400">Recomandare Credite Utilizator:</span>
                                        <span className="font-semibold text-emerald-400">{selectedInfoTool.recommendedCredits}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <a
                                        href={selectedInfoTool.pricingUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 font-medium hover:underline cursor-pointer"
                                    >
                                        <span>Vezi Prețuri Oficiale & Update-uri Furnizor</span>
                                        <ExternalLink size={13} />
                                    </a>

                                    <button
                                        type="button"
                                        onClick={() => setSelectedInfoTool(null)}
                                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                                    >
                                        Închide
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
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
                        <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800 col-span-1 md:col-span-2">
                            <div>
                                <span className="font-semibold block text-white">Prag Număr Credite pentru Avertisment Sold Scăzut</span>
                                <span className="text-xs text-slate-400">Numărul minim de credite la care utilizatorul primește notificare/avertisment vizual că soldul este pe sfârșite</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <input 
                                    type="number"
                                    min="0"
                                    value={costs['low_credit_warning_threshold'] !== undefined ? costs['low_credit_warning_threshold'] : 5}
                                    onChange={(e) => handleChange('low_credit_warning_threshold', e.target.value)}
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
