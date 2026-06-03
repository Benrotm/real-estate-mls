'use client';

import { useState, useRef, useEffect } from 'react';
import { User, Phone, Save, Loader2, CheckCircle2, AlertCircle, Camera, Upload, X, Building2, RefreshCw, FileText, Landmark } from 'lucide-react';
import { updateUserProfile } from '@/app/lib/actions/user';
import { supabase } from '@/app/lib/supabase/client';

interface ProfileFormProps {
    initialFullName: string;
    initialPhone: string;
    email: string;
    initialCnp?: string;
    initialIdSeriesNumber?: string;
    initialIdPhotoUrl?: string;
    initialIsCompany?: boolean;
    initialCompanyName?: string;
    initialCompanyCui?: string;
    initialCompanyRegCom?: string;
    initialCompanyAddress?: string;
    initialCompanyRepresentative?: string;
    initialGdprConsent?: boolean;
    userId: string;
}

// Camera Capture Modal Component
interface CameraCaptureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCapture: (publicUrl: string) => void;
    userId: string;
}

function CameraCaptureModal({ isOpen, onClose, onCapture, userId }: CameraCaptureModalProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [capturedFile, setCapturedFile] = useState<File | null>(null);
    const [isInitializing, setIsInitializing] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            startCamera();
        }
        return () => {
            stopCamera();
        };
    }, [isOpen]);

    const setVideoRef = (node: HTMLVideoElement | null) => {
        videoRef.current = node;
        if (node && streamRef.current && node.srcObject !== streamRef.current) {
            node.srcObject = streamRef.current;
            node.play().catch(playErr => {
                console.warn("video.play() failed in callback ref:", playErr);
            });
        }
    };

    const startCamera = async () => {
        setIsInitializing(true);
        setCameraError(null);
        setCapturedImage(null);
        setCapturedFile(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Primary back camera on mobile
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play().catch(playErr => {
                    console.warn("video.play() failed in startCamera:", playErr);
                });
            }
            setIsInitializing(false);
        } catch (err: any) {
            console.error('Camera Access Error:', err);
            setCameraError('Nu s-a putut accesa camera. Te rugăm să permiți accesul la cameră din setările browserului.');
            setIsInitializing(false);
        }
    };

    const stopCamera = () => {
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    const handleCapture = () => {
        if (!videoRef.current) return;
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(video, 0, 0);
            const dataUrl = canvas.toDataURL('image/jpeg');
            setCapturedImage(dataUrl);

            // Convert to file
            canvas.toBlob(async (blob) => {
                if (blob) {
                    const file = new File([blob], `camera_capture_${userId}_${Date.now()}.jpg`, { type: 'image/jpeg' });
                    setCapturedFile(file);
                }
            }, 'image/jpeg', 0.85);

            stopCamera();
        }
    };

    const handleRetake = () => {
        setCapturedImage(null);
        setCapturedFile(null);
        startCamera();
    };

    const handleSave = async () => {
        if (!capturedFile) return;
        setIsSaving(true);
        try {
            const fileName = `ids/id_${userId}_${Date.now()}.jpg`;
            const { error: uploadError } = await supabase.storage
                .from('property-images')
                .upload(fileName, capturedFile, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('property-images')
                .getPublicUrl(fileName);

            onCapture(publicUrl);
            onClose();
        } catch (err: any) {
            alert('Eroare la salvarea pozei: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden max-w-lg w-full relative shadow-2xl flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-800/80">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Camera className="w-5 h-5 text-orange-500" />
                        Fă o poză actului de identitate
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Viewport */}
                <div className="aspect-[4/3] bg-slate-950 relative flex items-center justify-center overflow-hidden">
                    {cameraError ? (
                        <div className="p-6 text-center space-y-4">
                            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
                            <p className="text-slate-300 text-sm font-medium">{cameraError}</p>
                            <button
                                type="button"
                                onClick={startCamera}
                                className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-700 transition-colors"
                            >
                                Reîncearcă
                            </button>
                        </div>
                    ) : capturedImage ? (
                        <img src={capturedImage} alt="Captured ID" className="w-full h-full object-contain" />
                    ) : (
                        <>
                            <video
                                ref={setVideoRef}
                                className="w-full h-full object-cover"
                                autoPlay
                                playsInline
                                muted
                            />
                            {isInitializing && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-center space-y-3 z-10">
                                    <Loader2 className="w-10 h-10 text-orange-500 animate-spin mx-auto" />
                                    <p className="text-slate-400 text-xs">Se inițializează camera...</p>
                                </div>
                            )}
                            {/* Card frame overlay */}
                            {!isInitializing && (
                                <div className="absolute inset-0 flex items-center justify-center p-8 pointer-events-none z-20">
                                    <div className="w-full aspect-[1.586/1] border-2 border-dashed border-orange-500/60 rounded-2xl relative">
                                        <div className="absolute inset-0 bg-black/20" />
                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-orange-600 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                                            Aliniază buletinul aici
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="p-5 bg-slate-900 border-t border-slate-800/80 flex justify-center gap-3">
                    {capturedImage ? (
                        <>
                            <button
                                type="button"
                                onClick={handleRetake}
                                disabled={isSaving}
                                className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Refă Poza
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex-1 py-3 px-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 hover:from-orange-600 hover:to-orange-700"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Se încarcă...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4" />
                                        Folosește Poza
                                    </>
                                )}
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            onClick={handleCapture}
                            disabled={isInitializing || !!cameraError}
                            className="w-16 h-16 rounded-full border-4 border-white bg-orange-500 hover:bg-orange-600 active:scale-95 transition-all flex items-center justify-center shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            <div className="w-8 h-8 rounded-full bg-white group-hover:scale-90 transition-transform" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function ProfileForm({
    initialFullName,
    initialPhone,
    email,
    initialCnp,
    initialIdSeriesNumber,
    initialIdPhotoUrl,
    initialIsCompany,
    initialCompanyName,
    initialCompanyCui,
    initialCompanyRegCom,
    initialCompanyAddress,
    initialCompanyRepresentative,
    initialGdprConsent,
    userId
}: ProfileFormProps) {
    const [fullName, setFullName] = useState(initialFullName);
    const [phone, setPhone] = useState(initialPhone || '');
    const [cnp, setCnp] = useState(initialCnp || '');
    const [idSeriesNumber, setIdSeriesNumber] = useState(initialIdSeriesNumber || '');
    const [idPhotoUrl, setIdPhotoUrl] = useState(initialIdPhotoUrl || '');
    const [isCompany, setIsCompany] = useState(initialIsCompany || false);
    const [companyName, setCompanyName] = useState(initialCompanyName || '');
    const [companyCui, setCompanyCui] = useState(initialCompanyCui || '');
    const [companyRegCom, setCompanyRegCom] = useState(initialCompanyRegCom || '');
    const [companyAddress, setCompanyAddress] = useState(initialCompanyAddress || '');
    const [companyRepresentative, setCompanyRepresentative] = useState(initialCompanyRepresentative || '');
    const [gdprConsent, setGdprConsent] = useState(initialGdprConsent || false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploadingFile, setIsUploadingFile] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleCnpChange = (val: string) => {
        const clean = val.replace(/\D/g, ''); // Numbers only
        if (clean.length <= 13) {
            setCnp(clean);
        }
    };

    const handleIdSeriesNumberChange = (val: string) => {
        setIdSeriesNumber(val.toUpperCase());
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploadingFile(true);
        try {
            const fileExt = file.name.split('.').pop() || 'jpg';
            const fileName = `ids/id_${userId}_${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('property-images')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('property-images')
                .getPublicUrl(filePath);

            setIdPhotoUrl(publicUrl);
        } catch (err: any) {
            alert('Eroare la încărcare: ' + err.message);
        } finally {
            setIsUploadingFile(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus('idle');
        setErrorMessage('');

        // Basic CNP check if filled
        if (cnp && cnp.length !== 13) {
            setStatus('error');
            setErrorMessage('CNP-ul trebuie să conțină exact 13 cifre.');
            setIsSubmitting(false);
            return;
        }

        // GDPR check if verification details are filled
        if ((cnp || idSeriesNumber || idPhotoUrl || isCompany) && !gdprConsent) {
            setStatus('error');
            setErrorMessage('Pentru a salva datele de identificare / firmă, este necesar să fiți de acord cu prelucrarea datelor în conformitate cu GDPR.');
            setIsSubmitting(false);
            return;
        }

        try {
            const result = await updateUserProfile({
                full_name: fullName,
                phone,
                cnp,
                id_series_number: idSeriesNumber,
                id_photo_url: idPhotoUrl,
                is_company: isCompany,
                company_name: isCompany ? companyName : '',
                company_cui: isCompany ? companyCui : '',
                company_reg_com: isCompany ? companyRegCom : '',
                company_address: isCompany ? companyAddress : '',
                company_representative: isCompany ? companyRepresentative : '',
                gdpr_consent: gdprConsent
            });

            if (result.error) {
                setStatus('error');
                setErrorMessage(result.error);
            } else {
                setStatus('success');
                setTimeout(() => setStatus('idle'), 3000);
            }
        } catch (error: any) {
            setStatus('error');
            setErrorMessage(error.message || 'An unexpected error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    {/* Card 1: Personal Information */}
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <User className="w-5 h-5 text-orange-600" />
                            Informații Personale & Verificare
                        </h3>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label htmlFor="fullName" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Nume Complet
                                </label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <input
                                        id="fullName"
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-slate-900"
                                        placeholder="Ex: Popescu Ion"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="phone" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Număr Telefon
                                </label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                        <Phone className="w-4 h-4" />
                                    </div>
                                    <input
                                        id="phone"
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-slate-900"
                                        placeholder="+40 700 000 000"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Adresă Email
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    disabled
                                    className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl font-medium text-slate-500 cursor-not-allowed"
                                />
                                <p className="text-[10px] text-slate-400 font-medium italic">Email-ul nu poate fi schimbat din motive de siguranță.</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label htmlFor="cnp" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        CNP (13 cifre)
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                            <FileText className="w-4 h-4" />
                                        </div>
                                        <input
                                            id="cnp"
                                            type="text"
                                            value={cnp}
                                            onChange={(e) => handleCnpChange(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-slate-900"
                                            placeholder="1900101......"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label htmlFor="idSeries" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Serie și Nr. Buletin
                                    </label>
                                    <input
                                        id="idSeries"
                                        type="text"
                                        value={idSeriesNumber}
                                        onChange={(e) => handleIdSeriesNumberChange(e.target.value)}
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-slate-900 uppercase"
                                        placeholder="Ex: AX 123456"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: ID Photo Verification */}
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Camera className="w-5 h-5 text-orange-600" />
                            Poză Act de Identitate
                        </h3>

                        <div className="space-y-4">
                            {idPhotoUrl ? (
                                <div className="relative w-full aspect-[1.586/1] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200/80 group">
                                    <img src={idPhotoUrl} alt="Buletin" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => setIdPhotoUrl('')}
                                        className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="w-full aspect-[1.586/1] border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center p-4 bg-slate-100/50">
                                    <FileText className="w-10 h-10 text-slate-400 mb-2" />
                                    <p className="text-xs text-slate-500 text-center font-medium">
                                        Încărcați o poză clară a actului de identitate
                                    </p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploadingFile}
                                    className="py-3 px-4 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                                >
                                    {isUploadingFile ? (
                                        <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                                    ) : (
                                        <Upload className="w-4 h-4 text-slate-500" />
                                    )}
                                    Galerie / PC
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCamera(true)}
                                    className="py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-md"
                                >
                                    <Camera className="w-4 h-4 text-orange-400" />
                                    Deschide Camera
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Company Settings (Persoana Juridica) */}
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-orange-600" />
                                <h3 className="text-lg font-bold text-slate-900">
                                    Persoană Juridică (Firma)
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsCompany(!isCompany)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                                    isCompany ? 'bg-orange-500' : 'bg-slate-200'
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        isCompany ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>

                        {isCompany && (
                            <div className="pt-4 border-t border-slate-200/60 space-y-4 animate-in fade-in slide-in-from-top-4 duration-200">
                                <div className="space-y-1.5">
                                    <label htmlFor="companyName" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Nume Companie / Societate
                                    </label>
                                    <input
                                        id="companyName"
                                        type="text"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-slate-900"
                                        placeholder="Ex: Imob Design S.R.L."
                                        required={isCompany}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label htmlFor="companyRepresentative" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Reprezentat prin
                                    </label>
                                    <input
                                        id="companyRepresentative"
                                        type="text"
                                        value={companyRepresentative}
                                        onChange={(e) => setCompanyRepresentative(e.target.value)}
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-slate-900"
                                        placeholder="Ex: Popescu Ion"
                                        required={isCompany}
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label htmlFor="companyCui" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            CUI / CIF
                                        </label>
                                        <input
                                            id="companyCui"
                                            type="text"
                                            value={companyCui}
                                            onChange={(e) => setCompanyCui(e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-slate-900"
                                            placeholder="Ex: RO12345678"
                                            required={isCompany}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label htmlFor="companyRegCom" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            Nr. Reg. Comerțului
                                        </label>
                                        <input
                                            id="companyRegCom"
                                            type="text"
                                            value={companyRegCom}
                                            onChange={(e) => setCompanyRegCom(e.target.value)}
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-slate-900"
                                            placeholder="Ex: J40/123/2026"
                                            required={isCompany}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label htmlFor="companyAddress" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Sediu Social (Adresă)
                                    </label>
                                    <textarea
                                        id="companyAddress"
                                        value={companyAddress}
                                        onChange={(e) => setCompanyAddress(e.target.value)}
                                        rows={2}
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium text-slate-900"
                                        placeholder="Strada, Numar, Bloc, Oras, Judet"
                                        required={isCompany}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Card 4: Save Changes */}
                    <div className="sticky top-24">
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
                            <Save className="w-5 h-5 text-orange-600" />
                            Salvează Setările
                        </h3>
                        <div className="p-6 bg-orange-50 rounded-2xl border border-orange-100 space-y-4">
                            <p className="text-sm text-slate-600 leading-relaxed">
                                Datele completate în această secțiune sunt folosite strict pentru conformitatea cu reglementările legale, facturare și securizarea drepturilor dvs. de publicare pe platformă.
                            </p>

                            {/* GDPR Checkbox */}
                            <div className="flex items-start gap-3 p-3.5 bg-white border border-slate-100 rounded-xl">
                                <input
                                    id="gdprConsent"
                                    type="checkbox"
                                    checked={gdprConsent}
                                    onChange={(e) => setGdprConsent(e.target.checked)}
                                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                                />
                                <label htmlFor="gdprConsent" className="text-xs text-slate-600 font-semibold leading-normal select-none cursor-pointer">
                                    Sunt de acord ca datele mele cu caracter personal (CNP, Serie/Nr. ID, poze ID și date firmă) să fie prelucrate de Real Estate MLS strict în scopul validării contului și al facturării, conform reglementărilor GDPR.
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting || isUploadingFile}
                                className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-white transition-all shadow-lg ${
                                    isSubmitting || isUploadingFile
                                        ? 'bg-slate-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-orange-500/25 hover:-translate-y-0.5'
                                }`}
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Save className="w-5 h-5" />
                                )}
                                {isSubmitting ? 'Se salvează...' : 'Salvează Modificările'}
                            </button>

                            {status === 'success' && (
                                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 p-3 rounded-lg border border-emerald-100 animate-in fade-in slide-in-from-top-2">
                                    <CheckCircle2 className="w-5 h-5" />
                                    <span className="text-sm font-bold">Profilul a fost salvat cu succes!</span>
                                </div>
                            )}

                            {status === 'error' && (
                                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 animate-in fade-in slide-in-from-top-2">
                                    <AlertCircle className="w-5 h-5" />
                                    <span className="text-sm font-bold">{errorMessage}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Camera Capture Modal Overlay */}
            <CameraCaptureModal
                isOpen={showCamera}
                onClose={() => setShowCamera(false)}
                onCapture={(url) => setIdPhotoUrl(url)}
                userId={userId}
            />
        </form>
    );
}
