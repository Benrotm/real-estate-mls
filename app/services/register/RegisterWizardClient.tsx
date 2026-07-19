'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/client';
import { registerServiceProvider } from '@/app/lib/actions/services-marketplace';
import { 
    ArrowLeft, ArrowRight, ShieldCheck, Upload, FileText, CheckCircle2, 
    Home, HelpCircle, Briefcase, MapPin, Sparkles, Star, Lock, LogIn, UserPlus 
} from 'lucide-react';

interface Category {
    id: string;
    title: string;
    slug: string;
    description: string;
    icon: string;
}

interface RegisterWizardClientProps {
    categories: Category[];
    initialUser: any; // UserProfile or null
}

export default function RegisterWizardClient({ categories, initialUser }: RegisterWizardClientProps) {
    const router = useRouter();
    const supabase = createClient();
    
    // Auth state tracking
    const [user, setUser] = useState(initialUser);
    const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
    const [authEmail, setAuthEmail] = useState('');
    const [authPassword, setAuthPassword] = useState('');
    const [authFullName, setAuthFullName] = useState('');
    const [authPhone, setAuthPhone] = useState('');
    const [authLoading, setAuthLoading] = useState(false);
    const [authMessage, setAuthMessage] = useState('');

    const [currentStep, setCurrentStep] = useState(1);
    
    // Step 1: Datele firmei
    const [brandName, setBrandName] = useState('');
    const [cuiCif, setCuiCif] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');

    // Step 2: Specializare & Acte
    const [selectedCategorySlug, setSelectedCategorySlug] = useState('');
    const [documentUrl, setDocumentUrl] = useState('');
    const [uploading, setUploading] = useState(false);

    // Step 3: Zona de acoperire
    const [city, setCity] = useState('');
    const [radiusKm, setRadiusKm] = useState(20);

    // Step 4: Profil Public
    const [description, setDescription] = useState('');
    const [orientativePrices, setOrientativePrices] = useState('');

    // Step 5: Alege un plan
    const [selectedPlan, setSelectedPlan] = useState<'trial' | 'standard' | 'exclusivity'>('trial');
    const [submitting, setSubmitting] = useState(false);

    // Sync auth session changes
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                // Fetch profile
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();
                setUser(profile);
            } else {
                setUser(null);
            }
        });
        return () => subscription.unsubscribe();
    }, [supabase]);

    // Handle Inline Authentication
    const handleAuthAction = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthLoading(true);
        setAuthMessage('');

        try {
            if (authMode === 'login') {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: authEmail,
                    password: authPassword
                });
                if (error) throw error;
                setAuthMessage('Te-ai conectat cu succes!');
            } else {
                // Sign Up
                if (!authFullName.trim() || !authPhone.trim()) {
                    throw new Error('Numele complet și numărul de telefon sunt obligatorii.');
                }
                const { data, error } = await supabase.auth.signUp({
                    email: authEmail,
                    password: authPassword,
                    options: {
                        data: {
                            full_name: authFullName,
                            phone: authPhone,
                            role: 'agent' // Default role
                        }
                    }
                });
                if (error) throw error;
                setAuthMessage('Cont creat cu succes! Verifică e-mail-ul pentru confirmare.');
            }
        } catch (e: any) {
            setAuthMessage(e.message || 'Eroare la autentificare.');
        } finally {
            setAuthLoading(false);
        }
    };

    // Document Upload handling
    const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const fileName = `partner_docs/${cuiCif || 'unnamed'}_${Date.now()}_${file.name}`;
            const { data, error } = await supabase.storage
                .from('property-images')
                .upload(fileName, file);

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('property-images')
                .getPublicUrl(fileName);

            setDocumentUrl(publicUrl);
        } catch (err: any) {
            console.error('Document upload error:', err);
            alert('Upload eșuat: ' + (err.message || 'Eroare necunoscută'));
        } finally {
            setUploading(false);
        }
    };

    // Form Navigation Validators
    const handleNext = () => {
        if (currentStep === 1) {
            if (!brandName.trim() || !cuiCif.trim() || !phone.trim() || !email.trim()) {
                alert('Vă rugăm să completați toate datele de identificare a firmei.');
                return;
            }
        }
        if (currentStep === 2) {
            if (!selectedCategorySlug) {
                alert('Vă rugăm să selectați categoria principală a serviciului oferit.');
                return;
            }
        }
        if (currentStep === 3) {
            if (!city.trim()) {
                alert('Vă rugăm să introduceți orașul principal de acoperire.');
                return;
            }
        }
        if (currentStep === 4) {
            if (!description.trim() || description.length < 20) {
                alert('Vă rugăm să introduceți o descriere de minim 20 de caractere.');
                return;
            }
        }
        setCurrentStep(prev => prev + 1);
    };

    const handleBack = () => {
        setCurrentStep(prev => prev - 1);
    };

    // Final Wizard Submit
    const handleSubmitRequest = async () => {
        if (!user) {
            alert('Trebuie să fii conectat în cont pentru a trimite cererea.');
            return;
        }
        setSubmitting(true);
        try {
            const res = await registerServiceProvider({
                brand_name: brandName,
                cui_cif: cuiCif,
                phone: phone,
                email: email,
                category_slug: selectedCategorySlug,
                document_url: documentUrl || undefined,
                city: city,
                radius_km: radiusKm,
                description: description,
                orientative_prices: orientativePrices || undefined,
                selected_plan: selectedPlan
            });

            if (res.success) {
                alert('Cererea de parteneriat a fost trimisă cu succes pentru aprobare!');
                router.push('/services');
            } else {
                alert('Eroare: ' + res.error);
            }
        } catch (e: any) {
            alert('Eroare tehnică: ' + e.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-xl mx-auto space-y-8">
                
                {/* Back Navigation Header */}
                <div className="flex items-center gap-2">
                    <Link href="/services" className="text-slate-400 hover:text-white flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Înapoi la Servicii
                    </Link>
                </div>

                {/* Steps and Progress header */}
                <div className="text-center space-y-3">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                        Devino Partener
                    </h1>
                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest">
                        Pasul {currentStep} din 5
                    </p>
                    
                    {/* Steps Indicator Dots */}
                    <div className="flex items-center justify-center gap-2 pt-2">
                        {[1, 2, 3, 4, 5].map(step => (
                            <div 
                                key={step} 
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                    step <= currentStep ? 'w-8 bg-orange-600' : 'w-2 bg-slate-800'
                                }`} 
                            />
                        ))}
                    </div>
                </div>

                {/* Center Content Card */}
                <div className="bg-slate-900/60 border border-slate-850 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6 text-left">
                    
                    {/* PASUL 1: DATELE FIRMEI */}
                    {currentStep === 1 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 border-b border-slate-850 pb-3">
                                <span className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center text-orange-400">
                                    <Briefcase className="w-4 h-4" />
                                </span>
                                <div>
                                    <h3 className="font-bold text-sm text-white">Datele firmei</h3>
                                    <p className="text-[10px] text-slate-400">Identificarea afacerii tale</p>
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-slate-450 mb-1">Nume Firmă / Brand *</label>
                                    <input
                                        type="text"
                                        value={brandName}
                                        onChange={(e) => setBrandName(e.target.value)}
                                        placeholder="Ex: Notar Public Maria T."
                                        className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-4 py-2.5 text-xs text-white outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-slate-450 mb-1">CUI / CIF *</label>
                                    <input
                                        type="text"
                                        value={cuiCif}
                                        onChange={(e) => setCuiCif(e.target.value)}
                                        placeholder="RO12345678"
                                        className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-4 py-2.5 text-xs text-white outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-slate-450 mb-1">Telefon Contact *</label>
                                    <input
                                        type="text"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="07XX XXX XXX"
                                        className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-4 py-2.5 text-xs text-white outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-slate-450 mb-1">Email Business *</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="contact@firma.ro"
                                        className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-4 py-2.5 text-xs text-white outline-none transition-colors"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PASUL 2: SPECIALIZAREA TA */}
                    {currentStep === 2 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 border-b border-slate-850 pb-3">
                                <span className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center text-orange-400">
                                    <Star className="w-4 h-4" />
                                </span>
                                <div>
                                    <h3 className="font-bold text-sm text-white">Specializarea ta</h3>
                                    <p className="text-[10px] text-slate-400">Unde te vor găsi clienții?</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="block text-[10px] uppercase font-bold text-slate-450">Categorie Principală *</label>
                                <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                                    {categories.map((cat) => (
                                        <button
                                            key={cat.slug}
                                            type="button"
                                            onClick={() => setSelectedCategorySlug(cat.slug)}
                                            className={`p-2.5 rounded-xl border text-[11px] font-bold text-left transition-all ${
                                                selectedCategorySlug === cat.slug
                                                    ? 'border-orange-500 bg-orange-500/10 text-white'
                                                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-white'
                                            }`}
                                        >
                                            {cat.title}
                                        </button>
                                    ))}
                                </div>

                                <div className="pt-3 border-t border-slate-850 space-y-2">
                                    <label className="block text-[10px] uppercase font-bold text-slate-450">Documente (Autorizație/CUI)</label>
                                    <div className="relative border border-dashed border-slate-800 rounded-2xl p-4 bg-slate-950 text-center flex flex-col items-center justify-center gap-2 hover:border-slate-750 transition-colors">
                                        {documentUrl ? (
                                            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                                                <CheckCircle2 className="w-4 h-4" /> Document încărcat cu succes!
                                            </div>
                                        ) : (
                                            <>
                                                <Upload className="w-6 h-6 text-slate-500" />
                                                <span className="text-[11px] font-semibold text-slate-400">Încarcă PDF sau Foto</span>
                                                <span className="text-[9px] text-slate-600">Acest document nu va fi public.</span>
                                            </>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*,application/pdf"
                                            onChange={handleDocumentUpload}
                                            disabled={uploading}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                    </div>
                                    {uploading && (
                                        <div className="text-[10px] text-center text-orange-400 animate-pulse font-semibold">
                                            Se încarcă documentul...
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PASUL 3: ZONA DE ACOPERIRE */}
                    {currentStep === 3 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 border-b border-slate-850 pb-3">
                                <span className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center text-orange-400">
                                    <MapPin className="w-4 h-4" />
                                </span>
                                <div>
                                    <h3 className="font-bold text-sm text-white">Zona de acoperire</h3>
                                    <p className="text-[10px] text-slate-400">Unde îți oferi serviciile?</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-slate-450 mb-1">Oraș Principal *</label>
                                    <input
                                        type="text"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        placeholder="Ex: Timișoara"
                                        className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-4 py-2.5 text-xs text-white outline-none transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-450">
                                        <span>Rază de deplasare (KM)</span>
                                        <span className="text-orange-400 font-bold text-xs">{radiusKm} KM</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={radiusKm}
                                        onChange={(e) => setRadiusKm(parseInt(e.target.value))}
                                        className="w-full h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-orange-500"
                                    />
                                    <div className="flex justify-between text-[9px] text-slate-600 font-bold">
                                        <span>0 km (doar în oraș)</span>
                                        <span>50 km</span>
                                        <span>100 km</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PASUL 4: PROFILUL TĂU PUBLIC */}
                    {currentStep === 4 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 border-b border-slate-850 pb-3">
                                <span className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center text-orange-400">
                                    <Sparkles className="w-4 h-4" />
                                </span>
                                <div>
                                    <h3 className="font-bold text-sm text-white">Profilul tău public</h3>
                                    <p className="text-[10px] text-slate-400">Cum te văd clienții</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-slate-450 mb-1">Descriere Servicii *</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Descrie pe scurt ce servicii oferi și de ce să te aleagă clienții..."
                                        rows={4}
                                        className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-4 py-2.5 text-xs text-white outline-none transition-colors resize-none"
                                    />
                                    <span className="text-[9px] text-slate-500">Minim 20 de caractere.</span>
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-slate-450 mb-1">Tarife Orientative (opțional)</label>
                                    <input
                                        type="text"
                                        value={orientativePrices}
                                        onChange={(e) => setOrientativePrices(e.target.value)}
                                        placeholder="Ex: Consultanță 200 RON, Proiect de la 500 €"
                                        className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-4 py-2.5 text-xs text-white outline-none transition-colors"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PASUL 5: ALEGE UN PLAN */}
                    {currentStep === 5 && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 border-b border-slate-850 pb-3">
                                <span className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center text-orange-400">
                                    <Lock className="w-4 h-4" />
                                </span>
                                <div>
                                    <h3 className="font-bold text-sm text-white">Alege un plan</h3>
                                    <p className="text-[10px] text-slate-400">Start gratuit pentru toți partenerii</p>
                                </div>
                            </div>

                            {/* Plan Options Selector */}
                            <div className="space-y-3">
                                <button
                                    type="button"
                                    onClick={() => setSelectedPlan('trial')}
                                    className={`w-full p-4 rounded-2xl border text-left flex justify-between items-center transition-all ${
                                        selectedPlan === 'trial'
                                            ? 'border-orange-500 bg-orange-500/5'
                                            : 'border-slate-800 bg-slate-950 hover:border-slate-750'
                                    }`}
                                >
                                    <div className="space-y-1">
                                        <h4 className="font-bold text-xs uppercase text-white">Plan Trial (30 Zile)</h4>
                                        <p className="text-[10px] text-slate-500 max-w-[300px]">Testează platforma gratuit. Primești lead-uri și ești vizibil în listă fără niciun cost.</p>
                                    </div>
                                    <span className="text-xs font-bold text-orange-400">0 RON</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setSelectedPlan('standard')}
                                    className={`w-full p-4 rounded-2xl border text-left flex justify-between items-center transition-all ${
                                        selectedPlan === 'standard'
                                            ? 'border-orange-500 bg-orange-500/5'
                                            : 'border-slate-800 bg-slate-950 hover:border-slate-750'
                                    }`}
                                >
                                    <div className="space-y-1">
                                        <h4 className="font-bold text-xs uppercase text-white">Abonament Standard</h4>
                                        <p className="text-[10px] text-slate-500 max-w-[300px]">Vizibilitate continuă în catalogul general de specialiști și badge de partener verificat.</p>
                                    </div>
                                    <span className="text-xs font-bold text-orange-400">199 Credite / lună</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setSelectedPlan('exclusivity')}
                                    className={`w-full p-4 rounded-2xl border text-left flex justify-between items-center transition-all ${
                                        selectedPlan === 'exclusivity'
                                            ? 'border-orange-500 bg-orange-500/5'
                                            : 'border-slate-800 bg-slate-950 hover:border-slate-750'
                                    }`}
                                >
                                    <div className="space-y-1">
                                        <h4 className="font-bold text-xs uppercase text-white">Exclusivitate Zonă</h4>
                                        <p className="text-[10px] text-slate-500 max-w-[300px]">Fii singurul partener recomandat din categoria ta în orașul și raza selectată.</p>
                                    </div>
                                    <span className="text-xs font-bold text-orange-400">2490 Credite / lună</span>
                                </button>
                            </div>

                            {/* INLINE REGISTRATION / LOGIN FLOW FOR GUEST USERS */}
                            {!user && (
                                <div className="border-t border-slate-850 pt-5 space-y-4 text-left">
                                    <div className="p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl">
                                        <h5 className="text-xs font-bold text-yellow-400 flex items-center gap-1.5">
                                            <Lock className="w-3.5 h-3.5" />
                                            Autentificare necesară
                                        </h5>
                                        <p className="text-[10px] text-slate-450 mt-1 leading-relaxed">
                                            Pentru a finaliza cererea și a-ți putea administra profilul și creditele ulterior, te rugăm să creezi un cont de utilizator sau să te conectezi.
                                        </p>
                                    </div>

                                    {/* Auth toggler */}
                                    <div className="flex border-b border-slate-850 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => { setAuthMode('signup'); setAuthMessage(''); }}
                                            className={`pb-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                                                authMode === 'signup' ? 'border-orange-500 text-white' : 'border-transparent text-slate-400'
                                            }`}
                                        >
                                            <UserPlus className="w-3.5 h-3.5 inline mr-1" />
                                            Creează Cont
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setAuthMode('login'); setAuthMessage(''); }}
                                            className={`pb-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                                                authMode === 'login' ? 'border-orange-500 text-white' : 'border-transparent text-slate-400'
                                            }`}
                                        >
                                            <LogIn className="w-3.5 h-3.5 inline mr-1" />
                                            Conectare
                                        </button>
                                    </div>

                                    <form onSubmit={handleAuthAction} className="space-y-3 pt-2">
                                        {authMode === 'signup' && (
                                            <>
                                                <div>
                                                    <label className="block text-[9px] uppercase font-bold text-slate-450 mb-1">Nume Complet</label>
                                                    <input
                                                        type="text"
                                                        value={authFullName}
                                                        onChange={(e) => setAuthFullName(e.target.value)}
                                                        placeholder="Nume Prenume"
                                                        className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[9px] uppercase font-bold text-slate-450 mb-1">Telefon</label>
                                                    <input
                                                        type="text"
                                                        value={authPhone}
                                                        onChange={(e) => setAuthPhone(e.target.value)}
                                                        placeholder="07XX XXX XXX"
                                                        className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                                                        required
                                                    />
                                                </div>
                                            </>
                                        )}
                                        <div>
                                            <label className="block text-[9px] uppercase font-bold text-slate-450 mb-1">E-mail</label>
                                            <input
                                                type="email"
                                                value={authEmail}
                                                onChange={(e) => setAuthEmail(e.target.value)}
                                                placeholder="email@exemplu.com"
                                                className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[9px] uppercase font-bold text-slate-450 mb-1">Parolă</label>
                                            <input
                                                type="password"
                                                value={authPassword}
                                                onChange={(e) => setAuthPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                                                required
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={authLoading}
                                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all disabled:opacity-50"
                                        >
                                            {authLoading ? 'Se procesează...' : authMode === 'signup' ? 'Înregistrare Cont' : 'Autentificare'}
                                        </button>

                                        {authMessage && (
                                            <div className="text-[10px] text-orange-400 font-semibold p-2 bg-orange-500/5 border border-orange-500/10 rounded-lg text-center animate-pulse">
                                                {authMessage}
                                            </div>
                                        )}
                                    </form>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step Action Buttons */}
                    <div className="flex justify-between items-center pt-4 border-t border-slate-850 gap-4">
                        {currentStep > 1 ? (
                            <button
                                type="button"
                                onClick={handleBack}
                                className="px-5 py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-350 font-bold rounded-xl text-[10px] uppercase tracking-wider transition-all flex items-center gap-1.5 active:scale-95"
                            >
                                Înapoi
                            </button>
                        ) : (
                            <div />
                        )}

                        {currentStep < 5 ? (
                            <button
                                type="button"
                                onClick={handleNext}
                                className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold rounded-xl text-[10px] uppercase tracking-wider transition-all flex items-center gap-1.5 active:scale-95 ml-auto"
                            >
                                Continuă
                                <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSubmitRequest}
                                disabled={submitting || !user}
                                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-[10px] uppercase tracking-wider transition-all flex items-center gap-1.5 active:scale-95 ml-auto shadow-lg shadow-emerald-600/10"
                            >
                                {submitting ? 'Se trimite...' : 'Trimite cererea ✓'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
