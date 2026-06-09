'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createPresentationContract, verifyLeadForContract } from '@/app/lib/actions/presentation-contracts';
import { fetchLeads } from '@/app/lib/actions/leads';
import { supabase } from '@/app/lib/supabase/client';
import { FileText, ArrowLeft, Loader2, Sparkles, DollarSign, Calculator, HelpCircle } from 'lucide-react';
import Link from 'next/link';

function ContractGeneratorForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const propertyId = searchParams.get('property_id') || '';
    const leadIdParam = searchParams.get('lead_id') || '';

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [property, setProperty] = useState<any>(null);
    const [leads, setLeads] = useState<any[]>([]);
    
    // Form States
    const [selectedLeadId, setSelectedLeadId] = useState('');
    const [selectedLead, setSelectedLead] = useState<any>(null);
    
    const [selectionMode, setSelectionMode] = useState<'select' | 'manual'>('select');
    const [manualLeadId, setManualLeadId] = useState('');
    const [verifyingLead, setVerifyingLead] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'valid_accessible' | 'valid_hidden' | 'invalid'>('idle');

    const [commType, setCommType] = useState<'percent' | 'fixed'>('percent');
    const [buyComm, setBuyComm] = useState<number>(2.00); // 2% default buy commission
    const [rentComm, setRentComm] = useState<number>(50.00); // 50% default rent commission (half a month)
    const [calculatedComm, setCalculatedComm] = useState<number>(0);
    
    const [contractNumber, setContractNumber] = useState('');
    const [contractSerial, setContractSerial] = useState('VZN');

    // Reset lead selections when selection mode changes
    useEffect(() => {
        // Do not reset if it was loaded from query params on mount
        if (!leadIdParam) {
            setSelectedLeadId('');
            setSelectedLead(null);
            setManualLeadId('');
            setVerificationStatus('idle');
        }
    }, [selectionMode, leadIdParam]);

    const performVerification = async (leadIdToVerify: string) => {
        const cleanedInput = leadIdToVerify.trim().replace(/^(id\s*:\s*)+/i, '').trim();
        if (!cleanedInput) return;
        
        setVerifyingLead(true);
        setVerificationStatus('verifying');
        
        try {
            const res = await verifyLeadForContract(cleanedInput);
            if (res.success && res.exists) {
                if (res.hasAccess && res.lead) {
                    setVerificationStatus('valid_accessible');
                    setSelectedLead(res.lead);
                    setSelectedLeadId(res.lead.id);
                } else {
                    setVerificationStatus('valid_hidden');
                    const resolvedId = res.leadId || cleanedInput;
                    setSelectedLead({
                        id: resolvedId,
                        name: 'Client (Date ascunse)',
                        phone: '',
                        email: '',
                        id_document_type: '',
                        id_series_number: '',
                        cnp: '',
                        isHidden: true
                    });
                    setSelectedLeadId(resolvedId);
                }
            } else {
                setVerificationStatus('invalid');
                setSelectedLead(null);
                setSelectedLeadId('');
            }
        } catch (e) {
            console.error(e);
            setVerificationStatus('invalid');
            setSelectedLead(null);
            setSelectedLeadId('');
        } finally {
            setVerifyingLead(false);
        }
    };

    const handleVerifyLead = async () => {
        const cleanedInput = manualLeadId.trim().replace(/^(id\s*:\s*)+/i, '').trim();
        setManualLeadId(cleanedInput);
        await performVerification(cleanedInput);
    };

    // Load property details and leads list
    useEffect(() => {
        const loadInitialData = async () => {
            if (!propertyId) {
                alert('ID-ul proprietății lipsește!');
                router.push('/dashboard/agent/listings');
                return;
            }

            try {
                // 1. Fetch Property (supporting both UUID and friendly ID/short ID)
                const cleanRef = propertyId.trim();
                const cleanRefNoP = cleanRef.toLowerCase().startsWith('p') ? cleanRef.substring(1) : cleanRef;

                const { data: propData, error: propErr } = await supabase
                    .from('properties')
                    .select('id, title, price, currency, listing_type, address')
                    .or(`id.eq."${cleanRef}",friendly_id.eq."${cleanRef}",friendly_id.eq."P${cleanRef}",friendly_id.eq."P${cleanRefNoP}",friendly_id.eq."${cleanRefNoP}"`)
                    .limit(1)
                    .maybeSingle();

                if (propErr || !propData) {
                    alert('Proprietatea nu a fost găsită!');
                    router.push('/dashboard/agent/listings');
                    return;
                }
                setProperty(propData);

                // 2. Fetch Leads
                const leadsData = await fetchLeads();
                setLeads(leadsData || []);

                // 3. Generate random contract number
                setContractNumber(Math.floor(100000 + Math.random() * 900000).toString());

                // 4. Auto-fill lead_id if provided
                if (leadIdParam) {
                    const existsInCRM = leadsData?.some((l: any) => l.id === leadIdParam);
                    if (existsInCRM) {
                        setSelectionMode('select');
                        setSelectedLeadId(leadIdParam);
                    } else {
                        setSelectionMode('manual');
                        setManualLeadId(leadIdParam);
                        await performVerification(leadIdParam);
                    }
                }

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
    }, [propertyId, leadIdParam]);

    // Handle lead selection changes
    useEffect(() => {
        if (selectionMode === 'select') {
            if (selectedLeadId) {
                const leadObj = leads.find(l => l.id === selectedLeadId);
                setSelectedLead(leadObj || null);
            } else {
                setSelectedLead(null);
            }
        }
    }, [selectedLeadId, leads, selectionMode]);

    // Calculate commission dynamically
    useEffect(() => {
        if (!property) return;
        const price = property.price || 0;
        const isRent = property.listing_type === 'For Rent';

        if (commType === 'percent') {
            const activeRate = isRent ? rentComm : buyComm;
            setCalculatedComm(Math.round((price * activeRate) / 100));
        } else {
            setCalculatedComm(isRent ? rentComm : buyComm);
        }
    }, [commType, buyComm, rentComm, property]);

    const formatCurrency = (val: number, curCode = 'EUR') => {
        return new Intl.NumberFormat('ro-RO', { style: 'currency', currency: curCode, maximumFractionDigits: 0 }).format(val);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLeadId) {
            alert('Te rugăm să selectezi un client!');
            return;
        }

        setSubmitting(true);
        try {
            const res = await createPresentationContract({
                leadId: selectedLeadId,
                propertyId: property.id,
                negotiatedCommissionType: commType,
                negotiatedCommissionBuy: buyComm,
                negotiatedCommissionRent: rentComm,
                calculatedCommission: calculatedComm,
                propertyPrice: property.price || 0,
                contractSerial,
                contractNumber
            });

            if (res.success && res.contractId) {
                // Redirect to the newly generated contract preview page
                router.push(`/properties/presentation-contract-preview?id=${res.contractId}`);
            } else {
                alert('Eroare: ' + (res.error || 'Nu s-a putut genera contractul.'));
            }
        } catch (err: any) {
            alert('Eroare neprevăzută: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading || !property) {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                <p className="text-slate-500 text-sm font-semibold">Se încarcă datele...</p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Top Bar */}
            <div className="flex items-center gap-3">
                <Link
                    href={`/properties/${propertyId}`}
                    className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-700 transition-colors shadow-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Generare Contract de Vizionare</h1>
                    <p className="text-xs text-slate-500 font-medium">Securizarea dreptului de comision conform legii din România.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Form Fields */}
                <div className="md:col-span-2 space-y-6">
                    {/* Card 1: Property Info */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide flex items-center gap-2 border-b border-slate-100 pb-2.5">
                            <Sparkles className="w-4 h-4 text-orange-500" />
                            Proprietatea Selectată
                        </h3>
                        <div>
                            <h4 className="font-extrabold text-slate-900 text-base leading-snug">{property.title}</h4>
                            <p className="text-xs text-slate-400 mt-1 font-medium">{property.address}</p>
                        </div>
                        <div className="flex justify-between items-center bg-slate-50 rounded-xl p-3 border border-slate-100">
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Regim tranzacție</span>
                                <span className="text-xs font-bold text-slate-700 uppercase bg-slate-200 px-2 py-0.5 rounded">
                                    {property.listing_type === 'For Sale' ? 'Vânzare' : 'Închiriere'}
                                </span>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Preț listat</span>
                                <span className="text-base font-black text-slate-900">{formatCurrency(property.price, property.currency)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Select Client */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide flex items-center gap-2 border-b border-slate-100 pb-2.5">
                            👤 Selectează Clientul (Lead-ul)
                        </h3>

                        <div className="flex gap-2 p-1 bg-slate-50 border border-slate-200 rounded-xl mb-4">
                            <button
                                type="button"
                                onClick={() => setSelectionMode('select')}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                                    selectionMode === 'select'
                                        ? 'bg-slate-900 text-white shadow'
                                        : 'text-slate-500 hover:bg-slate-100'
                                }`}
                            >
                                Selectează din CRM
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectionMode('manual')}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                                    selectionMode === 'manual'
                                        ? 'bg-slate-900 text-white shadow'
                                        : 'text-slate-500 hover:bg-slate-100'
                                }`}
                            >
                                Introdu ID Lead Manual
                            </button>
                        </div>

                        <div className="space-y-4">
                            {selectionMode === 'manual' ? (
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            ID Lead (UUID sau ID Scurt)
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="e.g. 74d548bb sau 550e8400-e29b-41d4-a716-446655440000"
                                                value={manualLeadId}
                                                onChange={(e) => {
                                                    setManualLeadId(e.target.value);
                                                    if (verificationStatus !== 'idle') {
                                                        setVerificationStatus('idle');
                                                    }
                                                }}
                                                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-medium text-sm"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleVerifyLead}
                                                disabled={verifyingLead || !manualLeadId.trim()}
                                                className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1 shrink-0 disabled:bg-slate-205 disabled:text-slate-400 disabled:cursor-not-allowed"
                                            >
                                                {verifyingLead ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    'Verifică'
                                                )}
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-medium">
                                            Introduceți ID-ul scurt (ex: 74d548bb) sau UUID-ul complet. Sunt acceptate și prefixe de tipul "ID: 74d548bb".
                                        </p>
                                    </div>

                                    {/* Verification Status Messages */}
                                    {verificationStatus === 'valid_accessible' && (
                                        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium">
                                            ✓ Lead identificat! Aveți acces la datele acestuia (vor fi precompletate în contract).
                                        </div>
                                    )}
                                    {verificationStatus === 'valid_hidden' && (
                                        <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs space-y-1">
                                            <div className="font-bold text-amber-900">✓ Lead identificat în platformă!</div>
                                            <p className="text-slate-600 leading-normal">
                                                Acest lead aparține altui broker/team. Din motive de securitate, datele de contact (nume, telefon, email, documente) **NU sunt extrase**.
                                            </p>
                                            <p className="text-orange-700 font-semibold leading-normal pt-1">
                                                ⚠️ Clientul va introduce manual datele sale complete de identitate (nume, telefon, email, ID, CNP, etc.) pe ecranul de semnare.
                                            </p>
                                        </div>
                                    )}
                                    {verificationStatus === 'invalid' && (
                                        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium">
                                            ✗ ID Lead invalid sau inexistent în baza de date. Verificați ID-ul/UUID-ul introdus.
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Alege Client
                                    </label>
                                    <select
                                        required
                                        value={selectedLeadId}
                                        onChange={(e) => setSelectedLeadId(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-medium cursor-pointer"
                                    >
                                        <option value="">-- Alege un client din CRM --</option>
                                        {leads.map(l => (
                                            <option key={l.id} value={l.id}>
                                                {l.name} {l.phone ? `(${l.phone})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {selectedLead && (
                                <div className="p-4 bg-orange-50/50 rounded-xl border border-orange-100 space-y-2 text-xs animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="font-bold text-orange-800">Date Client înregistrate:</div>
                                    {selectedLead.isHidden ? (
                                        <div className="space-y-1.5 text-slate-700">
                                            <p><strong>Nume:</strong> {selectedLead.name}</p>
                                            <p className="text-amber-800 font-medium italic">
                                                🔒 Datele de contact ale acestui client aparțin altui broker. Vor fi completate de către client la semnarea contractului.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-2 text-slate-700">
                                            <div><strong>Nume:</strong> {selectedLead.name}</div>
                                            <div><strong>Telefon:</strong> {selectedLead.phone || 'Nespecificat'}</div>
                                            <div><strong>Email:</strong> {selectedLead.email || 'Nespecificat'}</div>
                                            <div><strong>Tip ID:</strong> {selectedLead.id_document_type || 'CI (necompletat)'}</div>
                                            <div><strong>Serie/Număr:</strong> {selectedLead.id_series_number || 'necompletat'}</div>
                                            <div><strong>CNP:</strong> {selectedLead.cnp || 'necompletat'}</div>
                                        </div>
                                    )}
                                    {(!selectedLead.cnp || !selectedLead.id_series_number || selectedLead.isHidden) && (
                                        <p className="text-[10px] text-slate-400 italic pt-1 leading-normal">
                                            💡 Datele de identitate lipsă pot fi introduse direct de către client în momentul în care primește link-ul și semnează contractul.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Card 3: Commission Negotiation */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide flex items-center gap-2 border-b border-slate-100 pb-2.5">
                            <Calculator className="w-4 h-4 text-orange-500" />
                            Comision Negociat cu Clientul
                        </h3>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                    Tip Comision
                                </label>
                                <div className="flex gap-4 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => setCommType('percent')}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                                            commType === 'percent'
                                                ? 'bg-slate-900 text-white shadow'
                                                : 'text-slate-500 hover:bg-slate-100'
                                        }`}
                                    >
                                        Procentual (%)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCommType('fixed')}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                                            commType === 'fixed'
                                                ? 'bg-slate-900 text-white shadow'
                                                : 'text-slate-500 hover:bg-slate-100'
                                        }`}
                                    >
                                        Valoare Fixă (€)
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                        Comision Cumpărare {commType === 'percent' ? '(%)' : '(EUR)'}
                                    </label>
                                    <input
                                        type="number"
                                        step={commType === 'percent' ? '0.01' : '1'}
                                        required
                                        value={buyComm}
                                        onChange={(e) => setBuyComm(Number(e.target.value))}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                        Comision Închiriere {commType === 'percent' ? '(%)' : '(EUR)'}
                                    </label>
                                    <input
                                        type="number"
                                        step={commType === 'percent' ? '0.01' : '1'}
                                        required
                                        value={rentComm}
                                        onChange={(e) => setRentComm(Number(e.target.value))}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-bold"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Summary & Submit */}
                <div className="space-y-6">
                    <div className="sticky top-24 space-y-6">
                        <div className="bg-slate-900 text-white border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 relative overflow-hidden">
                            {/* Decorative Background Glow */}
                            <div className="absolute -right-12 -bottom-12 w-36 h-36 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />

                            <h3 className="font-extrabold text-white text-base tracking-tight flex items-center gap-2">
                                <FileText className="w-5 h-5 text-orange-500" />
                                Sumar Contract
                            </h3>

                            {/* Serial/Number */}
                            <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-800 py-4 text-xs font-medium text-slate-400">
                                <div>
                                    <span>Serie Contract:</span>
                                    <input
                                        type="text"
                                        required
                                        value={contractSerial}
                                        onChange={(e) => setContractSerial(e.target.value.toUpperCase())}
                                        className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 mt-1 text-white font-bold uppercase"
                                    />
                                </div>
                                <div>
                                    <span>Număr Contract:</span>
                                    <input
                                        type="text"
                                        required
                                        value={contractNumber}
                                        onChange={(e) => setContractNumber(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 mt-1 text-white font-bold"
                                    />
                                </div>
                            </div>

                            {/* Recalculation Summary */}
                            <div className="space-y-3 pt-2">
                                <div className="flex justify-between text-xs font-medium text-slate-400">
                                    <span>Preț tranzacție estimat:</span>
                                    <span className="font-bold text-white">{formatCurrency(property.price)}</span>
                                </div>
                                <div className="flex justify-between text-xs font-medium text-slate-400">
                                    <span>Rată Comision:</span>
                                    <span className="font-bold text-white">
                                        {property.listing_type === 'For Rent' 
                                            ? (commType === 'percent' ? `${rentComm}%` : formatCurrency(rentComm))
                                            : (commType === 'percent' ? `${buyComm}%` : formatCurrency(buyComm))
                                        }
                                    </span>
                                </div>
                                
                                <div className="flex justify-between items-center pt-4 border-t border-slate-850">
                                    <div className="text-xs font-bold text-slate-300">Comision Estimat:</div>
                                    <div className="text-xl font-black text-orange-500">
                                        {formatCurrency(calculatedComm)}
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={submitting || !selectedLeadId}
                                className={`w-full py-3.5 px-4 rounded-xl font-bold text-white transition-all shadow-lg flex items-center justify-center gap-2 ${
                                    submitting || !selectedLeadId
                                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-orange-500/25 hover:-translate-y-0.5 cursor-pointer'
                                }`}
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Se generează...
                                    </>
                                ) : (
                                    <>
                                        <FileText className="w-5 h-5" />
                                        Generare Contract
                                    </>
                                )}
                            </button>

                            {/* Help tooltip */}
                            <div className="flex items-start gap-2 bg-slate-950/40 p-3 rounded-xl border border-slate-850/60">
                                <HelpCircle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                                <p className="text-[10px] text-slate-400 leading-normal">
                                    Prin generarea contractului, o activitate de tip **Vizionare Lead (Lead Appt Realised)** va fi înregistrată automat în raportul dvs. zilnic.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}

export default function GeneratePresentationContractPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
        }>
            <ContractGeneratorForm />
        </Suspense>
    );
}
