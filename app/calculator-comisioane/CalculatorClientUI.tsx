'use client';

import React, { useState, useMemo } from 'react';
import { 
    Sliders, Shield, Activity, Info, Lock, Check, HelpCircle, 
    AlertCircle, Sparkles, Receipt, UserCheck, ShieldCheck 
} from 'lucide-react';

interface Model {
    nm: string;
    desc: string;
    sb: number;
    bb: number;
    pri: string;
}

interface Tier {
    lbl: string;
    max: number;
    f: number;
}

interface ExclusivityPeriod {
    d: number;
    lbl: string;
    c: number;
    note: string;
}

interface Service {
    id: string;
    cat: string;
    nm: string;
    dc: string;
    cost: number;
    coef: number;
    on: boolean;
    always?: boolean;
    pay: 'commission' | 'separate';
    commAvail: Record<string, boolean>;
}

interface CalculatorClientUIProps {
    initialSettings: {
        commission_models: Record<string, Model>;
        value_tiers: Tier[];
        exclusivity_periods: ExclusivityPeriod[];
        services: Service[];
    };
}

export default function CalculatorClientUI({ initialSettings }: CalculatorClientUIProps) {
    // ----------------------------------------------------
    // 1. Reactive States
    // ----------------------------------------------------
    const [propertyValue, setPropertyValue] = useState<number>(120000);
    const [activeModel, setActiveModel] = useState<string>('zero-seller');
    const [isExclusive, setIsExclusive] = useState<boolean>(false);
    const [exclusivityPeriodDays, setExclusivityPeriodDays] = useState<number>(90);
    
    // Services status
    const [services, setServices] = useState<Service[]>(
        initialSettings.services.map(s => ({
            ...s,
            // Ensure default values are clean
            on: s.always ? true : s.on || false,
            pay: s.pay || 'commission'
        }))
    );

    // Short-cuts for property value
    const QUICK_VALUES = [50000, 100000, 150000, 200000, 300000, 500000];

    // ----------------------------------------------------
    // 2. Business Rules & Helper Helpers
    // ----------------------------------------------------
    // Check if service has separate pay forced due to Regula 1 (Zero Seller & Exclusivity OFF)
    const isRegula1ForcedSeparate = (s: Service) => {
        return !s.always && activeModel === 'zero-seller' && !isExclusive;
    };

    // Check if service commission pay mode is restricted for the selected model
    const isConfigForcedSeparate = (s: Service) => {
        return !s.always && s.commAvail && s.commAvail[activeModel] === false;
    };

    // Check if the service is allowed to be paid from commission
    const canBePaidFromCommission = (s: Service) => {
        return !isRegula1ForcedSeparate(s) && !isConfigForcedSeparate(s);
    };

    // Get the effective payment mode for a service
    const getEffectivePayMode = (s: Service) => {
        if (s.always) return 'commission';
        if (!canBePaidFromCommission(s)) return 'separate';
        return s.pay;
    };

    // Get the forced separate reason
    const getForcedSeparateReason = (s: Service) => {
        if (isRegula1ForcedSeparate(s)) return '0% Vânzător fără exclusivitate';
        if (isConfigForcedSeparate(s)) return 'restricție configurată model';
        return null;
    };

    // ----------------------------------------------------
    // 3. Calculator Core Mathematics
    // ----------------------------------------------------
    const calculations = useMemo(() => {
        const model = initialSettings.commission_models[activeModel] || { nm: '', desc: '', sb: 0, bb: 0, pri: 'seller' };
        
        // Find current tier & factor
        let activeTier = initialSettings.value_tiers[initialSettings.value_tiers.length - 1];
        for (const tier of initialSettings.value_tiers) {
            if (propertyValue <= tier.max) {
                activeTier = tier;
                break;
            }
        }
        const tierFactor = activeTier.f;

        // Base commission adjusted by tier factor
        const baseSellerPercent = model.sb * tierFactor;
        const baseBuyerPercent = model.bb * tierFactor;

        // Exclusivity period adjustment (applied directly to primary, NOT factorized by tier)
        let exclusivityAdjustment = 0;
        if (isExclusive) {
            const period = initialSettings.exclusivity_periods.find(p => p.d === exclusivityPeriodDays);
            if (period) {
                exclusivityAdjustment = period.c;
            }
        }

        // Active services additions
        let serviceCommissionPercentAddition = 0;
        let includedServicesCost = 0;
        let separateServicesCost = 0;

        services.forEach(s => {
            if (!s.always && !s.on) return; // Ignore toggled off non-always services

            const effPay = getEffectivePayMode(s);
            if (effPay === 'commission') {
                // Service commission coefficient factorized by tier value factor
                serviceCommissionPercentAddition += s.coef * tierFactor;
                includedServicesCost += s.cost;
            } else {
                separateServicesCost += s.cost;
            }
        });

        // Sum components and apply primary party adjustment (Regula 3)
        let finalSellerPercent = baseSellerPercent;
        let finalBuyerPercent = baseBuyerPercent;

        if (model.pri === 'buyer') {
            finalBuyerPercent = finalBuyerPercent + serviceCommissionPercentAddition + exclusivityAdjustment;
        } else {
            finalSellerPercent = finalSellerPercent + serviceCommissionPercentAddition + exclusivityAdjustment;
        }

        // Clamp final percentages (Regula 6: Math.max(0, value)) and fix float precision
        finalSellerPercent = Math.max(0, Math.round(finalSellerPercent * 10000) / 10000);
        finalBuyerPercent = Math.max(0, Math.round(finalBuyerPercent * 10000) / 10000);

        // Convert to absolute EUR values
        const sellerCommissionEUR = Math.round((propertyValue * finalSellerPercent) / 100);
        const buyerCommissionEUR = Math.round((propertyValue * finalBuyerPercent) / 100);
        const totalCommissionEUR = sellerCommissionEUR + buyerCommissionEUR;

        // Total outlay of the seller (Seller Commission + Separate Services Cash Cost)
        const sellerTotalOutlayEUR = sellerCommissionEUR + separateServicesCost;

        return {
            tierFactor,
            activeTier,
            baseSellerPercent,
            baseBuyerPercent,
            exclusivityAdjustment,
            serviceCommissionPercentAddition,
            includedServicesCost,
            separateServicesCost,
            finalSellerPercent,
            finalBuyerPercent,
            sellerCommissionEUR,
            buyerCommissionEUR,
            totalCommissionEUR,
            sellerTotalOutlayEUR
        };
    }, [propertyValue, activeModel, isExclusive, exclusivityPeriodDays, services, initialSettings]);

    // ----------------------------------------------------
    // 4. Input Toggles
    // ----------------------------------------------------
    const toggleService = (id: string) => {
        setServices(prev => 
            prev.map(s => {
                if (s.id === id && !s.always) {
                    return { ...s, on: !s.on };
                }
                return s;
            })
        );
    };

    const setServicePayMode = (id: string, mode: 'commission' | 'separate') => {
        setServices(prev => 
            prev.map(s => {
                if (s.id === id && !s.always) {
                    return { ...s, pay: mode };
                }
                return s;
            })
        );
    };

    // Formatting Helpers
    const formatEUR = (num: number) => {
        return num.toLocaleString('ro-RO') + ' €';
    };

    const formatPercent = (num: number) => {
        return num.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' %';
    };

    // Group services by category
    const groupedServices = useMemo(() => {
        const groups: Record<string, Service[]> = {};
        let currentCategory = "Alte servicii";

        services.forEach(s => {
            if (s.cat) {
                currentCategory = s.cat;
            }
            if (!groups[currentCategory]) {
                groups[currentCategory] = [];
            }
            groups[currentCategory].push(s);
        });

        return groups;
    }, [services]);

    const activeModelObj = initialSettings.commission_models[activeModel] || { nm: '', desc: '' };
    const currentExclusivityPeriod = initialSettings.exclusivity_periods.find(p => p.d === exclusivityPeriodDays);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* CONFIGURATION COLUMN */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* 1. PROPERTY VALUE TIER */}
                <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
                    <div className="flex justify-between items-center mb-4">
                        <label htmlFor="propertyValueInput" className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                            <Sliders className="w-4 h-4 text-orange-500" />
                            Valoarea proprietății
                        </label>
                        <span className="text-xs px-2.5 py-1 font-semibold rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                            Ajustare coeficient ×{calculations.tierFactor.toFixed(2)}
                        </span>
                    </div>

                    <div className="flex items-center gap-4 mb-6">
                        <div className="relative flex-1">
                            <input 
                                id="propertyValueInput"
                                type="number" 
                                value={propertyValue === 0 ? '' : propertyValue} 
                                onChange={(e) => setPropertyValue(Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500/50 rounded-xl px-4 py-3 text-2xl font-bold text-white focus:outline-none focus:ring-1 focus:ring-orange-500/30"
                                placeholder="Introduceți valoarea"
                                min="10000"
                            />
                            <span className="absolute right-4 top-3 text-2xl font-bold text-slate-500">€</span>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-slate-500 uppercase tracking-wider">Interval activ</div>
                            <div className="font-semibold text-slate-300 text-sm md:text-base">{calculations.activeTier.lbl}</div>
                        </div>
                    </div>

                    <input 
                        aria-label="Property value range slider"
                        type="range" 
                        min="10000" 
                        max="3000000" 
                        step="5000" 
                        value={propertyValue}
                        onChange={(e) => setPropertyValue(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500 mb-6"
                    />

                    {/* Quick values shortcuts */}
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {QUICK_VALUES.map(val => (
                            <button
                                key={val}
                                type="button"
                                onClick={() => setPropertyValue(val)}
                                className={`px-2 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                    propertyValue === val 
                                    ? 'bg-orange-500/20 border-orange-500/40 text-orange-400' 
                                    : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:bg-slate-950/90 hover:text-slate-200'
                                }`}
                            >
                                {formatEUR(val).replace(' €', 'k').replace('.000', '')}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 2. COMMISSION MODEL SELECTION */}
                <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-4">
                        <Activity className="w-4 h-4 text-orange-500" />
                        Model de comisionare
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                        {Object.entries(initialSettings.commission_models).map(([key, model]) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setActiveModel(key)}
                                className={`p-4 rounded-xl text-left border transition-all relative overflow-hidden flex flex-col justify-between h-28 ${
                                    activeModel === key 
                                    ? 'bg-slate-950 border-orange-500 shadow-lg text-white' 
                                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:bg-slate-950/80 hover:text-slate-300'
                                }`}
                            >
                                <span className={`text-sm font-bold ${activeModel === key ? 'text-orange-500' : 'text-slate-300'}`}>
                                    {model.nm}
                                </span>
                                <span className="text-[11px] text-slate-500 leading-tight">
                                    Base: Vânzător {model.sb}% / Cumpărător {model.bb}%
                                </span>
                                {activeModel === key && (
                                    <span className="absolute top-2 right-2 p-0.5 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20">
                                        <UserCheck className="w-3.5 h-3.5" />
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/60 flex items-start gap-3">
                        <Info className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                        <div className="text-xs md:text-sm text-slate-400 leading-relaxed">
                            {activeModelObj.desc}
                        </div>
                    </div>
                </div>

                {/* 3. EXCLUSIVITY SECTION */}
                <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
                    <div className="flex justify-between items-center mb-4">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-orange-500" />
                            Reprezentare Exclusivă
                        </label>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                aria-label="Toggle Exclusivity"
                                type="checkbox" 
                                checked={isExclusive} 
                                onChange={() => setIsExclusive(!isExclusive)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 peer-checked:after:bg-orange-500 after:border-slate-300 after:border after:rounded-full after:height-5 after:width-5 after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500/10 border border-slate-700/80 peer-checked:border-orange-500/30"></div>
                        </label>
                    </div>

                    {isExclusive ? (
                        <div className="mt-4 space-y-4 animate-fadeIn">
                            <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
                                Contractul de Reprezentare Exclusivă oferă maximum de implicare din partea agenției și un pachet solid de promovare. Perioada exclusivității permite reduceri adiționale de comision.
                            </p>
                            
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                {initialSettings.exclusivity_periods.map(p => (
                                    <button
                                        key={p.d}
                                        type="button"
                                        onClick={() => setExclusivityPeriodDays(p.d)}
                                        className={`py-2 rounded-xl text-center border text-xs font-semibold transition-all ${
                                            exclusivityPeriodDays === p.d 
                                            ? 'bg-slate-950 border-orange-500 text-orange-500 font-bold shadow-md' 
                                            : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-950/80 hover:text-slate-200'
                                        }`}
                                    >
                                        <div>{p.lbl}</div>
                                        <div className={`text-[10px] mt-0.5 ${p.c < 0 ? 'text-emerald-500' : p.c > 0 ? 'text-amber-500' : 'text-slate-500'}`}>
                                            {p.c >= 0 ? '+' : ''}{p.c.toFixed(2)}%
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {currentExclusivityPeriod && (
                                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-start gap-3">
                                    <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                    <div className="text-xs text-slate-300 leading-relaxed">
                                        <span className="font-bold text-slate-200">Ajustare comision exclusivitate:</span> {currentExclusivityPeriod.note}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-xs text-slate-500 italic mt-2">
                            Reprezentarea non-exclusivă (standard) nu aplică nicio reducere de comision.
                        </p>
                    )}
                </div>

                {/* 4. SERVICES LIST */}
                <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-4">
                        <Sparkles className="w-4 h-4 text-orange-500" />
                        Servicii Disponibile
                    </label>

                    {/* Zero seller no exclusivity warning banner */}
                    {activeModel === 'zero-seller' && !isExclusive && (
                        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500/90 text-xs leading-relaxed flex items-start gap-3 mb-6">
                            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <div>
                                <span className="font-bold">Regulă Calculator:</span> În modelul <strong>0% Vânzător</strong> fără Reprezentare Exclusivă, toate serviciile promoționale sunt disponibile exclusiv prin plata <strong>Separată</strong>. Activează reprezentarea exclusivă dacă dorești includerea lor în comisionul final.
                            </div>
                        </div>
                    )}

                    <div className="space-y-6">
                        {Object.entries(groupedServices).map(([category, items]) => (
                            <div key={category} className="space-y-3">
                                <h3 className="text-[10px] tracking-widest font-extrabold uppercase text-slate-500 border-b border-slate-800/60 pb-1.5 mt-4 first:mt-0">
                                    {category}
                                </h3>

                                <div className="space-y-2.5">
                                    {items.map(s => {
                                        const isSelected = s.always || s.on;
                                        const effPayMode = getEffectivePayMode(s);
                                        const forcedReason = getForcedSeparateReason(s);
                                        const showCoef = isSelected && effPayMode === 'commission' && !s.always;
                                        const showSep = isSelected && effPayMode === 'separate' && !s.always;

                                        return (
                                            <div 
                                                key={s.id} 
                                                className={`p-4 rounded-xl border transition-all ${
                                                    isSelected 
                                                    ? 'bg-slate-950/60 border-slate-800/90 shadow-sm' 
                                                    : 'bg-slate-950/10 border-slate-900/40 opacity-70 hover:opacity-100'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex items-center gap-3">
                                                        {s.always ? (
                                                            <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
                                                                <Check className="w-3 h-3" />
                                                            </div>
                                                        ) : (
                                                            <label className="relative inline-flex items-center cursor-pointer">
                                                                <input 
                                                                    aria-label={`Toggle service ${s.nm}`}
                                                                    type="checkbox" 
                                                                    checked={s.on} 
                                                                    onChange={() => toggleService(s.id)}
                                                                    className="sr-only peer"
                                                                />
                                                                <div className="w-8 h-4.5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 peer-checked:after:bg-orange-500 after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-orange-500/10 border border-slate-700/80 peer-checked:border-orange-500/30"></div>
                                                            </label>
                                                        )}
                                                        <div>
                                                            <span className="text-sm font-bold text-slate-200">
                                                                {s.nm}
                                                            </span>
                                                            {s.always && (
                                                                <span className="ml-2 inline-flex items-center gap-0.5 text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded px-1.5 py-0.5">
                                                                    Inclus automat
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="text-right flex-shrink-0">
                                                        {showCoef && (
                                                            <div className="text-xs font-bold text-emerald-500">
                                                                +{formatPercent(s.coef * calculations.tierFactor)}
                                                            </div>
                                                        )}
                                                        {showCoef && s.cost > 0 && (
                                                            <div className="text-[10px] text-slate-500 line-through">
                                                                {formatEUR(s.cost)}
                                                            </div>
                                                        )}
                                                        {showSep && s.cost > 0 && (
                                                            <div className="text-xs font-extrabold text-amber-500">
                                                                {formatEUR(s.cost)}
                                                            </div>
                                                        )}
                                                        {!isSelected && s.cost > 0 && (
                                                            <div className="text-xs text-slate-500">
                                                                {formatEUR(s.cost)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="text-xs text-slate-500 mt-1 ml-8 leading-relaxed">
                                                    {s.dc}
                                                </div>

                                                {/* Payment modality toggles */}
                                                {isSelected && !s.always && (
                                                    <div className="mt-3 ml-8 pt-2.5 border-t border-slate-800/40 flex items-center justify-between gap-4">
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                                            Mod plată
                                                        </span>
                                                        {forcedReason ? (
                                                            <span className="inline-flex items-center gap-1 text-[10px] italic text-slate-400 bg-slate-900 border border-slate-800 rounded px-2 py-1 select-none">
                                                                <Lock className="w-3 h-3 text-slate-500" />
                                                                Plată separată ({forcedReason})
                                                            </span>
                                                        ) : (
                                                            <div className="inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setServicePayMode(s.id, 'commission')}
                                                                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                                                                        s.pay === 'commission'
                                                                        ? 'bg-slate-800 text-white font-bold shadow-sm'
                                                                        : 'text-slate-500 hover:text-slate-300'
                                                                    }`}
                                                                >
                                                                    Din comision
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setServicePayMode(s.id, 'separate')}
                                                                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                                                                        s.pay === 'separate'
                                                                        ? 'bg-slate-800 text-white font-bold shadow-sm'
                                                                        : 'text-slate-500 hover:text-slate-300'
                                                                    }`}
                                                                >
                                                                    Separat
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* STICKY SUMMARY COLUMN */}
            <div className="lg:col-span-1 lg:sticky lg:top-24 space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl"></div>

                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-6">
                        <Receipt className="w-4 h-4 text-orange-500" />
                        Sumar Comisioane &amp; Costuri
                    </h2>

                    <div className="flex flex-wrap gap-2 mb-6">
                        <span className="text-[10px] px-2 py-1 font-bold rounded-md bg-slate-950 border border-slate-800 text-slate-400">
                            Factor ×{calculations.tierFactor.toFixed(2)}
                        </span>
                        {isExclusive && (
                            <span className="text-[10px] px-2 py-1 font-bold rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-1 animate-fadeIn">
                                <Shield className="w-3 h-3" /> Exclusivitate activă
                              </span>
                        )}
                    </div>

                    {/* BIG TOTAL BOX */}
                    <div className="text-center bg-slate-950 border border-slate-800/80 rounded-2xl py-6 px-4 mb-6 shadow-inner relative overflow-hidden">
                        <div className="text-[11px] text-slate-400 uppercase tracking-widest font-semibold mb-1">
                            Comision total tranzacție
                        </div>
                        <div className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent mb-1">
                            {formatPercent(calculations.finalSellerPercent + calculations.finalBuyerPercent)}
                        </div>
                        <div className="text-lg font-bold text-slate-200">
                            {formatEUR(calculations.totalCommissionEUR)}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-2">
                            Vânzător: {formatPercent(calculations.finalSellerPercent)} &middot; Cumpărător: {formatPercent(calculations.finalBuyerPercent)}
                        </div>
                    </div>

                    {/* DETAILED ITEMS BREAKDOWN */}
                    <div className="space-y-4 border-t border-b border-slate-800/80 py-5 my-5 text-sm">
                        
                        {/* 1. SELLER ROW */}
                        <div className="flex justify-between items-start gap-4">
                            <span className="text-slate-400 font-medium">Comision Vânzător:</span>
                            <div className="text-right">
                                <div className="font-semibold text-slate-200">
                                    {formatPercent(calculations.finalSellerPercent)}
                                </div>
                                <div className="text-xs text-slate-500">
                                    {formatEUR(calculations.sellerCommissionEUR)}
                                </div>
                            </div>
                        </div>

                        {/* 2. BUYER ROW */}
                        <div className="flex justify-between items-start gap-4">
                            <span className="text-slate-400 font-medium">Comision Cumpărător:</span>
                            <div className="text-right">
                                <div className="font-semibold text-slate-200">
                                    {formatPercent(calculations.finalBuyerPercent)}
                                </div>
                                <div className="text-xs text-slate-500">
                                    {formatEUR(calculations.buyerCommissionEUR)}
                                </div>
                            </div>
                        </div>

                        {/* 3. INCLUDED SERVICES */}
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500">Servicii incluse în comision:</span>
                            <span className="text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                +{formatPercent(calculations.serviceCommissionPercentAddition)}
                            </span>
                        </div>

                        {/* 4. SEPARATE SERVICES */}
                        <div className="flex justify-between items-center text-xs border-t border-slate-800/30 pt-3">
                            <span className="text-slate-400 font-medium">Servicii plătite separat:</span>
                            <span className="font-extrabold text-amber-500">
                                {formatEUR(calculations.separateServicesCost)}
                            </span>
                        </div>
                    </div>

                    {/* SEPARATE SERVICES ITEMIZATION (IF ANY) */}
                    <div className="space-y-2 mb-6">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Listă Servicii Contractate
                        </div>
                        {services.filter(s => s.always || s.on).length === 0 ? (
                            <div className="text-xs italic text-slate-500">Niciun serviciu adițional selectat.</div>
                        ) : (
                            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                                {services.filter(s => s.always || s.on).map(s => {
                                    const mode = getEffectivePayMode(s);
                                    return (
                                        <div key={s.id} className="flex justify-between items-center text-[11px] text-slate-400 bg-slate-950/40 rounded border border-slate-800/40 px-2 py-1">
                                            <span className="truncate max-w-[140px] font-medium">{s.nm}</span>
                                            <span className={mode === 'commission' ? 'text-emerald-400 font-semibold' : 'text-amber-500 font-semibold'}>
                                                {mode === 'commission' ? 'Inclus în comision' : formatEUR(s.cost)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* TOTAL OUTLAY BANNER (GREEN BANNER) */}
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center">
                        <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" /> Total investit de Proprietar (Vânzător)
                        </div>
                        <div className="text-2xl font-extrabold text-emerald-400">
                            {formatEUR(calculations.sellerTotalOutlayEUR)}
                        </div>
                        <p className="text-[9.5px] text-slate-400 leading-relaxed mt-1.5">
                            Reprezintă comisionul de vânzare + serviciile plătite separat.
                        </p>
                    </div>

                    <div className="text-[10px] text-slate-500 leading-relaxed mt-4 flex items-start gap-1.5 bg-slate-950/30 p-3 rounded-lg border border-slate-800/40">
                        <HelpCircle className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                        <div>
                            Valori cu scop informativ. Toate comisioanele sunt exprimate fără TVA (cota 19% aplicabilă conform legii). Contractul semnat guvernează termenii finali.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
