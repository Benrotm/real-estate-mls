'use client';

import React, { useRef, useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Printer, Share2, Globe, Trash2, Check, FileText, Save, Sparkles, Lock, Unlock } from 'lucide-react';
import { getCollaborationContract, updateCollaborationSignatures, lockCollaborationContract, updateAnexaSignatures } from '@/app/lib/actions/collaboration-contracts';
import { supabase } from '@/app/lib/supabase/client';

interface SignaturePadProps {
    id: string;
    label: string;
    clearLabel: string;
    savedSignature?: string;
    onSave?: (dataUrl: string) => Promise<void>;
    isRo: boolean;
    isLocked?: boolean;
}

function SignaturePad({ id, label, clearLabel, savedSignature, onSave, isRo, isLocked }: SignaturePadProps) {
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
        
        // Use CSS coordinates directly, as the canvas context is scaled by 2
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
                {!hasSigned && !isLocked && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs italic">
                        {isRo ? 'Semnați aici' : 'Sign here'}
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
                )}
            </div>
        </div>
    );
}

function ContractPreviewContent() {
    const searchParams = useSearchParams();
    const [contractId, setContractId] = useState<string | null>(null);
    const [contractData, setContractData] = useState<any>(null);
    const [lang, setLang] = useState<'ro' | 'en'>('ro');
    const [copied, setCopied] = useState(false);
    const [canManage, setCanManage] = useState(false);

    const loadContract = async (id: string) => {
        const res = await getCollaborationContract(id);
        if (res.success && res.contract) {
            const contract = res.contract;
            setContractData({
                agentProfile: contract.agent_details,
                formData: contract.form_data,
                contractSerial: contract.contract_serial,
                contractNumber: contract.contract_number,
                dateStr: contract.form_data?.dateStr || new Date(contract.created_at).toLocaleDateString('ro-RO'),
                timeStr: contract.form_data?.timeStr || new Date(contract.created_at).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }),
                agent_signature: contract.agent_signature,
                owner_signature: contract.owner_signature,
                status: contract.status,
                propertyId: contract.property_id,
                personal_property_id: contract.personal_property_id,
                is_locked: contract.is_locked,
                agent_id: contract.agent_id,
                anexa_data: contract.anexa_data,
                anexa_agent_signature: contract.anexa_agent_signature,
                anexa_owner_signature: contract.anexa_owner_signature,
                anexa_status: contract.anexa_status
            });
            setContractId(id);
            if (contract.language) {
                setLang(contract.language);
            }
        }
    };

    useEffect(() => {
        const id = searchParams.get('id');
        const rawData = searchParams.get('data');
        
        if (id) {
            loadContract(id);
        } else if (rawData) {
            try {
                const decodedStr = decodeURIComponent(escape(atob(rawData)));
                const parsed = JSON.parse(decodedStr);
                setContractData({
                    ...parsed,
                    is_locked: parsed.is_locked || false
                });
                if (parsed.lang) {
                    setLang(parsed.lang);
                }
            } catch (e) {
                console.error('Failed to decode contract data:', e);
            }
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

    const formatEUR = (value: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
    };

    const formatPercent = (val: number) => {
        return `${val.toFixed(2).replace('.', ',')}%`;
    };

    const handleShare = async () => {
        const shareUrl = contractId 
            ? `${window.location.origin}/properties/contract-preview?id=${contractId}`
            : window.location.href;
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: isRo ? 'Contract de Colaborare Imobiliară' : 'Real Estate Collaboration Contract',
                    text: isRo ? 'Vizualizează contractul de colaborare imobiliară.' : 'View the real estate collaboration contract.',
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
        if (!window.confirm(isRo ? 'Sigur doriți să blocați acest contract? După blocare, semnăturile și detaliile nu mai pot fi modificate.' : 'Are you sure you want to lock this contract? Once locked, signatures and details can no longer be modified.')) {
            return;
        }
        const res = await lockCollaborationContract(contractId);
        if (res.success && res.contract) {
            setContractData((prev: any) => ({
                ...prev,
                is_locked: true
            }));
            alert(isRo ? 'Contractul a fost blocat cu succes!' : 'Contract locked successfully!');
        } else {
            alert(isRo ? 'Eroare la blocarea contractului.' : 'Error locking contract.');
        }
    };

    const handleSaveContract = () => {
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
            alert(isRo ? 'Semnăturile se salvează...' : 'Saving signatures...');
        } else {
            alert(isRo ? 'Contractul a fost salvat cu succes!' : 'Contract saved successfully!');
        }
    };

    const handleSaveAgentSignature = async (signatureDataUrl: string) => {
        if (!contractId) return;
        const res = await updateCollaborationSignatures(contractId, {
            agent_signature: signatureDataUrl
        });
        if (res.success && res.contract) {
            setContractData((prev: any) => ({
                ...prev,
                agent_signature: res.contract.agent_signature,
                status: res.contract.status
            }));
        } else {
            throw new Error(res.error || 'Failed to save signature');
        }
    };

    const handleSaveOwnerSignature = async (signatureDataUrl: string) => {
        if (!contractId) return;
        const res = await updateCollaborationSignatures(contractId, {
            owner_signature: signatureDataUrl
        });
        if (res.success && res.contract) {
            setContractData((prev: any) => ({
                ...prev,
                owner_signature: res.contract.owner_signature,
                status: res.contract.status
            }));
        } else {
            throw new Error(res.error || 'Failed to save signature');
        }
    };

    const handleSaveAnexaAgentSignature = async (signatureDataUrl: string) => {
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

    const handleSaveAnexaOwnerSignature = async (signatureDataUrl: string) => {
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
        clearBtn: isRo ? 'Șterge' : 'Clear',
        footerText: isRo
            ? 'Document generat automat prin intermediul platformei Real Estate MLS. Toate drepturile rezervate.'
            : 'Document generated automatically via the Real Estate MLS platform. All rights reserved.'
    };

    const tAnexa = {
        title: isRo ? 'ANEXA NR. 1' : 'ANNEX NO. 1',
        subtitle: isRo 
            ? `la Contractul de Colaborare Imobiliară Seria ${contractSerial} Nr. ${contractNumber}` 
            : `to the Real Estate Collaboration Contract Series ${contractSerial} No. ${contractNumber}`,
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
            <style jsx global>{`
                nav, footer {
                    display: none !important;
                }
                main {
                    padding-top: 0 !important;
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
                    .signatures-grid {
                        display: grid !important;
                        grid-template-cols: 1fr 1fr !important;
                        gap: 16px !important;
                    }
                    .page-break-before-always {
                        page-break-before: always !important;
                        break-before: page !important;
                        margin-top: 0 !important;
                        padding-top: 0 !important;
                        border: none !important;
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
                        {canManage && (
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
                                        <span>{isRo ? 'Partajează' : 'Share'}</span>
                                    </>
                                )}
                            </button>
                        )}

                        {/* Generate Anexa 1 button */}
                        {contractId && contractData.propertyId && (
                            <a
                                href={`/calculator-comisioane?property_id=${contractData.propertyId}`}
                                className="p-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl flex items-center gap-2 text-xs font-semibold transition-all shadow-md"
                            >
                                <Sparkles className="w-4 h-4 text-orange-500" />
                                <span>{isRo ? 'Generează Anexa 1' : 'Generate Annex 1'}</span>
                            </a>
                        )}

                        {/* Print Button */}
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="p-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl flex items-center gap-2 text-xs font-semibold transition-all shadow-md"
                        >
                            <Printer className="w-4 h-4" />
                            <span>{isRo ? 'Printează' : 'Print'}</span>
                        </button>

                        {/* Save Button */}
                        <button
                            type="button"
                            onClick={handleSaveContract}
                            className="p-2 px-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl flex items-center gap-2 text-xs font-bold transition-all shadow-md shadow-orange-500/10 border border-orange-500/20 active:scale-[0.98]"
                        >
                            <Save className="w-4 h-4" />
                            <span>{isRo ? 'Salvează' : 'Save'}</span>
                        </button>

                        {/* Lock Button / Status */}
                        {canManage && contractId && (
                            contractData.is_locked ? (
                                <span className="p-2 px-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl flex items-center gap-2 text-xs font-bold shadow-md">
                                    <Lock className="w-4 h-4 text-emerald-500" />
                                    <span>{isRo ? 'Blocat' : 'Locked'}</span>
                                </span>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleLockContract}
                                    className="p-2 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl flex items-center gap-2 text-xs font-bold transition-all shadow-md active:scale-[0.98] border border-rose-500/20"
                                >
                                    <Unlock className="w-4 h-4" />
                                    <span>{isRo ? 'Blochează' : 'Lock'}</span>
                                </button>
                            )
                        )}
                    </div>
                </div>
            </header>

            {/* Document body wrapper */}
            <main className="flex-1 flex justify-center items-start pt-8 px-4 sm:px-6">
                {/* Print Sheet */}
                <article className="print-sheet max-w-[800px] w-full bg-white text-slate-900 shadow-2xl rounded-2xl border border-slate-200 p-8 sm:p-12 md:p-16 leading-relaxed select-text font-serif">
                    <div className="font-sans text-[13px] text-justify text-slate-800">
                        {/* Header metadata */}
                        {(() => {
                            const displayPropertyId = contractData.personal_property_id || (contractData.propertyId ? 'P' + contractData.propertyId.substring(0, 5).toUpperCase() : '');
                            return (
                                <div className="text-center mb-8 border-b-2 double border-slate-200 pb-6">
                                    <h2 className="font-serif text-xl sm:text-2xl font-bold uppercase tracking-wider text-slate-900 mb-2">
                                        {t.title}
                                    </h2>
                                    <div className="flex justify-between text-xs text-slate-500 font-mono mt-4">
                                        <span>{t.series}: <strong className="text-slate-800">{contractSerial}</strong> / {t.nr}: <strong className="text-slate-800">{contractNumber}</strong></span>
                                        {displayPropertyId && (
                                            <span>ID Imobil: <strong className="text-slate-800">#{displayPropertyId}</strong></span>
                                        )}
                                        <span>{t.date}: <strong className="text-slate-800">{dateStr}</strong> | {t.hour}: <strong className="text-slate-800">{timeStr}</strong></span>
                                    </div>
                                </div>
                            );
                        })()}

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
                                    <span className="font-semibold text-slate-900">
                                        {(agentProfile?.is_company && agentProfile?.company_representative) 
                                            ? agentProfile.company_representative 
                                            : (agentProfile?.full_name || '................................................')}
                                    </span>
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
                                <div>
                                    <span className="block text-[10px] uppercase font-bold text-slate-400">ID PROPRIETATE / PROPERTY ID:</span>
                                    <span className="font-semibold text-slate-900">
                                        {(() => {
                                            const displayPropertyId = contractData.personal_property_id || (contractData.propertyId ? 'P' + contractData.propertyId.substring(0, 5).toUpperCase() : '');
                                            return displayPropertyId ? `#${displayPropertyId}` : '................................................';
                                        })()}
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
                        <div className="signatures-grid grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 mt-12 pt-6 border-t border-slate-200 page-break-inside-avoid">
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
                                    savedSignature={contractData.agent_signature}
                                    onSave={contractId ? handleSaveAgentSignature : undefined}
                                    isRo={isRo}
                                    isLocked={contractData.is_locked}
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
                                    savedSignature={contractData.owner_signature}
                                    onSave={contractId ? handleSaveOwnerSignature : undefined}
                                    isRo={isRo}
                                    isLocked={contractData.is_locked}
                                />
                            </div>
                        </div>

                        {/* Footer Section */}
                        <div className="text-center text-[10px] text-slate-400 mt-12 pt-4 border-t border-slate-100 page-break-inside-avoid">
                            {t.footerText}
                        </div>

                        {/* Annex 1 Section (Rendered only if contractData.anexa_data exists) */}
                        {contractData.anexa_data && (
                            <div className="page-break-before-always border-t-2 border-dashed border-slate-300 mt-12 pt-12 print:border-none">
                                {/* Hub Header Info */}
                                <div className="text-center mb-6 text-slate-500 font-sans border-b border-slate-100 pb-4">
                                    <p className="font-extrabold text-sm tracking-wide text-slate-700 uppercase">
                                        Real Estate Hub - <span className="text-orange-500">www.imobum.com</span>
                                    </p>
                                    <p className="text-[11px] italic font-medium mt-1 leading-relaxed max-w-md mx-auto text-slate-500">
                                        {isRo 
                                            ? 'Primul Hub de Imobiliare Românesc unde peste 200 de Brokeri Imobiliari lucrează în colaborare pentru tine.'
                                            : 'The first Romanian Real Estate Hub where over 200 Real Estate Brokers work in collaboration for you.'
                                        }
                                    </p>
                                </div>

                                {/* Annex Header */}
                                <div className="text-center mb-8 border-b-2 double border-slate-200 pb-6">
                                    <h2 className="font-serif text-xl sm:text-2xl font-bold uppercase tracking-wider text-slate-900 mb-2">
                                        {tAnexa.title}
                                    </h2>
                                    <p className="text-sm font-semibold text-slate-600 italic">
                                        {tAnexa.subtitle}
                                    </p>
                                </div>

                                {/* Property & Contract context */}
                                <div className="party-info bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                                        <div>
                                            <span className="block text-[10px] uppercase font-bold text-slate-400">{tAnexa.propertyTitle}</span>
                                            <span className="font-semibold text-slate-900">{contractData.anexa_data.propertyName || '................................................'}</span>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] uppercase font-bold text-slate-400">{tAnexa.propertyPrice}</span>
                                            <span className="font-extrabold text-slate-900">{formatEUR(contractData.anexa_data.propertyValue)}</span>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] uppercase font-bold text-slate-400">{tAnexa.commissionModel}</span>
                                            <span className="font-semibold text-slate-900">{contractData.anexa_data.activeModelName}</span>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] uppercase font-bold text-slate-400">{tAnexa.exclusivityType}</span>
                                            <span className="font-semibold text-slate-900">{contractData.anexa_data.exclusivityText}</span>
                                        </div>
                                        {(() => {
                                            const displayPropertyId = contractData.personal_property_id || (contractData.propertyId ? 'P' + contractData.propertyId.substring(0, 5).toUpperCase() : '');
                                            return displayPropertyId ? (
                                                <div>
                                                    <span className="block text-[10px] uppercase font-bold text-slate-400">{isRo ? 'ID PROPRIETATE:' : 'PROPERTY ID:'}</span>
                                                    <span className="font-semibold text-slate-900">#{displayPropertyId}</span>
                                                </div>
                                            ) : null;
                                        })()}
                                    </div>
                                </div>

                                {/* Services List Table */}
                                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-1 mt-6 mb-3 uppercase tracking-wide font-sans">
                                    {tAnexa.servicesTitle}
                                </h3>
                                <div className="overflow-x-auto mb-6">
                                    <table className="services-table w-full text-left text-xs border border-slate-200 font-sans">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200">
                                                <th className="p-3 font-bold text-slate-700 border-r border-slate-200">{tAnexa.serviceNameHeader}</th>
                                                <th className="p-3 font-bold text-slate-700 border-r border-slate-200">{tAnexa.serviceDescHeader}</th>
                                                <th className="p-3 font-bold text-slate-700 border-r border-slate-200">{tAnexa.servicePayHeader}</th>
                                                <th className="p-3 font-bold text-slate-700 text-right">{tAnexa.serviceCostHeader}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {contractData.anexa_data.selectedServices.map((s: any, idx: number) => (
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
                                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-1 mt-6 mb-3 uppercase tracking-wide font-sans">
                                    {tAnexa.commModelTitle}
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 font-sans">
                                    <div className="party-info bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-600">{tAnexa.sellerCommLabel}</span>
                                        <div className="text-right">
                                            <span className="block text-sm font-extrabold text-slate-900">{formatPercent(contractData.anexa_data.calculations.sellerPercent)}</span>
                                            <span className="text-[10px] text-slate-400">{formatEUR(contractData.anexa_data.calculations.sellerCommEUR)}</span>
                                        </div>
                                    </div>
                                    <div className="party-info bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-600">{tAnexa.buyerCommLabel}</span>
                                        <div className="text-right">
                                            <span className="block text-sm font-extrabold text-slate-900">{formatPercent(contractData.anexa_data.calculations.buyerPercent)}</span>
                                            <span className="text-[10px] text-slate-400">{formatEUR(contractData.anexa_data.calculations.buyerCommEUR)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Cost Recap Summary */}
                                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-1 mt-6 mb-3 uppercase tracking-wide font-sans">
                                    {tAnexa.calculationsTitle}
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 font-sans">
                                    <div className="party-info bg-emerald-50/30 border border-emerald-200 rounded-lg p-4">
                                        <span className="block text-[10px] uppercase font-bold text-emerald-600 mb-1">{tAnexa.totalFirstMonthLabel}</span>
                                        <span className="text-xl font-extrabold text-emerald-700">{formatEUR(contractData.anexa_data.calculations.totalServicesFirstMonthEUR)}</span>
                                        <span className="block text-[9.5px] text-slate-500 leading-relaxed mt-2">{tAnexa.totalFirstMonthDesc}</span>
                                    </div>
                                    <div className="party-info bg-blue-50/30 border border-blue-200 rounded-lg p-4">
                                        <span className="block text-[10px] uppercase font-bold text-blue-600 mb-1">{tAnexa.monthlyRecurrentLabel}</span>
                                        <span className="text-xl font-extrabold text-blue-700">{formatEUR(contractData.anexa_data.calculations.monthlyServicesCostEUR)}</span>
                                        <span className="block text-[9.5px] text-slate-500 leading-relaxed mt-2">{tAnexa.monthlyRecurrentDesc}</span>
                                    </div>
                                </div>

                                {/* Signatures for Anexa */}
                                <div className="signatures-grid grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 mt-12 pt-6 border-t border-slate-200 page-break-inside-avoid font-sans">
                                    <div className="flex flex-col items-center">
                                        <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                                            {tAnexa.signProvider}
                                        </div>
                                        <div className="text-xs text-slate-600 font-semibold mb-4 text-center max-w-full truncate">
                                            {agentProfile?.company_name || '................................................'}
                                        </div>
                                        <SignaturePad 
                                            id="anexa-provider-signature" 
                                            label={tAnexa.signLineProvider} 
                                            clearLabel={tAnexa.clearBtn} 
                                            savedSignature={contractData.anexa_agent_signature}
                                            onSave={contractId ? handleSaveAnexaAgentSignature : undefined}
                                            isRo={isRo}
                                            isLocked={contractData.is_locked}
                                        />
                                    </div>

                                    <div className="flex flex-col items-center">
                                        <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                                            {tAnexa.signBeneficiary}
                                        </div>
                                        <div className="text-xs text-slate-600 font-semibold mb-4 text-center max-w-full truncate">
                                            {formData.ownerName || '................................................'}
                                        </div>
                                        <SignaturePad 
                                            id="anexa-beneficiary-signature" 
                                            label={tAnexa.signLineBeneficiary} 
                                            clearLabel={tAnexa.clearBtn} 
                                            savedSignature={contractData.anexa_owner_signature}
                                            onSave={contractId ? handleSaveAnexaOwnerSignature : undefined}
                                            isRo={isRo}
                                            isLocked={contractData.is_locked}
                                        />
                                    </div>
                                </div>

                                {/* Annex Footer */}
                                <div className="text-center text-[10px] text-slate-400 mt-12 pt-4 border-t border-slate-100 page-break-inside-avoid">
                                    {tAnexa.footerText}
                                </div>
                            </div>
                        )}
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
