'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/app/lib/supabase/client';
import { saveAnexa1ToContract } from '@/app/lib/actions/collaboration-contracts';
import { 
    Sliders, Shield, Activity, Info, Lock, Check, HelpCircle, 
    AlertCircle, Sparkles, Receipt, UserCheck, ShieldCheck, FileText
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
    monthly?: boolean;
}

interface UserProfile {
    id: string;
    full_name: string;
    role: string;
    plan_tier: string;
    email?: string;
    phone?: string;
}

interface CalculatorClientUIProps {
    initialSettings: {
        commission_models: Record<string, Model>;
        value_tiers: Tier[];
        exclusivity_periods: ExclusivityPeriod[];
        services: Service[];
    };
    user: UserProfile | null;
}

export default function CalculatorClientUI({ initialSettings, user }: CalculatorClientUIProps) {
    // ----------------------------------------------------
    // 1. Reactive States
    // ----------------------------------------------------
    const [propertyValue, setPropertyValue] = useState<number>(120000);
    const [activeModel, setActiveModel] = useState<string>('zero-seller');
    const [isExclusive, setIsExclusive] = useState<boolean>(false);
    const [exclusivityPeriodDays, setExclusivityPeriodDays] = useState<number>(90);
    const [showAuthAlert, setShowAuthAlert] = useState<boolean>(false);

    const searchParams = useSearchParams();
    const [propertyId, setPropertyId] = useState<string | null>(null);
    const [associatedContract, setAssociatedContract] = useState<any>(null);
    const [propertyName, setPropertyName] = useState<string>('');
    const [savingAnexa, setSavingAnexa] = useState(false);

    useEffect(() => {
        if (!searchParams) return;
        const propId = searchParams.get('property_id');
        if (propId) {
            setPropertyId(propId);
            
            // Fetch property details to prefill the value slider
            supabase
                .from('properties')
                .select('title, price')
                .eq('id', propId)
                .maybeSingle()
                .then(({ data: propData }) => {
                    if (propData) {
                        setPropertyName(propData.title);
                        if (propData.price) {
                            setPropertyValue(Number(propData.price));
                        }
                    }
                });

            // Fetch collaboration contract to check if it exists and to get serial/number
            supabase
                .from('collaboration_contracts')
                .select('*')
                .eq('property_id', propId)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle()
                .then(({ data: contractData }) => {
                    if (contractData) {
                        setAssociatedContract(contractData);
                    }
                });
        }
    }, [searchParams]);
    
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

        // Total cost of selected services
        const totalServicesCostEUR = includedServicesCost + separateServicesCost;

        // Total cost of monthly recurring services
        let monthlyServicesCostEUR = 0;
        services.forEach(s => {
            if (!s.always && !s.on) return;
            if (s.monthly) {
                monthlyServicesCostEUR += s.cost;
            }
        });

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
            sellerTotalOutlayEUR,
            totalServicesCostEUR,
            monthlyServicesCostEUR
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

    const formatServiceCost = (cost: number, isMonthly?: boolean) => {
        return cost.toLocaleString('ro-RO') + ' €' + (isMonthly ? ' / lună' : '');
    };

    const formatPercent = (num: number) => {
        return num.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' %';
    };

    const translateRole = (role: string) => {
        switch (role) {
            case 'owner': return 'Proprietar';
            case 'client': return 'Client / Cumpărător';
            case 'agent': return 'Agent Imobiliar';
            case 'developer': return 'Dezvoltator';
            case 'admin': return 'Administrator';
            case 'super_admin': return 'Super Administrator';
            default: return role;
        }
    };

    const handleGenerateAnexa1 = async () => {
        if (!associatedContract) return;
        setSavingAnexa(true);
        try {
            const selectedServices = services.filter(s => s.always || s.on);
            const activeModelObj = initialSettings.commission_models[activeModel] || { nm: '', desc: '' };
            const exclusivityText = isExclusive 
                ? `Exclusivă (${exclusivityPeriodDays} zile)` 
                : 'Non-exclusivă';

            const anexaData = {
                propertyName,
                propertyValue,
                activeModel,
                activeModelName: activeModelObj.nm,
                isExclusive,
                exclusivityPeriodDays,
                exclusivityText,
                selectedServices: selectedServices.map(s => ({
                    id: s.id,
                    name: s.nm,
                    desc: s.dc,
                    cost: s.cost,
                    coef: s.coef,
                    payMode: getEffectivePayMode(s),
                    monthly: s.monthly || false
                })),
                calculations: {
                    sellerPercent: calculations.finalSellerPercent,
                    sellerCommEUR: calculations.sellerCommissionEUR,
                    buyerPercent: calculations.finalBuyerPercent,
                    buyerCommEUR: calculations.buyerCommissionEUR,
                    totalServicesFirstMonthEUR: calculations.totalServicesCostEUR,
                    monthlyServicesCostEUR: calculations.monthlyServicesCostEUR
                },
                generatedAt: new Date().toISOString()
            };

            const res = await saveAnexa1ToContract(associatedContract.id, anexaData);
            if (res.success) {
                // Redirect to Anexa 1 preview page
                window.location.href = `/properties/anexa1-preview?id=${associatedContract.id}`;
            } else {
                alert('Eroare la salvarea Anexei 1: ' + res.error);
            }
        } catch (error) {
            console.error('Error generating Anexa 1:', error);
            alert('A apărut o eroare la generarea Anexei 1.');
        } finally {
            setSavingAnexa(false);
        }
    };

    const handleGenerateDocument = () => {
        if (!user) {
            setShowAuthAlert(true);
            return;
        }

        const now = new Date();
        const formattedDate = now.toLocaleString('ro-RO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        const activeModelObj = initialSettings.commission_models[activeModel] || { nm: '', desc: '' };
        const exclusivityText = isExclusive 
            ? `Exclusivă (${exclusivityPeriodDays} zile, ajustare ${calculations.exclusivityAdjustment >= 0 ? '+' : ''}${calculations.exclusivityAdjustment.toFixed(2)}%)` 
            : 'Non-exclusivă';

        const selectedServices = services.filter(s => s.always || s.on);

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Te rugăm să permiți ferestrele pop-up pentru a genera documentul.');
            return;
        }

        const servicesRows = selectedServices.map(s => {
            const mode = getEffectivePayMode(s);
            const modeLabel = mode === 'commission' ? 'Inclus în comision' : 'Plată separată';
            const costLabel = mode === 'commission' 
                ? `+${formatPercent(s.coef * calculations.tierFactor)}` 
                : formatServiceCost(s.cost, s.monthly);
            const monthlyBadge = s.monthly ? ' <span style="font-size: 9px; font-weight: 500; color: #1d4ed8; background-color: #eff6ff; border: 1px solid #dbeafe; padding: 2px 4px; border-radius: 4px; margin-left: 6px; vertical-align: middle;">lunar</span>' : '';
            return `
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; font-size: 13px; color: #1e293b;">${s.nm}${monthlyBadge}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">${s.dc}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: 600; color: ${mode === 'commission' ? '#10b981' : '#f59e0b'};">${modeLabel}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: bold; text-align: right; color: #1e293b;">${costLabel}</td>
                </tr>
            `;
        }).join('');

        const htmlContent = `
            <!DOCTYPE html>
            <html lang="ro">
            <head>
                <meta charset="UTF-8">
                <title>Anexa - Calculator Imobiliar</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                    body {
                        font-family: 'Inter', sans-serif;
                        color: #1e293b;
                        line-height: 1.5;
                        margin: 0;
                        padding: 40px;
                        background-color: #ffffff;
                    }
                    .container {
                        max-width: 800px;
                        margin: 0 auto;
                    }
                    .header {
                        text-align: center;
                        border-bottom: 2px solid #e2e8f0;
                        padding-bottom: 20px;
                        margin-bottom: 30px;
                    }
                    .logo {
                        font-size: 20px;
                        font-weight: 800;
                        color: #f97316;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        margin-bottom: 5px;
                    }
                    .title {
                        font-size: 28px;
                        font-weight: 800;
                        margin: 10px 0 5px 0;
                        color: #0f172a;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    .subtitle {
                        font-size: 14px;
                        color: #64748b;
                        margin: 0;
                    }
                    .section {
                        margin-bottom: 25px;
                    }
                    .section-title {
                        font-size: 14px;
                        font-weight: 700;
                        text-transform: uppercase;
                        color: #475569;
                        border-bottom: 1px solid #cbd5e1;
                        padding-bottom: 6px;
                        margin-bottom: 15px;
                        letter-spacing: 0.5px;
                    }
                    .grid-2 {
                        display: flex;
                        gap: 20px;
                    }
                    .data-box {
                        flex: 1;
                        background-color: #f8fafc;
                        border: 1px solid #e2e8f0;
                        border-radius: 8px;
                        padding: 15px;
                    }
                    .data-row {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 8px;
                        font-size: 13px;
                    }
                    .data-row:last-child {
                        margin-bottom: 0;
                    }
                    .data-label {
                        color: #64748b;
                        font-weight: 500;
                    }
                    .data-value {
                        font-weight: 600;
                        color: #0f172a;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 10px;
                    }
                    th {
                        background-color: #f1f5f9;
                        padding: 10px;
                        font-size: 11px;
                        font-weight: 700;
                        text-transform: uppercase;
                        color: #475569;
                        text-align: left;
                        border-bottom: 2px solid #cbd5e1;
                    }
                    .financial-summary {
                        background-color: #f0fdf4;
                        border: 1px solid #bbf7d0;
                        border-radius: 12px;
                        padding: 20px;
                        margin-top: 20px;
                    }
                    .financial-title {
                        font-size: 12px;
                        font-weight: 700;
                        text-transform: uppercase;
                        color: #166534;
                        margin-bottom: 12px;
                        letter-spacing: 0.5px;
                    }
                    .financial-grid {
                        display: flex;
                        gap: 15px;
                    }
                    .financial-col {
                        flex: 1;
                    }
                    .financial-row {
                        display: flex;
                        justify-content: space-between;
                        font-size: 13px;
                        margin-bottom: 6px;
                    }
                    .financial-row.total {
                        border-top: 1px dashed #bbf7d0;
                        padding-top: 10px;
                        margin-top: 10px;
                        font-size: 16px;
                        font-weight: 800;
                        color: #14532d;
                    }
                    .financial-row.total-monthly {
                        border-top: 1px dashed #bfdbfe;
                        padding-top: 10px;
                        margin-top: 10px;
                        font-size: 16px;
                        font-weight: 800;
                        color: #1e3a8a;
                    }
                    .footer-disclaimer {
                        font-size: 11px;
                        color: #94a3b8;
                        margin-top: 30px;
                        line-height: 1.6;
                        text-align: justify;
                    }
                    .signatures-area {
                        margin-top: 50px;
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        page-break-inside: avoid;
                    }
                    .signature-block-left {
                        width: 45%;
                        text-align: left;
                        font-size: 12px;
                    }
                    .signature-block-right {
                        width: 45%;
                        text-align: right;
                        font-size: 12px;
                    }
                    .signature-title {
                        font-weight: 700;
                        color: #334155;
                        margin-bottom: 8px;
                        text-transform: uppercase;
                        font-size: 11px;
                        letter-spacing: 0.5px;
                    }
                    .signature-details {
                        color: #64748b;
                        line-height: 1.6;
                        margin-bottom: 45px;
                    }
                    .signature-line {
                        border-top: 1px solid #94a3b8;
                        width: 220px;
                        margin-top: 10px;
                        padding-top: 5px;
                        color: #64748b;
                        font-weight: 500;
                    }
                    .signature-line-right {
                        border-top: 1px solid #94a3b8;
                        width: 220px;
                        margin-top: 10px;
                        padding-top: 5px;
                        color: #64748b;
                        font-weight: 500;
                        margin-left: auto;
                    }
                    .agreement-text {
                        font-style: italic;
                        color: #334155;
                        font-weight: 500;
                        line-height: 1.5;
                        margin-bottom: 25px;
                    }
                    @media print {
                        body {
                            padding: 20px;
                        }
                        button {
                            display: none;
                        }
                        .no-print {
                            display: none;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">Real Estate Hub Timișoara</div>
                        <h1 class="title">Anexa</h1>
                        <p class="subtitle">Document de colaborare și configurare servicii imobiliare</p>
                    </div>

                    <div class="section">
                        <div class="section-title">Date Tranzacție & Configurare</div>
                        <div class="grid-2">
                            <div class="data-box">
                                <div class="data-row">
                                    <span class="data-label">Valoare Proprietate:</span>
                                    <span class="data-value">${formatEUR(propertyValue)}</span>
                                </div>
                                <div class="data-row">
                                    <span class="data-label">Model Comisionare:</span>
                                    <span class="data-value">${activeModelObj.nm}</span>
                                </div>
                                <div class="data-row">
                                    <span class="data-label">Regim Reprezentare:</span>
                                    <span class="data-value">${exclusivityText}</span>
                                </div>
                            </div>
                            <div class="data-box">
                                <div class="data-row">
                                    <span class="data-label">Factor Tier Curent:</span>
                                    <span class="data-value">×${calculations.tierFactor.toFixed(2)}</span>
                                </div>
                                <div class="data-row">
                                    <span class="data-label">Interval Valoare:</span>
                                    <span class="data-value">${calculations.activeTier.lbl}</span>
                                </div>
                                <div class="data-row">
                                    <span class="data-label">Ajustare Exclusivitate:</span>
                                    <span class="data-value">${calculations.exclusivityAdjustment >= 0 ? '+' : ''}${calculations.exclusivityAdjustment.toFixed(2)}%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="section">
                        <div class="section-title">Servicii Configurate</div>
                        <table>
                            <thead>
                                <tr>
                                    <th style="width: 25%;">Serviciu</th>
                                    <th style="width: 45%;">Descriere</th>
                                    <th style="width: 15%;">Mod Plată</th>
                                    <th style="width: 15%; text-align: right;">Valoare / Coef.</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${servicesRows}
                            </tbody>
                        </table>
                    </div>

                    <div class="section">
                        <div class="section-title">Recapitulare Financiară</div>
                        <div class="financial-summary">
                            <div class="financial-title">Sumar Comisioane (fără TVA)</div>
                            <div class="financial-grid">
                                <div class="financial-col">
                                    <div class="financial-row">
                                        <span class="data-label">Comision Vânzător (%):</span>
                                        <span class="data-value">${formatPercent(calculations.finalSellerPercent)}</span>
                                    </div>
                                    <div class="financial-row">
                                        <span class="data-label">Comision Vânzător (€):</span>
                                        <span class="data-value">${formatEUR(calculations.sellerCommissionEUR)}</span>
                                    </div>
                                </div>
                                <div class="financial-col">
                                    <div class="financial-row">
                                        <span class="data-label">Comision Cumpărător (%):</span>
                                        <span class="data-value">${formatPercent(calculations.finalBuyerPercent)}</span>
                                    </div>
                                    <div class="financial-row">
                                        <span class="data-label">Comision Cumpărător (€):</span>
                                        <span class="data-value">${formatEUR(calculations.buyerCommissionEUR)}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="financial-grid" style="margin-top: 15px; border-top: 1px dashed #bbf7d0; padding-top: 15px;">
                                <div class="financial-col">
                                    <div class="financial-row">
                                        <span class="data-label">Servicii plătite separat (€):</span>
                                        <span class="data-value" style="color: #f59e0b;">${formatEUR(calculations.separateServicesCost)}</span>
                                    </div>
                                </div>
                                <div class="financial-col">
                                    <div class="financial-row">
                                        <span class="data-label">Servicii incluse în comision:</span>
                                        <span class="data-value" style="color: #10b981;">+${formatPercent(calculations.serviceCommissionPercentAddition)}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="financial-row total">
                                <span>Total servicii investite în proprietate în prima lună:</span>
                                <span>${formatEUR(calculations.totalServicesCostEUR)}</span>
                            </div>
                            <div class="financial-row total-monthly">
                                <span>Costuri Lunare (recurente):</span>
                                <span>${formatEUR(calculations.monthlyServicesCostEUR)}</span>
                            </div>
                        </div>
                    </div>

                    <div class="footer-disclaimer">
                        Prezentul document constituie o anexă de simulare a serviciilor și comisioanelor agreate în cadrul colaborării imobiliare. Toate comisioanele sunt exprimate în EUR și nu includ TVA (cota 19% aplicabilă conform legislației în vigoare). Prețurile serviciilor separate sunt exprimate în EUR și sunt de asemenea purtătoare de TVA. Termenii contractuali finali vor fi reglementați prin contractul de intermediere semnat între părți.
                    </div>

                    <div class="signatures-area">
                        <div class="signature-block-left">
                            <div class="signature-title">Generat de:</div>
                            <div class="signature-details">
                                <strong>Nume:</strong> ${user.full_name}<br>
                                <strong>Rol Profil:</strong> ${translateRole(user.role)}<br>
                                <strong>Email:</strong> ${user.email || 'Nespecificat'}<br>
                                <strong>Telefon:</strong> ${user.phone || 'Nespecificat'}<br>
                                <strong>Data și ora generării:</strong> ${formattedDate}
                            </div>
                            <div style="margin-top: 30px;">
                                <div class="signature-line">Semnătură Agent / Reprezentant</div>
                            </div>
                        </div>
                        <div class="signature-block-right">
                            <div class="agreement-text">
                                "Acestea sunt serviciile pe care eu le-am ales si cu care sunt de accord"
                            </div>
                            <div style="margin-top: 75px;">
                                <div class="signature-line-right">Semnătură Client / Proprietar</div>
                            </div>
                        </div>
                    </div>
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                    }
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
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
        <>
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
                                                            {s.monthly && (
                                                                <span className="ml-2 inline-flex items-center gap-0.5 text-[9px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded px-1.5 py-0.5 animate-pulse">
                                                                    lunar
                                                                </span>
                                                            )}
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
                                                                {formatServiceCost(s.cost, s.monthly)}
                                                            </div>
                                                        )}
                                                        {showSep && s.cost > 0 && (
                                                            <div className="text-xs font-extrabold text-amber-500">
                                                                {formatServiceCost(s.cost, s.monthly)}
                                                            </div>
                                                        )}
                                                        {!isSelected && s.cost > 0 && (
                                                            <div className="text-xs text-slate-500">
                                                                {formatServiceCost(s.cost, s.monthly)}
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
                                            <span className="truncate max-w-[140px] font-medium">
                                                {s.nm} {s.monthly && <span className="text-[9px] text-blue-400 font-semibold">(lunar)</span>}
                                            </span>
                                            <span className={mode === 'commission' ? 'text-emerald-400 font-semibold' : 'text-amber-500 font-semibold'}>
                                                {mode === 'commission' ? 'Inclus în comision' : formatServiceCost(s.cost, s.monthly)}
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
                            <Sparkles className="w-3.5 h-3.5" /> Total servicii investite în proprietate în prima lună
                        </div>
                        <div className="text-2xl font-extrabold text-emerald-400">
                            {formatEUR(calculations.totalServicesCostEUR)}
                        </div>
                        <p className="text-[9.5px] text-slate-400 leading-relaxed mt-1.5">
                            Reprezintă costul total al serviciilor alese în prima lună (incluse în comision + plătite separat, recurente și one-time).
                        </p>
                    </div>

                    {/* MONTHLY COSTS BANNER (BLUE BANNER) */}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 text-center mt-3">
                        <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
                            <Activity className="w-3.5 h-3.5" /> Costuri Lunare
                        </div>
                        <div className="text-2xl font-extrabold text-blue-400">
                            {formatEUR(calculations.monthlyServicesCostEUR)}
                        </div>
                        <p className="text-[9.5px] text-slate-400 leading-relaxed mt-1.5">
                            Reprezintă costul lunar recurent al serviciilor active alese (ex: promovare continuă, administrare).
                        </p>
                    </div>

                    {/* BUTTON GENERATE DOCUMENT */}
                    {associatedContract ? (
                        <button
                            type="button"
                            onClick={handleGenerateAnexa1}
                            disabled={savingAnexa}
                            className="w-full mt-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 border border-cyan-500/30 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {savingAnexa ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-slate-300 border-t-white rounded-full animate-spin"></div>
                                    <span>Se salvează Anexa 1...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 text-cyan-300" />
                                    <span>Generează Anexa 1 (Contract {associatedContract.contract_serial}/{associatedContract.contract_number})</span>
                                </>
                            )}
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleGenerateDocument}
                            className="w-full mt-4 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-orange-500/20 transition-all flex items-center justify-center gap-2 border border-orange-500/30 text-sm"
                        >
                            <FileText className="w-4 h-4" />
                            Generează Document
                        </button>
                    )}

                    <div className="text-[10px] text-slate-500 leading-relaxed mt-4 flex items-start gap-1.5 bg-slate-950/30 p-3 rounded-lg border border-slate-800/40">
                        <HelpCircle className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                        <div>
                            Valori cu scop informativ. Toate comisioanele sunt exprimate fără TVA (cota 19% aplicabilă conform legii). Contractul semnat guvernează termenii finali.
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* AUTH WARNING MODAL */}
        {showAuthAlert && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl relative text-center">
                    <button 
                        type="button"
                        onClick={() => setShowAuthAlert(false)}
                        className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors text-lg"
                    >
                        ✕
                    </button>
                    <div className="w-12 h-12 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20 flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Autentificare necesară</h3>
                    <p className="text-xs text-slate-400 leading-relaxed mb-6">
                        Pentru a genera acest document, trebuie să fii autentificat în contul tău Real Estate Hub.
                    </p>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => setShowAuthAlert(false)}
                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 px-4 rounded-xl text-xs transition-all border border-slate-700/50"
                        >
                            Închide
                        </button>
                        <a
                            href="/auth/login"
                            className="flex-1 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs text-center shadow-lg hover:shadow-orange-500/15 transition-all border border-orange-500/30"
                        >
                            Autentificare
                        </a>
                    </div>
                </div>
            </div>
        )}
    </>
    );
}
