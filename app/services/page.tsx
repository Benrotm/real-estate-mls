import React from 'react';
import Link from 'next/link';
import { 
    getServiceCategories, 
    getApprovedProvidersByCategory, 
    getProviderByUserId 
} from '@/app/lib/actions/services-marketplace';
import { getUserProfile } from '@/app/lib/auth';
import { 
    Video, Users, TrendingUp, Calculator, Target, Shield, Compass, Truck, Sparkles, Hammer, Palette, Armchair, Zap,
    Search, User, Coins, BadgeCheck, FileText, Phone, Mail, MapPin, Globe, ArrowRight, ExternalLink 
} from 'lucide-react';

export const dynamic = 'force-dynamic';

const ICON_MAP: Record<string, any> = {
    Video, Users, TrendingUp, Calculator, Target, Shield, Compass, Truck, Sparkles, Hammer, Palette, Armchair, Zap, FileText
};

export default async function ServicesPage({
    searchParams
}: {
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const params = await searchParams;
    const selectedCategory = typeof params?.category === 'string' ? params.category : '';
    
    // 1. Fetch categories and user profile
    const { categories } = await getServiceCategories();
    const profile = await getUserProfile();
    
    let partnerInfo = null;
    if (profile) {
        const { provider } = await getProviderByUserId(profile.id);
        partnerInfo = provider;
    }

    // Determine currently active category slug
    const activeCategorySlug = selectedCategory || (categories.length > 0 ? categories[0].slug : '');
    const activeCategory = categories.find(c => c.slug === activeCategorySlug);

    // 2. Fetch approved providers for the active category
    const { providers } = activeCategorySlug 
        ? await getApprovedProvidersByCategory(activeCategorySlug)
        : { providers: [] };

    const getIcon = (iconName: string) => {
        const Comp = ICON_MAP[iconName] || Target;
        return <Comp className="w-5 h-5" />;
    };

    return (
        <div className="bg-slate-950 min-h-screen text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* 1. Header Banner & Auth / Status bar */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-slate-900/40 p-6 rounded-3xl border border-slate-800">
                    <div className="space-y-2 text-left">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20 uppercase tracking-widest">
                            <BadgeCheck className="w-3.5 h-3.5" />
                            Servicii Parteneri
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                            Catalog Servicii Premium
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
                            Colaborează cu notari, evaluatori, designeri și alți specialiști verificați pentru tranzacții imobiliare de succes.
                        </p>
                    </div>

                    {/* Authentication Status Actions */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
                        {profile ? (
                            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-4 w-full sm:w-auto">
                                <div className="space-y-1 text-left">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                        <User className="w-3 h-3 text-cyan-400" />
                                        Contul Tău
                                    </div>
                                    <h4 className="font-bold text-white text-xs truncate max-w-[150px]">
                                        {profile.full_name}
                                    </h4>
                                    <div className="flex items-center gap-1.5 text-xs text-orange-400 font-bold">
                                        <Coins className="w-3.5 h-3.5" />
                                        <span>{profile.credits || 0} Credite</span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Link 
                                        href="/cont/plati"
                                        className="px-3.5 py-1.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all text-center"
                                    >
                                        Alimentează
                                    </Link>
                                    {!partnerInfo && (
                                        <Link 
                                            href="/services/register"
                                            className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold uppercase tracking-wider border border-white/10 rounded-lg transition-all text-center"
                                        >
                                            Devino Partener
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                                <Link
                                    href="/auth/login?redirect=/services"
                                    className="flex-1 sm:flex-none px-5 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all text-center"
                                >
                                    Autentificare Furnizor
                                </Link>
                                <Link
                                    href="/services/register"
                                    className="flex-1 sm:flex-none px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all text-center shadow-lg shadow-orange-600/10"
                                >
                                    Devino Partener
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Partner Banner Details if approved */}
                {partnerInfo && (
                    <div className="bg-gradient-to-r from-violet-900/40 to-indigo-900/40 border border-indigo-500/20 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
                        <div className="space-y-1">
                            <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">
                                Parteneriat Activ
                            </div>
                            <h3 className="font-bold text-white text-base flex items-center gap-1.5">
                                {partnerInfo.brand_name}
                                <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded uppercase">
                                    {partnerInfo.status}
                                </span>
                            </h3>
                            <p className="text-xs text-indigo-200">
                                Categorie: {partnerInfo.category_slug} • Plan curent: {partnerInfo.selected_plan === 'trial' ? 'Trial 30 zile' : partnerInfo.selected_plan === 'standard' ? 'Abonament Standard' : 'Exclusivitate Zonă'}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Link 
                                href="/cont/plati"
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md"
                            >
                                Prelungește / Cumpără Credite
                            </Link>
                        </div>
                    </div>
                )}

                {/* 3. Main Grid Categories & Providers */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Left Column: Categories List */}
                    <div className="lg:col-span-3 space-y-3 bg-slate-900/30 p-5 rounded-3xl border border-slate-855 text-left">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">
                            Categorii Servicii
                        </h3>
                        <div className="flex flex-col gap-1.5">
                            {categories.map((cat) => (
                                <Link
                                    key={cat.slug}
                                    href={`/services?category=${cat.slug}`}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                                        activeCategorySlug === cat.slug
                                            ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg shadow-orange-500/10'
                                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    <span className={activeCategorySlug === cat.slug ? 'text-white' : 'text-slate-500 group-hover:text-white'}>
                                        {getIcon(cat.icon)}
                                    </span>
                                    <span>{cat.title}</span>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Providers Display */}
                    <div className="lg:col-span-9 space-y-6 text-left">
                        {activeCategory && (
                            <div className="border-b border-slate-800 pb-4">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    {getIcon(activeCategory.icon)}
                                    {activeCategory.title}
                                </h2>
                                <p className="text-xs text-slate-400 mt-1">
                                    {activeCategory.description || 'Lista partenerilor autorizați și recomandați în platformă.'}
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-6">
                            {providers.map((prov) => (
                                <div 
                                    key={prov.id}
                                    className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/20 border border-slate-850 p-6 sm:p-8 rounded-3xl flex flex-col md:flex-row justify-between gap-6 hover:border-slate-800 transition-all shadow-xl group relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
                                    
                                    <div className="space-y-4 flex-1">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-bold text-white text-lg">
                                                    {prov.brand_name}
                                                </h3>
                                                <span className="text-[9px] bg-orange-500/10 text-orange-400 border border-orange-500/25 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                                                    Partener Verificat
                                                </span>
                                                {prov.selected_plan === 'exclusivity' && (
                                                    <span className="text-[9px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/25 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                                                        Recomandare Exclusivă
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-slate-450 text-xs flex-wrap font-medium">
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                                                    {prov.city} (Rază: {prov.radius_km} km)
                                                </span>
                                                {prov.orientative_prices && (
                                                    <span className="text-orange-450 font-bold bg-orange-500/5 px-2.5 py-0.5 rounded border border-orange-500/10">
                                                        Tarif: {prov.orientative_prices}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <p className="text-xs text-slate-350 leading-relaxed max-w-2xl font-normal">
                                            {prov.description}
                                        </p>
                                    </div>

                                    {/* Action Contact Details */}
                                    <div className="flex flex-col justify-center gap-3 border-t md:border-t-0 md:border-l border-slate-850 pt-4 md:pt-0 md:pl-6 shrink-0 min-w-[200px]">
                                        <a 
                                            href={`tel:${prov.phone}`}
                                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
                                        >
                                            <Phone className="w-3.5 h-3.5" />
                                            Apelează Partener
                                        </a>
                                        <a 
                                            href={`mailto:${prov.email}`}
                                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all border border-slate-800 active:scale-95"
                                        >
                                            <Mail className="w-3.5 h-3.5" />
                                            Trimite Email
                                        </a>
                                    </div>
                                </div>
                            ))}

                            {providers.length === 0 && (
                                <div className="py-16 text-center text-slate-500 bg-slate-900/10 border border-dashed border-slate-850 rounded-3xl space-y-2">
                                    <MapPin className="w-8 h-8 text-slate-650 mx-auto" />
                                    <p className="font-medium text-xs">Momentan nu există furnizori în această categorie.</p>
                                    <p className="text-[10px] text-slate-600">Fii primul furnizor aprobat din categoria ta înregistrat în Imobum!</p>
                                    <div className="pt-2">
                                        <Link
                                            href="/services/register"
                                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl text-[10px] uppercase tracking-wider transition-all"
                                        >
                                            Creează Cerere de Parteneriat <ArrowRight className="w-3 h-3" />
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
