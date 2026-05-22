'use client';

import React, { useState, useCallback } from 'react';
import { 
    Save, RotateCcw, Layers, Sliders, Shield, Sparkles, Eye,
    Plus, Trash2, GripVertical, AlertCircle, Check, Loader2, Calculator
} from 'lucide-react';

interface Model {
    nm: string; desc: string; sb: number; bb: number; pri: string;
}
interface Tier {
    lbl: string; max: number; f: number;
}
interface Period {
    d: number; lbl: string; c: number; note: string;
}
interface Service {
    id: string; cat: string; nm: string; dc: string;
    cost: number; coef: number; on: boolean; always?: boolean;
    pay: string; commAvail: Record<string, boolean>;
}

interface Props {
    initialSettings: {
        commission_models: Record<string, Model>;
        value_tiers: Tier[];
        exclusivity_periods: Period[];
        services: Service[];
    };
}

const TABS = [
    { id: 'models', label: 'Modele Comision', icon: Layers },
    { id: 'tiers', label: 'Intervale Valori', icon: Sliders },
    { id: 'periods', label: 'Perioade Exclusivitate', icon: Shield },
    { id: 'services', label: 'Servicii', icon: Sparkles },
    { id: 'preview', label: 'Previzualizare', icon: Eye },
] as const;

type TabId = typeof TABS[number]['id'];

export default function CalculatorSettingsClient({ initialSettings }: Props) {
    const [activeTab, setActiveTab] = useState<TabId>('models');
    const [models, setModels] = useState<Record<string, Model>>(initialSettings.commission_models);
    const [tiers, setTiers] = useState<Tier[]>(initialSettings.value_tiers);
    const [periods, setPeriods] = useState<Period[]>(initialSettings.exclusivity_periods);
    const [services, setServices] = useState<Service[]>(initialSettings.services);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
    const [dirty, setDirty] = useState<Set<string>>(new Set());

    const markDirty = (key: string) => {
        setDirty(prev => new Set(prev).add(key));
    };

    const handleDrop = (index: number) => {
        if (draggedIndex === null || draggedIndex === index) return;
        setServices(prev => {
            const reordered = [...prev];
            const [draggedItem] = reordered.splice(draggedIndex, 1);
            reordered.splice(index, 0, draggedItem);
            return reordered;
        });
        markDirty('services');
    };

    const showToast = (type: 'success' | 'error', msg: string) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3000);
    };

    const handleSave = useCallback(async () => {
        if (dirty.size === 0) { showToast('error', 'Nu există modificări de salvat.'); return; }
        setSaving(true);
        try {
            const keyMap: Record<string, any> = {
                commission_models: models,
                value_tiers: tiers,
                exclusivity_periods: periods,
                services: services,
            };
            for (const key of dirty) {
                const res = await fetch('/api/admin/calculator/settings', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key, value: keyMap[key] }),
                });
                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || `Eroare la salvarea ${key}`);
                }
            }
            setDirty(new Set());
            showToast('success', 'Setările au fost salvate cu succes!');
        } catch (e: any) {
            showToast('error', e.message || 'Eroare la salvare');
        } finally {
            setSaving(false);
        }
    }, [dirty, models, tiers, periods, services]);

    const handleReset = () => {
        setModels(initialSettings.commission_models);
        setTiers(initialSettings.value_tiers);
        setPeriods(initialSettings.exclusivity_periods);
        setServices(initialSettings.services);
        setDirty(new Set());
        showToast('success', 'Setările au fost resetate la valorile salvate.');
    };

    // ─── Models Tab ───
    const renderModelsTab = () => (
        <div className="space-y-6">
            <p className="text-sm text-slate-400">Editează comisioanele de bază (%) pentru fiecare model înainte de aplicarea factorului de valoare.</p>
            {Object.entries(models).map(([key, m]) => (
                <div key={key} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-white text-base">{m.nm}</h3>
                        <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-400 font-mono">{key}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-slate-500 font-semibold block mb-1">Comision Vânzător (%)</label>
                            <input type="number" step="0.1" min="0" value={m.sb}
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    setModels(prev => ({ ...prev, [key]: { ...prev[key], sb: val } }));
                                    markDirty('commission_models');
                                }}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-orange-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 font-semibold block mb-1">Comision Cumpărător (%)</label>
                            <input type="number" step="0.1" min="0" value={m.bb}
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    setModels(prev => ({ ...prev, [key]: { ...prev[key], bb: val } }));
                                    markDirty('commission_models');
                                }}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-orange-500 focus:outline-none"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 font-semibold block mb-1">Descriere</label>
                        <textarea value={m.desc} rows={2}
                            onChange={(e) => {
                                setModels(prev => ({ ...prev, [key]: { ...prev[key], desc: e.target.value } }));
                                markDirty('commission_models');
                            }}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:border-orange-500 focus:outline-none resize-none"
                        />
                    </div>
                </div>
            ))}
        </div>
    );

    // ─── Tiers Tab ───
    const renderTiersTab = () => (
        <div className="space-y-4">
            <p className="text-sm text-slate-400">Factorul de ajustare se aplică pe comisioanele de bază și pe coeficienții serviciilor. Un factor mai mic = comision proporțional mai mic la proprietăți scumpe.</p>
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="grid grid-cols-3 gap-4 px-5 py-3 bg-slate-800/50 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <span>Interval</span>
                    <span>Max (€)</span>
                    <span>Factor (×)</span>
                </div>
                {tiers.map((t, i) => (
                    <div key={i} className="grid grid-cols-3 gap-4 px-5 py-3 border-t border-slate-800/50 items-center hover:bg-slate-800/20 transition-colors">
                        <span className="text-sm text-slate-300 font-medium">{t.lbl}</span>
                        <input type="number" value={t.max >= 999999999 ? '' : t.max} placeholder="∞"
                            onChange={(e) => {
                                const val = e.target.value === '' ? 999999999999 : parseInt(e.target.value) || 0;
                                setTiers(prev => prev.map((tier, idx) => idx === i ? { ...tier, max: val } : tier));
                                markDirty('value_tiers');
                            }}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm text-white focus:border-orange-500 focus:outline-none"
                        />
                        <input type="number" step="0.01" min="0" max="2" value={t.f}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setTiers(prev => prev.map((tier, idx) => idx === i ? { ...tier, f: val } : tier));
                                markDirty('value_tiers');
                            }}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm text-white focus:border-orange-500 focus:outline-none"
                        />
                    </div>
                ))}
            </div>
        </div>
    );

    // ─── Periods Tab ───
    const renderPeriodsTab = () => (
        <div className="space-y-4">
            <p className="text-sm text-slate-400">Coeficientul de perioadă se adaugă/scade direct la comisionul primar (fără factorizare pe valoare). Valori negative = reducere.</p>
            <div className="space-y-3">
                {periods.map((p, i) => (
                    <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-white">{p.lbl}</span>
                            <span className={`text-sm font-bold px-2 py-0.5 rounded ${p.c < 0 ? 'bg-emerald-500/10 text-emerald-400' : p.c > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-400'}`}>
                                {p.c >= 0 ? '+' : ''}{p.c.toFixed(2)}%
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-slate-500 font-semibold block mb-1">Zile</label>
                                <input type="number" value={p.d} min="1"
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value) || 30;
                                        setPeriods(prev => prev.map((per, idx) => idx === i ? { ...per, d: val, lbl: `${val} zile` } : per));
                                        markDirty('exclusivity_periods');
                                    }}
                                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white focus:border-orange-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 font-semibold block mb-1">Coeficient (%)</label>
                                <input type="number" step="0.05" value={p.c}
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value) || 0;
                                        setPeriods(prev => prev.map((per, idx) => idx === i ? { ...per, c: val } : per));
                                        markDirty('exclusivity_periods');
                                    }}
                                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white focus:border-orange-500 focus:outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 font-semibold block mb-1">Notă explicativă</label>
                            <input type="text" value={p.note}
                                onChange={(e) => {
                                    setPeriods(prev => prev.map((per, idx) => idx === i ? { ...per, note: e.target.value } : per));
                                    markDirty('exclusivity_periods');
                                }}
                                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-300 focus:border-orange-500 focus:outline-none"
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    // ─── Services Tab ───
    const addService = () => {
        const newId = `s${Date.now()}`;
        setServices(prev => [...prev, {
            id: newId, cat: '', nm: 'Serviciu nou', dc: 'Descriere serviciu',
            cost: 20, coef: 0.10, on: false, pay: 'commission',
            commAvail: { 'zero-seller': true, 'seller': true, 'both': true }
        }]);
        markDirty('services');
    };

    const removeService = (id: string) => {
        setServices(prev => prev.filter(s => s.id !== id));
        markDirty('services');
    };

    const updateService = (id: string, field: string, value: any) => {
        setServices(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
        markDirty('services');
    };

    const renderServicesTab = () => (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">{services.length} servicii configurate. Serviciile cu „always" nu pot fi dezactivate de utilizator.</p>
                <button onClick={addService}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-lg text-xs font-bold hover:bg-orange-500/20 transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Adaugă serviciu
                </button>
            </div>

            <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
                {services.map((s, i) => (
                    <div 
                        key={s.id} 
                        className={`bg-slate-900 border rounded-xl p-4 space-y-3 relative transition-all duration-200 ${
                            dragOverIndex === i ? 'border-orange-500 scale-[1.01]' : 'border-slate-800'
                        } ${draggedIndex === i ? 'opacity-40' : ''}`}
                        onDragOver={(e) => {
                            e.preventDefault();
                            if (draggedIndex !== i) {
                                setDragOverIndex(i);
                            }
                        }}
                        onDragLeave={() => {
                            setDragOverIndex(null);
                        }}
                        onDrop={(e) => {
                            e.preventDefault();
                            handleDrop(i);
                            setDragOverIndex(null);
                        }}
                    >
                        {s.always && (
                            <span className="absolute top-3 right-3 text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded px-1.5 py-0.5">
                                ALWAYS ON
                            </span>
                        )}
                        <div className="flex items-start gap-3">
                            <span 
                                className="w-4 h-4 mt-1 cursor-grab active:cursor-grabbing flex-shrink-0 flex items-center justify-center" 
                                draggable={true}
                                onDragStart={(e) => {
                                    setDraggedIndex(i);
                                    e.dataTransfer.setData('text/plain', i.toString());
                                }}
                                onDragEnd={() => {
                                    setDraggedIndex(null);
                                    setDragOverIndex(null);
                                }}
                            >
                                <GripVertical className="w-4 h-4 text-slate-600" />
                            </span>
                            <div className="flex-1 space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Nume</label>
                                        <input type="text" value={s.nm}
                                            onChange={(e) => updateService(s.id, 'nm', e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm text-white focus:border-orange-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Categorie</label>
                                        <input type="text" value={s.cat} placeholder="(moștenește anterior)"
                                            onChange={(e) => updateService(s.id, 'cat', e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-300 focus:border-orange-500 focus:outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Descriere</label>
                                    <input type="text" value={s.dc}
                                        onChange={(e) => updateService(s.id, 'dc', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-300 focus:border-orange-500 focus:outline-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div>
                                        <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Cost (€)</label>
                                        <input type="number" step="10" min="0" value={s.cost}
                                            onChange={(e) => updateService(s.id, 'cost', parseFloat(e.target.value) || 0)}
                                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm text-white focus:border-orange-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Coef. brut (%)</label>
                                        <input type="number" step="0.05" min="0" value={s.coef}
                                            onChange={(e) => updateService(s.id, 'coef', parseFloat(e.target.value) || 0)}
                                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm text-white focus:border-orange-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Plată implicită</label>
                                        <select value={s.pay}
                                            onChange={(e) => updateService(s.id, 'pay', e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm text-white focus:border-orange-500 focus:outline-none">
                                            <option value="commission">Din comision</option>
                                            <option value="separate">Separat</option>
                                        </select>
                                    </div>
                                    <div className="flex items-end">
                                        {!s.always && (
                                            <button onClick={() => removeService(s.id)}
                                                className="w-full flex items-center justify-center gap-1 px-2 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded text-xs font-bold hover:bg-red-500/20 transition-colors">
                                                <Trash2 className="w-3 h-3" /> Șterge
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {/* Commission Availability per Model */}
                                <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-800/50">
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider self-center">Comision disponibil în:</span>
                                    {Object.entries(models).map(([mk, mv]) => (
                                        <label key={mk} className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                                            <input type="checkbox" checked={s.commAvail?.[mk] !== false}
                                                onChange={(e) => {
                                                    const newAvail = { ...s.commAvail, [mk]: e.target.checked };
                                                    updateService(s.id, 'commAvail', newAvail);
                                                }}
                                                className="rounded border-slate-600 bg-slate-950 text-orange-500 focus:ring-orange-500"
                                            />
                                            {mv.nm}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    // ─── Preview Tab (embeds public calculator in an iframe) ───
    const renderPreviewTab = () => (
        <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                    <span className="font-bold">Previzualizare live</span> — Calculatorul de mai jos afișează datele <strong>salvate</strong> în baza de date. Salvează modificările mai întâi pentru a le vedea reflectate aici.
                </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden" style={{ height: '75vh' }}>
                <iframe
                    src="/calculator-comisioane"
                    className="w-full h-full border-0"
                    title="Calculator Preview"
                />
            </div>
        </div>
    );

    const renderTab = () => {
        switch (activeTab) {
            case 'models': return renderModelsTab();
            case 'tiers': return renderTiersTab();
            case 'periods': return renderPeriodsTab();
            case 'services': return renderServicesTab();
            case 'preview': return renderPreviewTab();
        }
    };

    return (
        <div className="space-y-6">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold animate-in slide-in-from-top-4 duration-300 ${
                    toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                }`}>
                    {toast.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {toast.msg}
                </div>
            )}

            {/* Top Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-2">
                    {dirty.size > 0 && (
                        <span className="text-xs px-2 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full font-bold animate-pulse">
                            {dirty.size} secțiuni modificate
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleReset} disabled={saving}
                        className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-700 transition-colors disabled:opacity-50">
                        <RotateCcw className="w-3.5 h-3.5" /> Resetează
                    </button>
                    <button onClick={handleSave} disabled={saving || dirty.size === 0}
                        className="flex items-center gap-1.5 px-5 py-2 bg-orange-500 text-white rounded-lg text-xs font-bold hover:bg-orange-600 transition-colors disabled:opacity-50 shadow-lg shadow-orange-500/20">
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        {saving ? 'Se salvează...' : 'Salvează Modificările'}
                    </button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                            activeTab === tab.id
                            ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30 shadow-sm'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
                        }`}>
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                        {dirty.has(
                            tab.id === 'models' ? 'commission_models' :
                            tab.id === 'tiers' ? 'value_tiers' :
                            tab.id === 'periods' ? 'exclusivity_periods' :
                            tab.id === 'services' ? 'services' : ''
                        ) && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[50vh]">
                {renderTab()}
            </div>
        </div>
    );
}
