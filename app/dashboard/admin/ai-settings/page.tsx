'use client';

import { useState, useEffect, useTransition } from 'react';
import { Save, Settings, Key, Eye, EyeOff } from 'lucide-react';
import { getAIKeys, updateAIProviderKeys } from '@/app/lib/actions/settings';

export default function AIProviderSettingsPage() {
    const [keys, setKeys] = useState<Record<string, string>>({
        replicate_api_token: '',
        openai_api_key: '',
        fal_api_key: '',
        runway_api_secret: '',
        gemini_api_key: ''
    });
    
    const [showKey, setShowKey] = useState<Record<string, boolean>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        const load = async () => {
            const res = await getAIKeys();
            if (res.keys) {
                setKeys(prev => ({ ...prev, ...res.keys }));
            }
            setIsLoading(false);
        };
        load();
    }, []);

    const handleChange = (key: string, val: string) => {
        setKeys(prev => ({
            ...prev,
            [key]: val
        }));
    };

    const handleSave = () => {
        startTransition(async () => {
            const res = await updateAIProviderKeys(keys);
            if (res.error) {
                alert('Eroare: ' + res.error);
            } else {
                alert('Cheile API au fost salvate cu succes!');
            }
        });
    };

    const providers = [
        { id: 'gemini_api_key', name: 'Google Gemini API Key', desc: 'Used for Multimodal Floorplan Perception, Spatial Vector Analysis, and AI Video Scripting.' },
        { id: 'replicate_api_token', name: 'Replicate API Token', desc: 'Used for Flux models, Room Builder, and Lora implementations.' },
        { id: 'openai_api_key', name: 'OpenAI API Key', desc: 'Used for GPT text descriptions and advanced parsing.' },
        { id: 'fal_api_key', name: 'Fal.ai API Key', desc: 'Used for real-time inference and fast generation workloads.' },
        { id: 'runway_api_secret', name: 'Runway API Secret', desc: 'Used for Gen-3 Video Generation from images.' },
    ];

    if (isLoading) {
        return <div className="p-8 text-center text-slate-400">Loading Configuration...</div>;
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <header>
                    <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
                        <Settings className="w-8 h-8 text-blue-500" />
                        AI Provider Configuration
                    </h1>
                    <p className="text-slate-400">
                        Configure the Master API keys for the platform. If users do not provide their own personal API keys in the AI Studio, the system will fall back to using these keys.
                    </p>
                </header>

                <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2 border-b border-slate-800 pb-4">
                        <Key className="text-orange-500" /> Platform Global API Keys
                    </h2>
                    
                    <div className="space-y-6">
                        {providers.map(provider => (
                            <div key={provider.id} className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                                <label className="block text-sm font-bold text-slate-300 mb-1">
                                    {provider.name}
                                </label>
                                <p className="text-xs text-slate-500 mb-3">{provider.desc}</p>
                                
                                <div className="relative">
                                    <input 
                                        type={showKey[provider.id] ? "text" : "password"}
                                        value={keys[provider.id] || ''}
                                        onChange={(e) => handleChange(provider.id, e.target.value)}
                                        placeholder={`Enter ${provider.name}`}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-4 pr-12 outline-none focus:border-blue-500 transition-colors font-mono text-sm"
                                    />
                                    <button 
                                        onClick={() => setShowKey(prev => ({ ...prev, [provider.id]: !prev[provider.id] }))}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                                    >
                                        {showKey[provider.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <div className="flex justify-end pt-4">
                    <button
                        onClick={handleSave}
                        disabled={isPending}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                        {isPending ? 'Saving...' : <><Save size={20} /> Save Configuration</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
