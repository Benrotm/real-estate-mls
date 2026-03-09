'use client';

import { useState } from 'react';
import { ScoringRule, updateScoringRule } from '@/app/lib/actions/scoring';
import { Loader2, Save, Target, Home, Zap } from 'lucide-react';

export default function ScoringRulesEditor({
    initialRules,
    initialScope = 'lead'
}: {
    initialRules: ScoringRule[];
    initialScope?: 'lead' | 'property' | 'match';
}) {
    const [rules, setRules] = useState(initialRules);
    const [savingId, setSavingId] = useState<string | null>(null);
    const [activeScope, setActiveScope] = useState<'lead' | 'property' | 'match'>(initialScope);

    const handleWeightChange = (id: string, newWeight: string) => {
        const weight = parseInt(newWeight) || 0;
        setRules(rules.map(r => r.id === id ? { ...r, weight } : r));
    };

    const handleToggleActive = (id: string) => {
        setRules(rules.map(r => r.id === id ? { ...r, is_active: !r.is_active } : r));
    };

    const handleSave = async (rule: ScoringRule) => {
        setSavingId(rule.id);
        try {
            await updateScoringRule(rule.id, rule.weight, rule.is_active);
        } catch (error) {
            console.error('Failed to save rule', error);
            alert('Failed to save rule');
        } finally {
            setSavingId(null);
        }
    };

    // Filter by scope and then group by category
    const filteredRules = rules.filter(r => r.scope === activeScope);

    const groupedRules = filteredRules.reduce((acc, rule) => {
        const cat = rule.category || 'Other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(rule);
        return acc;
    }, {} as Record<string, ScoringRule[]>);

    const tabs = [
        { id: 'lead', label: 'Lead Scoring', icon: Target },
        { id: 'property', label: 'Property Quality', icon: Home },
        { id: 'match', label: 'Matching Engine', icon: Zap },
    ] as const;

    return (
        <div className="space-y-6">
            {/* Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 w-fit">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveScope(tab.id)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeScope === tab.id
                                ? 'bg-white text-orange-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            <div className="space-y-8">
                {Object.entries(groupedRules).length > 0 ? (
                    Object.entries(groupedRules).map(([category, categoryRules]) => (
                        <div key={category} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="text-lg font-bold text-slate-800 capitalize mb-4 border-b pb-2">
                                {category} Criteria
                            </h3>
                            <div className="space-y-4">
                                {categoryRules.map((rule) => (
                                    <div key={rule.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                                        <div>
                                            <p className="font-semibold text-slate-700">{rule.label}</p>
                                            <p className="text-xs text-slate-500 font-mono">{rule.criteria_key}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-3 pr-4 border-r border-slate-200">
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${rule.is_active ? 'text-orange-600' : 'text-slate-400'}`}>
                                                    {rule.is_active ? 'Active' : 'Disabled'}
                                                </span>
                                                <button
                                                    onClick={() => handleToggleActive(rule.id)}
                                                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${rule.is_active ? 'bg-orange-600' : 'bg-slate-200'}`}
                                                >
                                                    <span
                                                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${rule.is_active ? 'translate-x-5' : 'translate-x-0'}`}
                                                    />
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <label className="text-xs text-slate-400 font-bold uppercase">Points</label>
                                                <input
                                                    type="number"
                                                    value={rule.weight}
                                                    onChange={(e) => handleWeightChange(rule.id, e.target.value)}
                                                    className={`w-20 px-3 py-1.5 border border-slate-300 rounded-md font-bold text-slate-700 text-right focus:ring-2 focus:ring-orange-500 outline-none ${!rule.is_active && 'opacity-50 grayscale'}`}
                                                    disabled={!rule.is_active}
                                                />
                                            </div>
                                            <button
                                                onClick={() => handleSave(rule)}
                                                disabled={savingId === rule.id}
                                                className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-full transition-all"
                                                title="Save Change"
                                            >
                                                {savingId === rule.id ? (
                                                    <Loader2 className="w-5 h-5 animate-spin text-orange-600" />
                                                ) : (
                                                    <Save className="w-5 h-5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-white p-12 rounded-xl border border-slate-200 border-dashed text-center">
                        <p className="text-slate-400 font-medium">No rules found for this scope. Please apply the database migration.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
