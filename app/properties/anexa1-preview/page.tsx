'use client';

import React, { useRef, useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Printer, Share2, Globe, Trash2, Check, FileText, Save, Sparkles, Activity, AlertCircle } from 'lucide-react';
import { getCollaborationContract, updateAnexaSignatures } from '@/app/lib/actions/collaboration-contracts';

interface SignaturePadProps {
    id: string;
    label: string;
    clearLabel: string;
    savedSignature?: string;
    onSave?: (dataUrl: string) => Promise<void>;
    isRo: boolean;
}

function SignaturePad({ id, label, clearLabel, savedSignature, onSave, isRo }: SignaturePadProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSigned, setHasSigned] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        
        let clientX = 0;
        let clientY = 0;
        
        if ('touches' in e) {
            if (e.touches.length === 0) return { x: 0, y: 0 };
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        // Use CSS coordinates directly, as the canvas context is scaled by 2
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        
        return { x, y };
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if ('touches' in e) {
            e.preventDefault();
        }
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { x, y } = getCoordinates(e);
        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
        setHasSigned(true);
        setIsSaved(false);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        if ('touches' in e) {
            e.preventDefault();
        }
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { x, y } = getCoordinates(e);
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasSigned(false);
        setIsSaved(false);
    };

    const handleSave = async () => {
        const canvas = canvasRef.current;
        if (!canvas || !onSave) return;
        
        setIsSaving(true);
        try {
            const dataUrl = canvas.toDataURL();
            await onSave(dataUrl);
            setIsSaved(true);
        } catch (error) {
            console.error('Failed to save signature:', error);
            alert(isRo ? 'Nu s-a putut salva semnătura.' : 'Could not save signature.');
        } finally {
            setIsSaving(false);
        }
    };

    const initCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * 2;
        canvas.height = rect.height * 2;
        
        ctx.scale(2, 2);
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#0f172a'; // Deep slate ink

        if (savedSignature) {
            const img = new Image();
            img.src = savedSignature;
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, rect.width, rect.height);
                setHasSigned(true);
                setIsSaved(true);
            };
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            setHasSigned(false);
            setIsSaved(false);
        }
    };

    useEffect(() => {
        initCanvas();
        window.addEventListener('resize', initCanvas);
        return () => window.removeEventListener('resize', initCanvas);
    }, [savedSignature]);

    return (
        <div className="flex flex-col items-center w-full">
            <div className="w-full h-32 bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg relative overflow-hidden group cursor-crosshair">
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full touch-none"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
                {!hasSigned && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs italic">
                        {isRo ? 'Semnați aici' : 'Sign here'}
                    </div>
                )}
            </div>
            <div className="flex justify-between items-center w-full mt-2 no-print gap-2">
                <span className="text-[11px] text-slate-500 italic">{label}</span>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={clearCanvas}
                        className="text-[11px] font-semibold text-rose-500 hover:text-rose-700 transition-colors flex items-center gap-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded px-2 py-1"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        {clearLabel}
                    </button>
                    {onSave && (
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={isSaving || !hasSigned}
                            className={`text-[11px] font-semibold transition-colors flex items-center gap-1 border rounded px-2 py-1 ${
                                isSaved 
                                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600'
                                    : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-white disabled:opacity-50 disabled:cursor-not-allowed'
                            }`}
                        >
                            {isSaving ? (
                                <>
                                    <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-white rounded-full animate-spin"></div>
                                    <span>...</span>
                                </>
                            ) : isSaved ? (
                                <>
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>{isRo ? 'Salvat' : 'Saved'}</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-3.5 h-3.5" />
                                    <span>{isRo ? 'Salvează' : 'Save'}</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function AnexaPreviewContent() {
    const searchParams = useSearchParams();
    const [contractId, setContractId] = useState<string | null>(null);
    const [contractData, setContractData] = useState<any>(null);
    const [lang, setLang] = useState<'ro' | 'en'>('ro');
    const [copied, setCopied] = useState(false);

    const loadContract = async (id: string) => {
        const res = await getCollaborationContract(id);
        if (res.success && res.contract) {
            const contract = res.contract;
            setContractData(contract);
            setContractId(id);
            if (contract.language) {
                setLang(contract.language);
            }
        }
    };

    useEffect(() => {
        const id = searchParams.get('id');
        if (id) {
            loadContract(id);
        }
    }, [searchParams]);

    if (!contractData) {
        return (
            <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-4"></div>
                <p className="text-lg font-medium text-slate-300">
                    Se încarcă detaliile anexei... / Loading annex details...
                </p>
            </div>
        );
    }

    if (!contractData.anexa_data) {
        return (
            <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 text-center">
                <AlertCircle className="w-12 h-12 text-orange-500 mb-4" />
                <p className="text-lg font-bold text-slate-300">
                    Anexa 1 nu a fost încă generată pentru acest contract.
                </p>
                <p className="text-sm text-slate-500 mt-2 max-w-sm">
                    Vă rugăm să folosiți calculatorul de comisioane de pe pagina proprietății pentru a o genera.
                </p>
            </div>
        );
    }

    const { contract_serial, contract_number, agent_details, form_data, anexa_data } = contractData;
    const isRo = lang === 'ro';

    const handlePrint = () => {
        window.print();
    };

    const handleShare = () => {
        try {
            const shareUrl = `${window.location.origin}/properties/anexa1-preview?id=${contractId}`;
            navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy link:', err);
        }
    };

    const handleSaveAgentSignature = async (signatureDataUrl: string) => {
        if (!contractId) return;
        const res = await updateAnexaSignatures(contractId, {
            agent_signature: signatureDataUrl
        });
        if (res.success && res.contract) {
            setContractData((prev: any) => ({
                ...prev,
                anexa_agent_signature: res.contract.anexa_agent_signature,
                anexa_status: res.contract.anexa_status
            }));
        } else {
            throw new Error(res.error || 'Failed to save signature');
        }
    };

    const handleSaveOwnerSignature = async (signatureDataUrl: string) => {
        if (!contractId) return;
        const res = await updateAnexaSignatures(contractId, {
            owner_signature: signatureDataUrl
        });
        if (res.success && res.contract) {
            setContractData((prev: any) => ({
                ...prev,
                anexa_owner_signature: res.contract.anexa_owner_signature,
                anexa_status: res.contract.anexa_status
            }));
        } else {
            throw new Error(res.error || 'Failed to save signature');
        }
    };

    const formatEUR = (value: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
    };

    const formatPercent = (val: number) => {
        return `${val.toFixed(2).replace('.', ',')}%`;
    };

    const t = {
        title: isRo ? 'ANEXA NR. 1' : 'ANNEX NO. 1',
        subtitle: isRo 
            ? `la Contractul de Colaborare Imobiliară Seria ${contract_serial} Nr. ${contract_number}` 
            : `to the Real Estate Collaboration Contract Series ${contract_serial} No. ${contract_number}`,
        
        propertyTitle: isRo ? 'Obiectul Colaborării:' : 'Object of Collaboration:',
        propertyPrice: isRo ? 'Valoare de promovare:' : 'Listing value:',
        commissionModel: isRo ? 'Model Comision Selectat:' : 'Selected Commission Model:',
        exclusivityType: isRo ? 'Regim Promovare:' : 'Marketing Regime:',

        servicesTitle: isRo ? 'Servicii Incluse și Structură de Cost' : 'Included Services & Cost Structure',
        serviceNameHeader: isRo ? 'Serviciu' : 'Service',
        serviceDescHeader: isRo ? 'Descriere' : 'Description',
        servicePayHeader: isRo ? 'Modalitate Plată' : 'Payment Mode',
        serviceCostHeader: isRo ? 'Cost Serviciu' : 'Service Cost',

        commModelTitle: isRo ? 'Comisioane Procentuale' : 'Percentage Commissions',
        sellerCommLabel: isRo ? 'Comision Vânzător (Proprietar):' : 'Seller Commission (Owner):',
        buyerCommLabel: isRo ? 'Comision Cumpărător (Client):' : 'Buyer Commission (Client):',

        summaryTitle: isRo ? 'Recapitulare Costuri Servicii' : 'Services Outlay Summary',
        calculationsTitle: isRo ? 'Recapitulare Costuri & Comisioane' : 'Costs & Commissions Summary',
        totalFirstMonthLabel: isRo ? 'Total Investiție Servicii (Prima lună):' : 'Total Services Investment (First Month):',
        totalFirstMonthDesc: isRo 
            ? 'Include toate serviciile active (incluse în comision + plătite separat, recurente și one-time).'
            : 'Includes all active services (included in commission + separate payment, recurring and one-time).',
        monthlyRecurrentLabel: isRo ? 'Costuri recurente lunare:' : 'Monthly recurring costs:',
        monthlyRecurrentDesc: isRo 
            ? 'Reprezintă costul lunar recurent pentru serviciile de promovare și administrare continuă.'
            : 'Represents the monthly recurring cost for continuous marketing and management.',

        signProvider: isRo ? 'PRESTATOR' : 'PROVIDER',
        signBeneficiary: isRo ? 'BENEFICIAR' : 'BENEFICIARY',
        signLineProvider: isRo ? 'Semnătura și Ștampila' : 'Signature and Stamp',
        signLineBeneficiary: isRo ? 'Semnătura' : 'Signature',
        clearBtn: isRo ? 'Șterge' : 'Clear',
        footerText: isRo
            ? 'Prezenta anexă face parte integrantă din contractul de colaborare imobiliară. Generat prin platforma Real Estate MLS.'
            : 'This annex forms an integral part of the real estate collaboration contract. Generated via the Real Estate MLS platform.'
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col print:bg-white print:text-slate-900 pb-12">
            <style jsx global>{`
                nav, footer {
                    display: none !important;
                }
                main {
                    padding-top: 0 !important;
                }
                @media print {
                    .no-print {
                        display: none !important;
                    }
                    body {
                        background-color: white !important;
                        color: black !important;
                    }
                    .print-sheet {
                        box-shadow: none !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        max-width: 100% !important;
                        border: none !important;
                        background: transparent !important;
                    }
                    .party-info {
                        background-color: #f8fafc !important;
                        border: 1px solid #e2e8f0 !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .services-table {
                        border-collapse: collapse !important;
                        width: 100% !important;
                    }
                    .services-table th, .services-table td {
                        border: 1px solid #e2e8f0 !important;
                        padding: 8px !important;
                        font-size: 11px !important;
                    }
                    .signatures-grid {
                        display: grid !important;
                        grid-template-cols: 1fr 1fr !important;
                        gap: 16px !important;
                    }
                }
            `}</style>

            {/* Sticky Floating Control Header (Non-Printable) */}
            <header className="sticky top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 py-4 px-6 no-print shadow-lg">
                <div className="max-w-[800px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg text-white">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-white tracking-wide">
                                {isRo ? 'PREVIZUALIZARE ANEXA 1' : 'ANNEX 1 PREVIEW'}
                            </h1>
                            <p className="text-[11px] text-slate-400">
                                {contract_serial} / {contract_number}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Language Switcher */}
                        <button
                            type="button"
                            onClick={() => setLang(lang === 'ro' ? 'en' : 'ro')}
                            className="p-2 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl flex items-center gap-2 text-xs font-semibold transition-all"
                        >
                            <Globe className="w-4 h-4 text-slate-400" />
                            <span>{isRo ? 'English (EN)' : 'Română (RO)'}</span>
                        </button>

                        {/* Share link button */}
                        <button
                            type="button"
                            onClick={handleShare}
                            className={`p-2 px-4 rounded-xl flex items-center gap-2 text-xs font-semibold border transition-all ${
                                copied
                                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                            }`}
                        >
                            {copied ? (
                                <>
                                    <Check className="w-4 h-4" />
                                    <span>{isRo ? 'Copiat!' : 'Copied!'}</span>
                                </>
                            ) : (
                                <>
                                    <Share2 className="w-4 h-4" />
                                    <span>{isRo ? 'Copiază link' : 'Copy link'}</span>
                                </>
                            )}
                        </button>

                        {/* Print Button */}
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="p-2 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl flex items-center gap-2 text-xs font-bold transition-all shadow-md active:scale-[0.98]"
                        >
                            <Printer className="w-4 h-4" />
                            <span>{isRo ? 'Printează / Salvează PDF' : 'Print / Save PDF'}</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Document body wrapper */}
            <main className="flex-1 flex justify-center items-start pt-8 px-4 sm:px-6">
                {/* Print Sheet */}
                <article className="print-sheet max-w-[800px] w-full bg-white text-slate-900 shadow-2xl rounded-2xl border border-slate-200 p-8 sm:p-12 md:p-16 leading-relaxed select-text font-serif">
                    <div className="font-sans text-[13px] text-justify text-slate-800">
                        {/* Header metadata */}
                        <div className="text-center mb-8 border-b-2 double border-slate-200 pb-6">
                            <h2 className="font-serif text-xl sm:text-2xl font-bold uppercase tracking-wider text-slate-900 mb-2">
                                {t.title}
                            </h2>
                            <p className="text-sm font-semibold text-slate-600 italic">
                                {t.subtitle}
                            </p>
                        </div>

                        {/* Property & Contract context */}
                        <div className="party-info bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                <div>
                                    <span className="block text-[10px] uppercase font-bold text-slate-400">{t.propertyTitle}</span>
                                    <span className="font-semibold text-slate-900">{anexa_data.propertyName || '................................................'}</span>
                                </div>
                                <div>
                                    <span className="block text-[10px] uppercase font-bold text-slate-400">{t.propertyPrice}</span>
                                    <span className="font-extrabold text-slate-900">{formatEUR(anexa_data.propertyValue)}</span>
                                </div>
                                <div>
                                    <span className="block text-[10px] uppercase font-bold text-slate-400">{t.commissionModel}</span>
                                    <span className="font-semibold text-slate-900">{anexa_data.activeModelName}</span>
                                </div>
                                <div>
                                    <span className="block text-[10px] uppercase font-bold text-slate-400">{t.exclusivityType}</span>
                                    <span className="font-semibold text-slate-900">{anexa_data.exclusivityText}</span>
                                </div>
                            </div>
                        </div>

                        {/* Services List Table */}
                        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-1 mt-6 mb-3 uppercase tracking-wide">
                            {t.servicesTitle}
                        </h3>
                        <div className="overflow-x-auto mb-6">
                            <table className="services-table w-full text-left text-xs border border-slate-200">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="p-3 font-bold text-slate-700 border-r border-slate-200">{t.serviceNameHeader}</th>
                                        <th className="p-3 font-bold text-slate-700 border-r border-slate-200">{t.serviceDescHeader}</th>
                                        <th className="p-3 font-bold text-slate-700 border-r border-slate-200">{t.servicePayHeader}</th>
                                        <th className="p-3 font-bold text-slate-700 text-right">{t.serviceCostHeader}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {anexa_data.selectedServices.map((s: any, idx: number) => (
                                        <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50/50">
                                            <td className="p-3 font-bold text-slate-900 border-r border-slate-200">
                                                {s.name}
                                                {s.monthly && (
                                                    <span className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded ml-1.5 uppercase">
                                                        {isRo ? 'lunar' : 'monthly'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-3 text-slate-500 border-r border-slate-200">{s.desc}</td>
                                            <td className={`p-3 font-semibold border-r border-slate-200 ${s.payMode === 'commission' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                {s.payMode === 'commission' 
                                                    ? (isRo ? 'Inclus în comision' : 'Included in commission') 
                                                    : (isRo ? 'Plată separată' : 'Separate payment')}
                                            </td>
                                            <td className="p-3 font-bold text-right text-slate-900">
                                                {s.payMode === 'commission' 
                                                    ? `+${formatPercent(s.coef)}` 
                                                    : (s.monthly ? `${formatEUR(s.cost)} / ${isRo ? 'lună' : 'month'}` : formatEUR(s.cost))}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Commissions Recap */}
                        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-1 mt-6 mb-3 uppercase tracking-wide">
                            {t.commModelTitle}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                            <div className="party-info bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-600">{t.sellerCommLabel}</span>
                                <div className="text-right">
                                    <span className="block text-sm font-extrabold text-slate-900">{formatPercent(anexa_data.calculations.sellerPercent)}</span>
                                    <span className="text-[10px] text-slate-400">{formatEUR(anexa_data.calculations.sellerCommEUR)}</span>
                                </div>
                            </div>
                            <div className="party-info bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-600">{t.buyerCommLabel}</span>
                                <div className="text-right">
                                    <span className="block text-sm font-extrabold text-slate-900">{formatPercent(anexa_data.calculations.buyerPercent)}</span>
                                    <span className="text-[10px] text-slate-400">{formatEUR(anexa_data.calculations.buyerCommEUR)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Cost Recap Summary */}
                        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-1 mt-6 mb-3 uppercase tracking-wide">
                            {t.calculationsTitle}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                            <div className="party-info bg-emerald-50/30 border border-emerald-200 rounded-lg p-4">
                                <span className="block text-[10px] uppercase font-bold text-emerald-600 mb-1">{t.totalFirstMonthLabel}</span>
                                <span className="text-xl font-extrabold text-emerald-700">{formatEUR(anexa_data.calculations.totalServicesFirstMonthEUR)}</span>
                                <span className="block text-[9.5px] text-slate-500 leading-relaxed mt-2">{t.totalFirstMonthDesc}</span>
                            </div>
                            <div className="party-info bg-blue-50/30 border border-blue-200 rounded-lg p-4">
                                <span className="block text-[10px] uppercase font-bold text-blue-600 mb-1">{t.monthlyRecurrentLabel}</span>
                                <span className="text-xl font-extrabold text-blue-700">{formatEUR(anexa_data.calculations.monthlyServicesCostEUR)}</span>
                                <span className="block text-[9.5px] text-slate-500 leading-relaxed mt-2">{t.monthlyRecurrentDesc}</span>
                            </div>
                        </div>

                        {/* Signatures */}
                        <div className="signatures-grid grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 mt-12 pt-6 border-t border-slate-200 page-break-inside-avoid">
                            <div className="flex flex-col items-center">
                                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                                    {t.signProvider}
                                </div>
                                <div className="text-xs text-slate-600 font-semibold mb-4 text-center max-w-full truncate">
                                    {agent_details?.company_name || '................................................'}
                                </div>
                                <SignaturePad 
                                    id="anexa-provider-signature" 
                                    label={t.signLineProvider} 
                                    clearLabel={t.clearBtn} 
                                    savedSignature={contractData.anexa_agent_signature}
                                    onSave={contractId ? handleSaveAgentSignature : undefined}
                                    isRo={isRo}
                                />
                            </div>

                            <div className="flex flex-col items-center">
                                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                                    {t.signBeneficiary}
                                </div>
                                <div className="text-xs text-slate-600 font-semibold mb-4 text-center max-w-full truncate">
                                    {form_data.ownerName || '................................................'}
                                </div>
                                <SignaturePad 
                                    id="anexa-beneficiary-signature" 
                                    label={t.signLineBeneficiary} 
                                    clearLabel={t.clearBtn} 
                                    savedSignature={contractData.anexa_owner_signature}
                                    onSave={contractId ? handleSaveOwnerSignature : undefined}
                                    isRo={isRo}
                                />
                            </div>
                        </div>

                        {/* Footer Section */}
                        <div className="text-center text-[10px] text-slate-400 mt-12 pt-4 border-t border-slate-100 page-break-inside-avoid">
                            {t.footerText}
                        </div>
                    </div>
                </article>
            </main>
        </div>
    );
}

export default function AnexaPreviewPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-4"></div>
                <span className="text-lg font-medium text-slate-300">Se încarcă Anexa 1... / Loading Annex 1...</span>
            </div>
        }>
            <AnexaPreviewContent />
        </Suspense>
    );
}
