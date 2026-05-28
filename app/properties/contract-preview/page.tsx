'use client';

import React, { useRef, useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Printer, Share2, Globe, Trash2, Check, FileText } from 'lucide-react';

interface SignaturePadProps {
    id: string;
    label: string;
    clearLabel: string;
}

function SignaturePad({ id, label, clearLabel }: SignaturePadProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSigned, setHasSigned] = useState(false);

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
        
        const x = ((clientX - rect.left) / rect.width) * canvas.width;
        const y = ((clientY - rect.top) / rect.height) * canvas.height;
        
        return { x, y };
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if ('touches' in e) {
            // Do not prevent default for vertical scroll if not drawing, but here we want touch-none behavior
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
    };

    const resizeCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        
        // Save current canvas content before resize
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
            tempCtx.drawImage(canvas, 0, 0);
        }

        canvas.width = rect.width * 2;
        canvas.height = rect.height * 2;
        
        ctx.scale(2, 2);
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#0f172a'; // Deep slate ink

        // Restore content
        if (tempCtx && hasSigned) {
            ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width / 2, tempCanvas.height / 2);
        }
    };

    useEffect(() => {
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        return () => window.removeEventListener('resize', resizeCanvas);
    }, [hasSigned]);

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
                        Semnați aici / Sign here
                    </div>
                )}
            </div>
            <div className="flex justify-between items-center w-full mt-2 no-print">
                <span className="text-[11px] text-slate-500 italic">{label}</span>
                <button
                    type="button"
                    onClick={clearCanvas}
                    className="text-[11px] font-semibold text-rose-500 hover:text-rose-700 transition-colors flex items-center gap-1"
                >
                    <Trash2 className="w-3 h-3" />
                    {clearLabel}
                </button>
            </div>
        </div>
    );
}

function ContractPreviewContent() {
    const searchParams = useSearchParams();
    const [contractData, setContractData] = useState<any>(null);
    const [lang, setLang] = useState<'ro' | 'en'>('ro');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const rawData = searchParams.get('data');
        if (rawData) {
            try {
                const decodedStr = decodeURIComponent(escape(atob(rawData)));
                const parsed = JSON.parse(decodedStr);
                setContractData(parsed);
                if (parsed.lang) {
                    setLang(parsed.lang);
                }
            } catch (e) {
                console.error('Failed to decode contract data:', e);
            }
        }
    }, [searchParams]);

    if (!contractData) {
        return (
            <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-4"></div>
                <p className="text-lg font-medium text-slate-300">
                    Se încarcă detaliile contractului... / Loading contract details...
                </p>
                <p className="text-sm text-slate-500 mt-2">
                    Te rugăm să te asiguri că linkul accesat este complet.
                </p>
            </div>
        );
    }

    const { agentProfile, formData, contractSerial, contractNumber, dateStr, timeStr } = contractData;
    const isRo = lang === 'ro';

    const handlePrint = () => {
        window.print();
    };

    const handleShare = () => {
        try {
            navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy link:', err);
        }
    };

    // Bilingual translations dictionary
    const t = {
        title: isRo ? 'Contract de Colaborare Imobiliară' : 'Real Estate Collaboration Contract',
        series: isRo ? 'Seria' : 'Series',
        nr: isRo ? 'Nr' : 'No',
        date: isRo ? 'Data' : 'Date',
        hour: isRo ? 'Ora' : 'Time',
        
        partiesTitle: isRo ? '1. Părțile Contractante' : '1. Contracting Parties',
        providerTitle: isRo ? 'PRESTATORUL (Broker / Agenție)' : 'THE PROVIDER (Broker / Agency)',
        providerCompany: isRo ? 'Denumire Societate (Firma):' : 'Company Name (Firm):',
        providerCui: isRo ? 'CUI / CIF:' : 'Tax ID / VAT registration no:',
        providerRegCom: isRo ? 'Nr. Reg. Comerțului:' : 'Trade Register no:',
        providerAddress: isRo ? 'Sediul Social:' : 'Registered Office Address:',
        providerRep: isRo ? 'Reprezentat legal prin:' : 'Represented legally by:',
        
        beneficiaryTitle: isRo ? 'BENEFICIARUL (Proprietar / Client)' : 'THE BENEFICIARY (Owner / Client)',
        beneficiaryName: isRo ? 'Nume complet:' : 'Full Name:',
        beneficiaryPhone: isRo ? 'Telefon contact:' : 'Contact Phone:',
        beneficiaryOwnerId: isRo ? 'Serie și Nr. CI (Proprietar):' : 'ID Series and No. (Owner):',
        beneficiaryOwnerCnp: isRo ? 'CNP (Proprietar):' : 'Personal Identification No. / CNP:',
        
        objectTitle: isRo ? '2. Obiectul Contractului' : '2. Object of the Contract',
        objectDesc: isRo 
            ? 'Obiectul prezentului contract îl reprezintă colaborarea dintre Prestator și Beneficiar în scopul promovării, intermedierii și facilitării tranzacționării (vânzare/închiriere) a dreptului de proprietate asupra bunului imobil identificat după cum urmează:'
            : 'The object of this contract is the collaboration between the Provider and the Beneficiary for the purpose of marketing, promoting, and facilitating the transaction (sale/lease) of the property rights of the real estate asset identified below:',
        
        imobilTitle: isRo ? 'Identificare Imobil' : 'Property Identification',
        propTitle: isRo ? 'Titlu Proprietate:' : 'Property Title:',
        propAddress: isRo ? 'Adresă exactă (locație contract):' : 'Exact Address (Contract Location):',
        propCfTopo: isRo ? 'Carte Funciară / Topo (CF/NR. Topo):' : 'Land Registry / Topographic no (CF/No. Topo):',
        propPrice: isRo ? 'Preț Promovare Solicitat:' : 'Requested Listing Price:',
        
        servicesTitle: isRo ? '3. Servicii și Comisioane' : '3. Services and Commissions',
        servicesDesc1: isRo
            ? '3.1. Serviciile specifice pe care le va presta Prestatorul pentru Beneficiar, precum și valoarea și structura comisionului datorat de Beneficiar pentru aceste servicii sunt stabilite în totalitate și în exclusivitate în conformitate cu prevederile detaliate în <strong>Anexa 1</strong> la prezentul contract, care face parte integrantă din acesta.'
            : '3.1. The specific services to be performed by the Provider for the Beneficiary, as well as the value and structure of the commission owed by the Beneficiary for these services, are established entirely and exclusively in accordance with the provisions detailed in <strong>Annex 1</strong> to this contract, which forms an integral part thereof.',
        servicesDesc2: isRo
            ? '3.2. Beneficiarul se obligă să achite comisionul stabilit în conformitate cu condițiile, termenele și modalitățile de plată stipulate în <strong>Anexa 1</strong>.'
            : '3.2. The Beneficiary undertakes to pay the established commission in accordance with the conditions, deadlines and payment methods stipulated in <strong>Annex 1</strong>.',
        
        rightsProviderTitle: isRo ? '4. Drepturile și Obligațiile Prestatorului' : '4. Rights and Obligations of the Provider',
        rightsProvider1: isRo
            ? '4.1. Prestatorul are dreptul de a promova imobilul în mediul online și offline prin canale proprii sau prin rețeaua MLS (Multiple Listing Service).'
            : '4.1. The Provider has the right to promote the property in online and offline media through their own channels or through the MLS (Multiple Listing Service) network.',
        rightsProvider2: isRo
            ? '4.2. Prestatorul se obligă să depună toate diligențele profesionale necesare pentru identificarea potențialilor clienți cumpărători/chiriași și să asigure asistența de specialitate pe tot parcursul negocierilor și finalizării tranzacției.'
            : '4.2. The Provider undertakes to use all professional diligence necessary to identify potential buyers/tenants and to provide professional assistance throughout the negotiations and finalization of the transaction.',
        
        rightsBeneficiaryTitle: isRo ? '5. Drepturile și Obligațiile Beneficiarului' : '5. Rights and Obligations of the Beneficiary',
        rightsBeneficiary1: isRo
            ? '5.1. Beneficiarul garantează că deține drepturile legale de a tranzacționa imobilul descris mai sus și că toate datele furnizate sunt reale și corecte.'
            : '5.1. The Beneficiary guarantees that they hold the legal rights to transact the property described above and that all data provided is true and correct.',
        rightsBeneficiary2: isRo
            ? '5.2. Beneficiarul se obligă să asigure accesul Prestatorului și al potențialilor clienți pentru vizionarea imobilului și să informeze Prestatorul cu privire la orice schimbări apărute.'
            : '5.2. The Beneficiary undertakes to ensure access to the Provider and potential clients for property viewings and to inform the Provider of any changes.',
        
        termTitle: isRo ? '6. Durata Contractului' : '6. Contract Term',
        termDesc1: isRo
            ? '6.1. Prezentul contract se încheie pe o perioadă de 1 (un) an, intrând în vigoare la data semnării acestuia de către ambele părți.'
            : '6.1. This contract is concluded for a period of 1 (one) year, entering into force on the date of its signing by both parties.',
        termDesc2: isRo
            ? '6.2. Contractul se prelungește în mod automat pentru perioade succesive de câte 1 (un) an, cu excepția cazului în care una dintre părți notifică cealaltă parte în scris cu cel puțin 30 de zile înainte de expirarea termenului curent cu privire la intenția sa de a nu prelungi contractul.'
            : '6.2. The contract is automatically prolonged for successive periods of 1 (one) year each, unless one of the parties notifies the other party in writing at least 30 days prior to the expiration of the current term of its intention not to renew the contract.',
        termDesc3: isRo
            ? '6.3. Prin excepție de la prevederile pct. 6.1 și 6.2, în situația în care "Anexa 1" la prezentul contract specifică caracterul de "Exclusivitate" al colaborării, durata contractului va fi cea stabilită în mod expres în Anexa 1.'
            : '6.3. By exception to the provisions of clauses 6.1 and 6.2, in the event that "Annex 1" to this contract specifies the "Exclusivity" of the collaboration, the duration of the contract shall be the one expressly established in Annex 1.',

        forceTitle: isRo ? '7. Forța Majoră și Litigii' : '7. Force Majeure and Disputes',
        force1: isRo
            ? '7.1. Părțile sunt exonerate de răspundere în caz de forță majoră, constatată conform legii.'
            : '7.1. The parties are exonerated from liability in case of force majeure, established by law.',
        force2: isRo
            ? '7.2. Litigiile izvorâte din interpretarea sau executarea prezentului contract se vor rezolva pe cale amiabilă, iar în caz contrar vor fi deferite instanțelor judecătorești competente de la sediul Prestatorului.'
            : '7.2. Disputes arising from the interpretation or execution of this contract shall be settled amicably, otherwise they shall be referred to the competent courts of law at the Provider\'s headquarters.',
        
        gdprTitle: isRo ? '8. Protecția Datelor cu Caracter Personal (GDPR)' : '8. Personal Data Protection (GDPR)',
        gdprDesc1: isRo
            ? '8.1. Părțile se obligă să respecte prevederile Regulamentului (UE) 2016/679 (GDPR) privind protecția persoanelor fizice în ceea ce privește prelucrarea datelor cu caracter personal.'
            : '8.1. The parties undertake to comply with the provisions of Regulation (EU) 2016/679 (GDPR) on the protection of natural persons with regard to the processing of personal data.',
        gdprDesc2: isRo
            ? '8.2. Datele cu caracter personal colectate în baza prezentului contract (nume, prenume, telefon, adresă, serie și număr act identitate, CNP, date de identificare imobil) sunt prelucrate exclusiv în scopul executării prezentului contract și a obligațiilor legale corelative (fiscale, contabile etc.).'
            : '8.2. Personal data collected under this contract (first and last name, phone number, address, identity document series and number, CNP, property identification details) are processed exclusively for the purpose of executing this contract and related legal obligations (tax, accounting, etc.).',
        gdprDesc3: isRo
            ? '8.3. Datele vor fi stocate pe perioada derulării contractului și ulterior conform obligațiilor de arhivare legală. Beneficiarul are dreptul de acces, rectificare, ștergere, restricționare a prelucrării și portabilitate a datelor, precum și dreptul de a depune plângere la ANSPDCP.'
            : '8.3. The data will be stored for the duration of the contract and subsequently in accordance with legal archiving obligations. The Beneficiary has the right of access, rectification, erasure, restriction of processing, data portability, and the right to lodge a complaint with the ANSPDCP.',

        signProvider: isRo ? 'PRESTATOR' : 'PROVIDER',
        signBeneficiary: isRo ? 'BENEFICIAR' : 'BENEFICIARY',
        signLineProvider: isRo ? 'Semnătura și Ștampila' : 'Signature and Stamp',
        signLineBeneficiary: isRo ? 'Semnătura' : 'Signature',
        clearBtn: isRo ? 'Șterge semnătura' : 'Clear signature',
        footerText: isRo
            ? 'Document generat automat prin intermediul platformei Real Estate MLS. Toate drepturile rezervate.'
            : 'Document generated automatically via the Real Estate MLS platform. All rights reserved.'
    };

    // Address formatting helper
    const formattedAddress = [
        formData.contractCountry ? (isRo ? `Țara: ${formData.contractCountry}` : `Country: ${formData.contractCountry}`) : '',
        formData.contractCity ? (isRo ? `Oraș: ${formData.contractCity}` : `City: ${formData.contractCity}`) : '',
        formData.contractStreet ? (isRo ? `Strada: ${formData.contractStreet}` : `Street: ${formData.contractStreet}`) : '',
        formData.contractBuilding ? (isRo ? `Nr: ${formData.contractBuilding}` : `No: ${formData.contractBuilding}`) : '',
        formData.contractFloor ? (isRo ? `Et: ${formData.contractFloor}` : `Floor: ${formData.contractFloor}`) : '',
        formData.contractApartment ? (isRo ? `Ap: ${formData.contractApartment}` : `Apt: ${formData.contractApartment}`) : ''
    ].filter(Boolean).join(', ');

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col print:bg-white print:text-slate-900 pb-12">
            {/* Custom print styles to override Tailwind background details on page print */}
            <style jsx global>{`
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
                    .details-grid {
                        display: grid !important;
                        grid-template-cols: 1fr 1fr !important;
                        gap: 8px 16px !important;
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
                                {isRo ? 'PREVIZUALIZARE CONTRACT' : 'CONTRACT PREVIEW'}
                            </h1>
                            <p className="text-[11px] text-slate-400">
                                {contractSerial} / {contractNumber}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Language Switcher */}
                        <button
                            type="button"
                            onClick={() => setLang(lang === 'ro' ? 'en' : 'ro')}
                            className="p-2 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl flex items-center gap-2 text-xs font-semibold transition-all"
                            title={isRo ? 'Switch to English' : 'Comută în Română'}
                        >
                            <Globe className="w-4 h-4 text-slate-400" />
                            <span>{isRo ? 'English (EN)' : 'Română (RO)'}</span>
                        </button>

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
                                    <span>{isRo ? 'Copiat!' : 'Copied!'}</span>
                                </>
                            ) : (
                                <>
                                    <Share2 className="w-4 h-4" />
                                    <span>{isRo ? 'Copiază link' : 'Copy link'}</span>
                                </>
                            )}
                        </button>

                        {/* Print / Save PDF Button */}
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="p-2 px-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl flex items-center gap-2 text-xs font-bold transition-all shadow-md shadow-orange-500/10 border border-orange-500/20 active:scale-[0.98]"
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
                    {/* Style override to support serif font inside sheet */}
                    <div className="font-sans text-[13px] text-justify text-slate-800">
                        {/* Header metadata */}
                        <div className="text-center mb-8 border-b-2 double border-slate-200 pb-6">
                            <h2 className="font-serif text-xl sm:text-2xl font-bold uppercase tracking-wider text-slate-900 mb-2">
                                {t.title}
                            </h2>
                            <div className="flex justify-between text-xs text-slate-500 font-mono mt-4">
                                <span>{t.series}: <strong className="text-slate-800">{contractSerial}</strong> / {t.nr}: <strong className="text-slate-800">{contractNumber}</strong></span>
                                <span>{t.date}: <strong className="text-slate-800">{dateStr}</strong> | {t.hour}: <strong className="text-slate-800">{timeStr}</strong></span>
                            </div>
                        </div>

                        {/* 1. Contracting Parties */}
                        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-1 mt-6 mb-3 uppercase tracking-wide">
                            {t.partiesTitle}
                        </h3>

                        {/* Provider */}
                        <div className="party-info bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
                            <div className="text-xs font-bold text-slate-800 border-b border-dashed border-slate-200 pb-1 mb-3 uppercase tracking-wide">
                                {t.providerTitle}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div>
                                    <span className="block text-[10px] uppercase font-bold text-slate-400">{t.providerCompany}</span>
                                    <span className="font-semibold text-slate-900">{agentProfile?.company_name || '................................................'}</span>
                                </div>
                                <div>
                                    <span className="block text-[10px] uppercase font-bold text-slate-400">{t.providerCui}</span>
                                    <span className="font-semibold text-slate-900">{agentProfile?.company_cui || '................................................'}</span>
                                </div>
                                <div>
                                    <span className="block text-[10px] uppercase font-bold text-slate-400">{t.providerRegCom}</span>
                                    <span className="font-semibold text-slate-900">{agentProfile?.company_reg_com || '................................................'}</span>
                                </div>
                                <div>
                                    <span className="block text-[10px] uppercase font-bold text-slate-400">{t.providerAddress}</span>
                                    <span className="font-semibold text-slate-900">{agentProfile?.company_address || '................................................'}</span>
                                </div>
                                <div className="sm:col-span-2">
                                    <span className="block text-[10px] uppercase font-bold text-slate-400">{t.providerRep}</span>
                                    <span className="font-semibold text-slate-900">{agentProfile?.full_name || '................................................'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Beneficiary */}
                        <div className="party-info bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
                            <div className="text-xs font-bold text-slate-800 border-b border-dashed border-slate-200 pb-1 mb-3 uppercase tracking-wide">
                                {t.beneficiaryTitle}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div className="sm:col-span-2">
                                    <span className="block text-[10px] uppercase font-bold text-slate-400">{t.beneficiaryName}</span>
                                    <span className="font-semibold text-slate-900">{formData.ownerName || '................................................'}</span>
                                </div>
                                <div>
                                    <span className="block text-[10px] uppercase font-bold text-slate-400">{t.beneficiaryPhone}</span>
                                    <span className="font-semibold text-slate-900">{formData.ownerPhone || '................................................'}</span>
                                </div>
                                <div>
                                    <span className="block text-[10px] uppercase font-bold text-slate-400">{t.beneficiaryOwnerId}</span>
                                    <span className="font-semibold text-slate-900">{formData.contractOwnerId || '................................................'}</span>
                                </div>
                                <div className="sm:col-span-2">
                                    <span className="block text-[10px] uppercase font-bold text-slate-400">{t.beneficiaryOwnerCnp}</span>
                                    <span className="font-semibold text-slate-900">{formData.contractOwnerCnp || '................................................'}</span>
                                </div>
                            </div>
                        </div>

                        {/* 2. Object of the Contract */}
                        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-1 mt-6 mb-3 uppercase tracking-wide">
                            {t.objectTitle}
                        </h3>
                        <p className="mb-4 text-justify">{t.objectDesc}</p>

                        <div className="party-info bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
                            <div className="text-xs font-bold text-slate-800 border-b border-dashed border-slate-200 pb-1 mb-3 uppercase tracking-wide">
                                {t.imobilTitle}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div className="sm:col-span-2">
                                    <span className="block text-[10px] uppercase font-bold text-slate-400">{t.propTitle}</span>
                                    <span className="font-semibold text-slate-900">{formData.title || '................................................'}</span>
                                </div>
                                <div className="sm:col-span-2">
                                    <span className="block text-[10px] uppercase font-bold text-slate-400">{t.propAddress}</span>
                                    <span className="font-semibold text-slate-900">{formattedAddress || '................................................'}</span>
                                </div>
                                <div>
                                    <span className="block text-[10px] uppercase font-bold text-slate-400">{t.propCfTopo}</span>
                                    <span className="font-semibold text-slate-900">{formData.contractCfTopo || '................................................'}</span>
                                </div>
                                <div>
                                    <span className="block text-[10px] uppercase font-bold text-slate-400">{t.propPrice}</span>
                                    <span className="font-semibold text-slate-900">
                                        {formData.price ? `${formData.price} ${formData.currency}` : '................................................'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 3. Services and Commissions */}
                        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-1 mt-6 mb-3 uppercase tracking-wide">
                            {t.servicesTitle}
                        </h3>
                        <p className="mb-3 text-justify" dangerouslySetInnerHTML={{ __html: t.servicesDesc1 }} />
                        <p className="mb-4 text-justify" dangerouslySetInnerHTML={{ __html: t.servicesDesc2 }} />

                        {/* 4. Rights and Obligations of the Provider */}
                        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-1 mt-6 mb-3 uppercase tracking-wide">
                            {t.rightsProviderTitle}
                        </h3>
                        <p className="mb-3 text-justify">{t.rightsProvider1}</p>
                        <p className="mb-4 text-justify">{t.rightsProvider2}</p>

                        {/* 5. Rights and Obligations of the Beneficiary */}
                        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-1 mt-6 mb-3 uppercase tracking-wide">
                            {t.rightsBeneficiaryTitle}
                        </h3>
                        <p className="mb-3 text-justify">{t.rightsBeneficiary1}</p>
                        <p className="mb-4 text-justify">{t.rightsBeneficiary2}</p>

                        {/* 6. Contract Term (Durata Contractului) */}
                        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-1 mt-6 mb-3 uppercase tracking-wide">
                            {t.termTitle}
                        </h3>
                        <p className="mb-2 text-justify">{t.termDesc1}</p>
                        <p className="mb-2 text-justify">{t.termDesc2}</p>
                        <p className="mb-4 text-justify">{t.termDesc3}</p>

                        {/* 7. Force Majeure and Disputes */}
                        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-1 mt-6 mb-3 uppercase tracking-wide">
                            {t.forceTitle}
                        </h3>
                        <p className="mb-2 text-justify">{t.force1}</p>
                        <p className="mb-4 text-justify">{t.force2}</p>

                        {/* 8. GDPR compliance terms */}
                        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-1 mt-6 mb-3 uppercase tracking-wide">
                            {t.gdprTitle}
                        </h3>
                        <p className="mb-2 text-justify">{t.gdprDesc1}</p>
                        <p className="mb-2 text-justify">{t.gdprDesc2}</p>
                        <p className="mb-6 text-justify">{t.gdprDesc3}</p>

                        {/* Signatures and interactive drawing canvas */}
                        <div className="grid grid-cols-2 gap-8 sm:gap-16 mt-12 pt-6 border-t border-slate-200 page-break-inside-avoid">
                            <div className="flex flex-col items-center">
                                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                                    {t.signProvider}
                                </div>
                                <div className="text-xs text-slate-600 font-semibold mb-4 text-center max-w-full truncate">
                                    {agentProfile?.company_name || '................................................'}
                                </div>
                                <SignaturePad 
                                    id="provider-signature" 
                                    label={t.signLineProvider} 
                                    clearLabel={t.clearBtn} 
                                />
                            </div>

                            <div className="flex flex-col items-center">
                                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                                    {t.signBeneficiary}
                                </div>
                                <div className="text-xs text-slate-600 font-semibold mb-4 text-center max-w-full truncate">
                                    {formData.ownerName || '................................................'}
                                </div>
                                <SignaturePad 
                                    id="beneficiary-signature" 
                                    label={t.signLineBeneficiary} 
                                    clearLabel={t.clearBtn} 
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

export default function ContractPreviewPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-4"></div>
                <span className="text-lg font-medium text-slate-300">Se încarcă contractul... / Loading contract...</span>
            </div>
        }>
            <ContractPreviewContent />
        </Suspense>
    );
}
