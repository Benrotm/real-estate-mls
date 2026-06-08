'use client';

import React, { useRef, useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Printer, Share2, Globe, Trash2, Check, FileText, Save, Sparkles, Lock, Unlock, Loader2, UserCheck, AlertCircle } from 'lucide-react';
import { getPresentationContract, updatePresentationSignatures, lockPresentationContract } from '@/app/lib/actions/presentation-contracts';
import { supabase } from '@/app/lib/supabase/client';

interface SignaturePadProps {
    id: string;
    label: string;
    clearLabel: string;
    savedSignature?: string;
    onSave?: (dataUrl: string) => Promise<void>;
    isLocked?: boolean;
}

function SignaturePad({ id, label, clearLabel, savedSignature, onSave, isLocked }: SignaturePadProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSigned, setHasSigned] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const saveTimeoutRef = useRef<any>(null);

    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

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
        
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        
        return { x, y };
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (isLocked) return;
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

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (isLocked) return;
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
        if (isLocked) return;
        if (!isDrawing) return;
        setIsDrawing(false);

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        if (onSave) {
            saveTimeoutRef.current = setTimeout(async () => {
                const canvas = canvasRef.current;
                if (!canvas) return;
                setIsSaving(true);
                try {
                    const dataUrl = canvas.toDataURL();
                    await onSave(dataUrl);
                    setIsSaved(true);
                } catch (error) {
                    console.error('Failed to auto-save signature:', error);
                } finally {
                    setIsSaving(false);
                }
            }, 1000);
        }
    };

    const clearCanvas = () => {
        if (isLocked) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasSigned(false);
        setIsSaved(false);

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        if (onSave) {
            onSave('');
        }
    };

    const handleSave = async () => {
        if (isLocked) return;
        const canvas = canvasRef.current;
        if (!canvas || !onSave) return;
        
        setIsSaving(true);
        try {
            const dataUrl = canvas.toDataURL();
            await onSave(dataUrl);
            setIsSaved(true);
        } catch (error) {
            console.error('Failed to save signature:', error);
            alert('Nu s-a putut salva semnătura.');
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
                {!hasSigned && !isLocked && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs italic">
                        Semnați aici
                    </div>
                )}
            </div>
            <div className="flex justify-between items-center w-full mt-2 no-print gap-2">
                <span className="text-[11px] text-slate-500 italic">{label}</span>
                {!isLocked && (
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
                                data-saved={isSaved}
                                disabled={isSaving || !hasSigned}
                                className={`signature-save-button text-[11px] font-semibold transition-colors flex items-center gap-1 border rounded px-2 py-1 ${
                                    isSaved 
                                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600'
                                        : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-white disabled:opacity-50 disabled:cursor-not-allowed'
                                }`}
                            >
                                {isSaving ? (
                                    <>
                                        <div className="w-3.5 h-3.5 border-2 border-slate-350 border-t-white rounded-full animate-spin"></div>
                                        <span>...</span>
                                    </>
                                ) : isSaved ? (
                                    <>
                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>Salvat</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-3.5 h-3.5" />
                                        <span>Salvează</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function PresentationContractContent() {
    const searchParams = useSearchParams();
    const [contractId, setContractId] = useState<string | null>(null);
    const [contractData, setContractData] = useState<any>(null);
    const [copied, setCopied] = useState(false);
    const [canManage, setCanManage] = useState(false);

    // Client Editable Fields (State)
    const [clientCnp, setClientCnp] = useState('');
    const [clientIdType, setClientIdType] = useState('C.I.');
    const [clientIdSeries, setClientIdSeries] = useState('');

    const loadContract = async (id: string) => {
        const res = await getPresentationContract(id);
        if (res.success && res.contract) {
            const contract = res.contract;
            setContractData({
                agentProfile: contract.agent_details,
                clientProfile: contract.client_details,
                contractSerial: contract.contract_serial,
                contractNumber: contract.contract_number,
                created_at: contract.created_at,
                agent_signature: contract.agent_signature,
                client_signature: contract.client_signature,
                status: contract.status,
                propertyId: contract.property_id,
                property: contract.property,
                is_locked: contract.is_locked,
                agent_id: contract.agent_id,
                negotiated_commission_type: contract.negotiated_commission_type,
                negotiated_commission_buy: contract.negotiated_commission_buy,
                negotiated_commission_rent: contract.negotiated_commission_rent,
                calculated_commission: contract.calculated_commission,
                property_price: contract.property_price
            });
            
            // Set client verification fields state
            setClientCnp(contract.client_details?.cnp || '');
            setClientIdType(contract.client_details?.idDocumentType || 'C.I.');
            setClientIdSeries(contract.client_details?.idSeriesNumber || '');
            
            setContractId(id);
        }
    };

    useEffect(() => {
        const id = searchParams.get('id');
        if (id) {
            loadContract(id);
        }
    }, [searchParams]);

    useEffect(() => {
        const checkPermission = async () => {
            if (!contractData) return;
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    setCanManage(false);
                    return;
                }
                
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();
                
                const agentId = contractData.agent_id || contractData.agentProfile?.id;
                const isCreator = user.id === agentId;
                const isAdminOrAgent = profile && ['admin', 'super_admin', 'agent'].includes(profile.role);
                
                setCanManage(!!(isCreator || isAdminOrAgent));
            } catch (err) {
                console.error('Error checking permissions:', err);
                setCanManage(false);
            }
        };
        
        checkPermission();
    }, [contractData]);

    if (!contractData) {
        return (
            <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-4"></div>
                <p className="text-lg font-medium text-slate-300">
                    Se încarcă detaliile contractului de vizionare...
                </p>
                <p className="text-sm text-slate-500 mt-2">
                    Te rugăm să te asiguri că linkul accesat este complet.
                </p>
            </div>
        );
    }

    const { agentProfile, clientProfile, contractSerial, contractNumber, created_at, status, property, property_price, negotiated_commission_type, negotiated_commission_buy, negotiated_commission_rent, calculated_commission, is_locked } = contractData;

    const displayPropertyId = property?.personal_property_id || (property?.id ? 'P' + property.id.substring(0, 5).toUpperCase() : '');

    const handlePrint = () => {
        window.print();
    };

    const formatEUR = (value: number) => {
        return new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
    };

    const handleShare = async () => {
        const shareUrl = contractId 
            ? `${window.location.origin}/properties/presentation-contract-preview?id=${contractId}`
            : window.location.href;
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Contract de Vizionare Imobiliară',
                    text: 'Vizualizează contractul de vizionare imobiliară.',
                    url: shareUrl,
                });
            } catch (err) {
                console.log('Share was cancelled or failed:', err);
            }
        } else {
            try {
                await navigator.clipboard.writeText(shareUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.error('Failed to copy link:', err);
            }
        }
    };

    const handleLockContract = async () => {
        if (!contractId) return;
        if (!window.confirm('Sigur doriți să blocați acest contract? După blocare, semnăturile și detaliile nu mai pot fi modificate.')) {
            return;
        }
        const res = await lockPresentationContract(contractId);
        if (res.success && res.contract) {
            setContractData((prev: any) => ({
                ...prev,
                is_locked: true
            }));
            alert('Contractul a fost blocat cu succes!');
        } else {
            alert('Eroare la blocarea contractului.');
        }
    };

    const handleSaveContract = () => {
        // Validation check for client details
        if (!clientCnp.trim() || clientCnp.length !== 13) {
            alert('Codul Numeric Personal (CNP) este obligatoriu pentru validitatea contractului și trebuie să conțină exact 13 cifre!');
            return;
        }
        if (!clientIdSeries.trim()) {
            alert('Seria și Numărul actului de identitate sunt obligatorii!');
            return;
        }

        const saveButtons = document.querySelectorAll('.signature-save-button');
        let clickedCount = 0;
        saveButtons.forEach((btn: any) => {
            const isSaved = btn.getAttribute('data-saved') === 'true';
            if (!btn.disabled && !isSaved) {
                btn.click();
                clickedCount++;
            }
        });
        
        if (clickedCount > 0) {
            alert('Semnăturile se salvează...');
        } else {
            alert('Contractul a fost salvat cu succes!');
        }
    };

    const handleSaveAgentSignature = async (signatureDataUrl: string) => {
        if (!contractId) return;
        
        // Sync current state of client details snapshot
        const updatedClientDetails = {
            ...clientProfile,
            cnp: clientCnp,
            idDocumentType: clientIdType,
            idSeriesNumber: clientIdSeries
        };

        const res = await updatePresentationSignatures(contractId, {
            agent_signature: signatureDataUrl,
            client_details: updatedClientDetails
        });
        
        if (res.success && res.contract) {
            setContractData((prev: any) => ({
                ...prev,
                agent_signature: res.contract.agent_signature,
                client_details: res.contract.client_details,
                status: res.contract.status
            }));
        } else {
            throw new Error(res.error || 'Failed to save signature');
        }
    };

    const handleSaveClientSignature = async (signatureDataUrl: string) => {
        if (!contractId) return;

        // Validation check for client details prior to signature save
        if (!clientCnp.trim() || clientCnp.length !== 13) {
            alert('CNP-ul trebuie să conțină exact 13 cifre înainte de a semna!');
            throw new Error('Missing CNP');
        }
        if (!clientIdSeries.trim()) {
            alert('Seria și Numărul actului sunt obligatorii înainte de a semna!');
            throw new Error('Missing ID Series');
        }

        // Sync current state of client details snapshot
        const updatedClientDetails = {
            ...clientProfile,
            cnp: clientCnp,
            idDocumentType: clientIdType,
            idSeriesNumber: clientIdSeries
        };

        const res = await updatePresentationSignatures(contractId, {
            client_signature: signatureDataUrl,
            client_details: updatedClientDetails
        });
        
        if (res.success && res.contract) {
            setContractData((prev: any) => ({
                ...prev,
                client_signature: res.contract.client_signature,
                client_details: res.contract.client_details,
                status: res.contract.status
            }));
        } else {
            throw new Error(res.error || 'Failed to save signature');
        }
    };

    const dateFormatted = new Date(created_at).toLocaleDateString('ro-RO');

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
                }
            `}</style>

            {/* Sticky Floating Control Header (Non-Printable) */}
            <header className="sticky top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 py-4 px-6 no-print shadow-lg">
                <div className="max-w-[800px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg text-white">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-white tracking-wide">
                                CONTRACT DE VIZIONARE (FIȘĂ VIZIONARE)
                            </h1>
                            <p className="text-[11px] text-slate-400">
                                {contractSerial} / {contractNumber}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Copy share link button */}
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
                                    <span>Copiat!</span>
                                </>
                            ) : (
                                <>
                                    <Share2 className="w-4 h-4" />
                                    <span>Partajează Link</span>
                                </>
                            )}
                        </button>

                        {/* Lock Button */}
                        {canManage && !is_locked && (
                            <button
                                type="button"
                                onClick={handleLockContract}
                                className="p-2 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl flex items-center gap-2 text-xs font-semibold transition-all shadow-md"
                            >
                                <Lock className="w-4 h-4" />
                                <span>Blochează</span>
                            </button>
                        )}

                        {/* Print Button */}
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="p-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl flex items-center gap-2 text-xs font-semibold transition-all shadow-md"
                        >
                            <Printer className="w-4 h-4" />
                            <span>Printează</span>
                        </button>

                        {/* Save Button */}
                        {!is_locked && (
                            <button
                                type="button"
                                onClick={handleSaveContract}
                                className="p-2 px-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl flex items-center gap-2 text-xs font-bold transition-all shadow-md shadow-orange-500/10"
                            >
                                <UserCheck className="w-4 h-4" />
                                <span>Finalizează & Semnează</span>
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Contract Sheet Page */}
            <div className="flex-1 max-w-[800px] w-full mx-auto p-4 sm:p-8 mt-6">
                <div className="print-sheet bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-12 shadow-2xl text-slate-300 text-sm leading-relaxed space-y-8 print:bg-white print:text-slate-900 print:border-none print:shadow-none">
                    
                    {/* Header: Title */}
                    <div className="text-center space-y-2 pb-6 border-b border-slate-800/60 print:border-slate-200">
                        <div className="text-sm font-extrabold text-orange-500 uppercase tracking-widest print:text-orange-600">
                            Real Estate Hub - www.imobum.com
                        </div>
                        <div className="text-[11px] text-slate-400 font-semibold italic max-w-lg mx-auto print:text-slate-600 leading-normal">
                            Primul Hub de Imobiliare Romanesc unde peste 200 de Brokeri Imobiliari lucreaza in colaborare pentru tine.
                        </div>
                        <div className="h-2" />
                        <h2 className="text-xl sm:text-2xl font-black text-white print:text-slate-900 tracking-tight">
                            CONTRACT DE VIZIONARE ȘI PRESTĂRI SERVICII IMOBILIARE
                        </h2>
                        <div className="text-xs font-bold text-slate-400 tracking-widest uppercase">
                            Seria {contractSerial} Nr. {contractNumber} din {dateFormatted}
                        </div>
                    </div>

                    {/* Parties Section */}
                    <div className="space-y-4">
                        <h3 className="font-extrabold text-white print:text-slate-900 text-base border-l-4 border-orange-500 pl-2">
                            1. PĂRȚILE CONTRACTANTE
                        </h3>

                        {/* Party A: Broker/Agency */}
                        <div className="party-info bg-slate-950 p-5 rounded-2xl border border-slate-855 space-y-2 print:bg-slate-50 print:border-slate-200">
                            <h4 className="font-bold text-white print:text-slate-900 text-xs uppercase tracking-wider text-orange-500">
                                PRESTATOR (Agenția Imobiliară / Broker)
</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                <div><strong>Denumire Societate:</strong> {agentProfile?.companyName || 'Nespecificat'}</div>
                                <div><strong>Reprezentant Legal:</strong> {agentProfile?.companyRepresentative || agentProfile?.fullName || 'Nespecificat'}</div>
                                <div><strong>CUI / CIF:</strong> {agentProfile?.companyCui || 'Nespecificat'}</div>
                                <div><strong>Reg. Comerțului:</strong> {agentProfile?.companyRegCom || 'Nespecificat'}</div>
                                <div className="sm:col-span-2"><strong>Sediu Social:</strong> {agentProfile?.companyAddress || 'Nespecificat'}</div>
                                <div><strong>Telefon:</strong> {agentProfile?.phone}</div>
                                <div><strong>Email:</strong> {agentProfile?.email}</div>
                            </div>
                        </div>

                        {/* Party B: Client/Lead */}
                        <div className="party-info bg-slate-950 p-5 rounded-2xl border border-slate-855 space-y-4 print:bg-slate-50 print:border-slate-200">
                            <div className="flex justify-between items-center">
                                <h4 className="font-bold text-white print:text-slate-900 text-xs uppercase tracking-wider text-orange-500">
                                    BENEFICIAR (Client / Cumpărător / Chiriaș)
                                </h4>
                                {!is_locked && (
                                    <span className="text-[10px] bg-orange-600/10 text-orange-500 font-bold px-2 py-0.5 rounded border border-orange-500/20 no-print flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" /> Date Editabile
                                    </span>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                <div>
                                    <strong className="block text-slate-400 mb-1">Nume Complet Client:</strong>
                                    <span className="text-sm font-bold text-white print:text-slate-900">{clientProfile?.name}</span>
                                </div>
                                <div>
                                    <strong className="block text-slate-400 mb-1">Telefon contact:</strong>
                                    <span>{clientProfile?.phone || 'Fără telefon'}</span>
                                </div>
                                <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-850/50 print:border-slate-200">
                                    {/* Document Type Dropdown */}
                                    <div className="space-y-1">
                                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tip Document Identitate:</span>
                                        {is_locked ? (
                                            <span className="text-sm font-bold text-white print:text-slate-900">{clientIdType}</span>
                                        ) : (
                                            <select
                                                value={clientIdType}
                                                onChange={(e) => setClientIdType(e.target.value)}
                                                className="w-full bg-slate-900 border border-slate-850 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500 print:border-none print:bg-transparent print:p-0 print:font-bold print:text-slate-900"
                                            >
                                                <option value="C.I.">C.I. (Carte Identitate)</option>
                                                <option value="Pasaport">Pașaport</option>
                                                <option value="NIF">NIF</option>
                                                <option value="Altele">Altele</option>
                                            </select>
                                        )}
                                    </div>
                                    {/* Series/Number Input */}
                                    <div className="space-y-1">
                                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Serie și Nr. Buletin:</span>
                                        {is_locked ? (
                                            <span className="text-sm font-bold text-white print:text-slate-900">{clientIdSeries}</span>
                                        ) : (
                                            <input
                                                type="text"
                                                required
                                                value={clientIdSeries}
                                                onChange={(e) => setClientIdSeries(e.target.value.toUpperCase())}
                                                placeholder="Ex: AX 123456"
                                                className="w-full bg-slate-900 border border-slate-850 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500 print:border-none print:bg-transparent print:p-0 print:font-bold print:text-slate-900"
                                            />
                                        )}
                                    </div>
                                    {/* CNP Input */}
                                    <div className="space-y-1">
                                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">CNP (13 cifre):</span>
                                        {is_locked ? (
                                            <span className="text-sm font-bold text-white print:text-slate-900">{clientCnp}</span>
                                        ) : (
                                            <input
                                                type="text"
                                                required
                                                value={clientCnp}
                                                onChange={(e) => setClientCnp(e.target.value.replace(/\D/g, '').substring(0, 13))}
                                                placeholder="Ex: 1901234567890"
                                                className="w-full bg-slate-900 border border-slate-850 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500 print:border-none print:bg-transparent print:p-0 print:font-bold print:text-slate-900"
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Object Section */}
                    <div className="space-y-3">
                        <h3 className="font-extrabold text-white print:text-slate-900 text-base border-l-4 border-orange-500 pl-2">
                            2. OBIECTUL CONTRACTULUI
                        </h3>
                        <p className="text-justify text-xs text-slate-300 print:text-slate-700 leading-normal">
                            2.1. Obiectul prezentului contract îl reprezintă prezentarea de către Prestator Beneficiarului a proprietății imobiliare menționate mai jos, în vederea cumpărării sau închirierii acesteia. Prestatorul intermediază legătura dintre Beneficiar și proprietarul imobilului, asigurând consilierea și asistența tehnică/juridică pe parcursul tranzacției.
                        </p>
                        
                        {/* Selected Property details */}
                        <div className="party-info bg-slate-950 p-4 rounded-xl border border-slate-850 print:bg-slate-50 print:border-slate-200 text-xs">
                            <div className="font-bold text-white print:text-slate-900 mb-1">Identificare Imobil Prezentat:</div>
                            <div><strong>ID Proprietate:</strong> {displayPropertyId}</div>
                            <div><strong>Denumire/Titlu:</strong> {property?.title || 'Proprietate înregistrată'}</div>
                            <div><strong>Adresă proprietate:</strong> {property?.address || 'Nespecificată'}</div>
                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-850/50 print:border-slate-200">
                                <span><strong>Preț promovare proprietate:</strong></span>
                                <span className="font-black text-sm text-white print:text-slate-900">{formatEUR(property_price)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Commissions Section */}
                    <div className="space-y-3">
                        <h3 className="font-extrabold text-white print:text-slate-900 text-base border-l-4 border-orange-500 pl-2">
                            3. COMISIOANE ȘI MODALITATE DE PLATĂ
                        </h3>
                        <p className="text-justify text-xs text-slate-300 print:text-slate-700 leading-normal">
                            3.1. În cazul în care Beneficiarul sau o persoană fizică/juridică interpusă (rude, afiliați, asociați) încheie o tranzacție de cumpărare sau închiriere cu privire la imobilul prezentat la pct. 2, Beneficiarul se obligă să achite Prestatorului un comision negociat conform parametrilor de mai jos:
                        </p>
                        
                        <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl print:bg-slate-50 print:border-slate-200 grid grid-cols-2 gap-4 text-xs">
                            <div>
                                <strong className="text-slate-400 block">Comision Cumpărare Negociat:</strong>
                                <span className="text-sm font-bold text-white print:text-slate-900">
                                    {negotiated_commission_type === 'percent' ? `${negotiated_commission_buy}% din valoarea tranzacției` : formatEUR(negotiated_commission_buy)}
                                </span>
                            </div>
                            <div>
                                <strong className="text-slate-400 block">Comision Închiriere Negociat:</strong>
                                <span className="text-sm font-bold text-white print:text-slate-900">
                                    {negotiated_commission_type === 'percent' ? `${negotiated_commission_rent}% din chiria pe o lună` : formatEUR(negotiated_commission_rent)}
                                </span>
                            </div>
                            {calculated_commission > 0 && (
                                <div className="col-span-2 pt-2 border-t border-slate-850/50 print:border-slate-200 flex justify-between items-center">
                                    <strong className="text-orange-500">Valoare Estimată Comision (la prețul de listă):</strong>
                                    <span className="font-black text-sm text-orange-500 print:text-slate-900">{formatEUR(calculated_commission)}</span>
                                </div>
                            )}
                        </div>
                        <p className="text-justify text-xs text-slate-350 print:text-slate-700 leading-normal">
                            3.2. Comisionul devine scadent și plătibil integral la data semnării contractului de vânzare-cumpărare (inclusiv a antecontractului / promisiunii de vânzare) sau a contractului de închiriere. Neplata comisionului la scadență atrage penalități de întârziere de 0,5% pe zi de întârziere din valoarea debitului.
                        </p>
                    </div>

                    {/* Rights & Broker Protection Section */}
                    <div className="space-y-2">
                        <h3 className="font-extrabold text-white print:text-slate-900 text-base border-l-4 border-orange-500 pl-2">
                            4. PROTECȚIA PRESTATORULUI ȘI OBLIGAȚII CLIENT
                        </h3>
                        <p className="text-justify text-xs text-slate-300 print:text-slate-700 leading-normal">
                            4.1. Beneficiarul se obligă să nu contacteze direct proprietarul imobilului prezentat și să nu divulge nicio informație despre imobil (adresă, proprietar, număr de telefon) către terțe persoane fără acordul scris prealabil al Prestatorului.
                        </p>
                        <p className="text-justify text-xs text-slate-300 print:text-slate-700 leading-normal">
                            4.2. **Clauză penală:** În cazul în care Beneficiarul achiziționează/închiriază imobilul prezentat, direct sau prin interpuși, ocolind Prestatorul pentru a evita plata comisionului, Beneficiarul va datora Prestatorului cu titlu de daune interese o sumă egală cu dublul comisionului negociat în prezentul contract, calculate la valoarea tranzacției realizate sau la prețul de listă.
                        </p>
                    </div>

                    {/* GDPR Section */}
                    <div className="space-y-2">
                        <h3 className="font-extrabold text-white print:text-slate-900 text-base border-l-4 border-orange-500 pl-2">
                            5. GDPR (PROTECȚIA DATELOR CU CARACTER PERSONAL)
                        </h3>
                        <p className="text-justify text-xs text-slate-300 print:text-slate-700 leading-normal">
                            5.1. Prelucrarea datelor cu caracter personal (Nume, Prenume, C.N.P., Serie/Nr. act de identitate) se face exclusiv în baza Regulamentului (UE) 2016/679 (GDPR), în scopul executării contractului de vizionare, confirmării prezenței la vizionare, emiterii de facturi fiscale și dovedirii prestării serviciilor în instanță în caz de litigiu. Datele vor fi stocate în siguranță conform termenelor de arhivare legală. Semnarea documentului reprezintă acceptul liber exprimat pentru prelucrare.
                        </p>
                    </div>

                    {/* Signatures Section */}
                    <div className="space-y-4 pt-6 border-t border-slate-800 print:border-slate-200">
                        <h3 className="font-extrabold text-white print:text-slate-900 text-base border-l-4 border-orange-500 pl-2">
                            6. SEMNĂTURILE PĂRȚILOR
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
                            {/* Agent Signature */}
                            <div className="flex flex-col items-center">
                                <SignaturePad
                                    id="agent"
                                    label={`PRESTATOR: ${agentProfile?.companyRepresentative || agentProfile?.fullName || 'Broker'}`}
                                    clearLabel="Șterge"
                                    savedSignature={contractData.agent_signature}
                                    onSave={handleSaveAgentSignature}
                                    isLocked={is_locked}
                                />
                            </div>

                            {/* Client Signature */}
                            <div className="flex flex-col items-center">
                                <SignaturePad
                                    id="client"
                                    label={`BENEFICIAR (CLIENT): ${clientProfile?.name || 'Client'}`}
                                    clearLabel="Șterge"
                                    savedSignature={contractData.client_signature}
                                    onSave={handleSaveClientSignature}
                                    isLocked={is_locked}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer Warning */}
                    <div className="pt-6 border-t border-slate-855 text-[10px] text-slate-500 text-center uppercase tracking-wider print:border-slate-200 print:text-slate-400">
                        Document semnat electronic prin intermediul platformei Real Estate MLS. Protejat de Legea română privind GDPR și Dreptul comercial.
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function PresentationContractPreviewPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
        }>
            <PresentationContractContent />
        </Suspense>
    );
}
