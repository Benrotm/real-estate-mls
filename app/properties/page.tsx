
import { getProperties } from '@/app/lib/actions/properties';
import PropertySearchFilters from '@/app/components/PropertySearchFilters';
import PropertyCard from '@/app/components/PropertyCard';
import { Suspense } from 'react';
import { bulkCheckUserFeatureAccess, SYSTEM_FEATURES } from '@/app/lib/auth/features';
import PerPageSelector from '@/app/components/PerPageSelector';
import PropertySortToggle from '@/app/components/PropertySortToggle';
import Pagination from '@/app/components/Pagination';
import PropertiesClientView from '@/app/components/properties/PropertiesClientView';

import { getUserProfile } from '@/app/lib/auth';
import { getAdminSettings } from '@/app/lib/actions/admin-settings';
import { createClient } from '@/app/lib/supabase/server';
import Link from 'next/link';
import { ShieldAlert, Key, Search, BarChart3, Building2, CheckCircle2, Home, Warehouse, Map, Landmark, Briefcase, HelpCircle, Users, Target, TrendingUp, Clock } from 'lucide-react';

export default async function PropertiesPage({ searchParams }: { searchParams: Promise<any> }) {
    const filters = await searchParams;
    const { properties, totalCount } = await getProperties(filters);

    const profile = await getUserProfile();
    const adminSettings = await getAdminSettings();

    // If properties page is private and user is not logged in, display visitor dashboard
    if (adminSettings.properties_page_public === false && !profile) {
        const supabase = await createClient();

        // Call the database RPC function to retrieve the complete inventory aggregate statistics
        const { data: statsData } = await supabase.rpc('get_property_matrix_stats');

        // Fetch active leads count dynamically
        const { count: leadsCount } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true });

        // Define matrix mapping
        const matrix: Record<string, { sale: number; rent: number; total: number }> = {
            'Apartment': { sale: 0, rent: 0, total: 0 },
            'House': { sale: 0, rent: 0, total: 0 },
            'Commercial': { sale: 0, rent: 0, total: 0 },
            'Land': { sale: 0, rent: 0, total: 0 },
            'Industrial': { sale: 0, rent: 0, total: 0 },
            'Business': { sale: 0, rent: 0, total: 0 },
            'Other': { sale: 0, rent: 0, total: 0 }
        };

        const ICON_MAP = {
            'Apartment': Building2,
            'House': Home,
            'Commercial': Landmark,
            'Industrial': Warehouse,
            'Land': Map,
            'Business': Briefcase,
            'Other': HelpCircle
        };

        let saleTotal = 0;
        let rentTotal = 0;

        statsData?.forEach((row: any) => {
            const t = row.type;
            const tx = row.listing_type;
            const count = parseInt(row.count || '0', 10);

            if (tx === 'For Sale') saleTotal += count;
            else if (tx === 'For Rent') rentTotal += count;

            const key = matrix[t] ? t : 'Other';
            if (tx === 'For Sale') matrix[key].sale += count;
            else if (tx === 'For Rent') matrix[key].rent += count;
            matrix[key].total += count;
        });

        return (
            <div className="min-h-screen bg-slate-50 pb-20">
                <div className="py-4 mb-2">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h1 className="text-2xl md:text-3xl font-medium tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Properties for Sale & Rent
                        </h1>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                    {/* Filters remain interactive */}
                    <Suspense fallback={<div className="p-4 bg-white rounded-lg shadow-sm">Loading filters...</div>}>
                        <PropertySearchFilters />
                    </Suspense>

                    {/* Stats Dashboard Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-4 mb-4">
                        <div>
                            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                                MLS Market Insights & Inventory Overview
                            </h2>
                            <p className="text-xs font-bold text-slate-500 mt-0.5">Real-time inventory analysis of the active database</p>
                        </div>
                        <div className="mt-2 md:mt-0 text-[10px] uppercase font-black tracking-wider text-slate-400 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 w-fit">
                            Updated: Live
                        </div>
                    </div>

                    {/* Global Stats Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Active Search Results */}
                        <div className="bg-gradient-to-br from-blue-600 to-cyan-500 text-white rounded-3xl p-5 shadow-xl shadow-blue-500/10 relative overflow-hidden border border-blue-500/20">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                            <div className="flex items-center justify-between gap-4 relative z-10">
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-bold uppercase tracking-widest bg-white/10 px-2.5 py-0.5 rounded-full border border-white/20">Căutare Curentă</span>
                                        <Search className="w-3.5 h-3.5 text-white/80" />
                                    </div>
                                    <p className="text-[10px] font-semibold text-white/80 uppercase tracking-wider max-w-[180px] leading-tight">Proprietăți identificate conform filtrelor</p>
                                </div>
                                <div className="text-4xl md:text-5xl font-mono font-extrabold tracking-tight text-white shrink-0">
                                    {totalCount}
                                </div>
                            </div>
                        </div>

                        {/* Global Sales */}
                        <div className="bg-gradient-to-br from-emerald-600 to-teal-500 text-white rounded-3xl p-5 shadow-xl shadow-emerald-500/10 relative overflow-hidden border border-emerald-500/20">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                            <div className="flex items-center justify-between gap-4 relative z-10">
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-bold uppercase tracking-widest bg-white/10 px-2.5 py-0.5 rounded-full border border-white/20">De Vânzare</span>
                                        <Building2 className="w-3.5 h-3.5 text-white/80" />
                                    </div>
                                    <p className="text-[10px] font-semibold text-white/80 uppercase tracking-wider max-w-[180px] leading-tight">Total listări active de vânzare</p>
                                </div>
                                <div className="text-4xl md:text-5xl font-mono font-extrabold tracking-tight text-white shrink-0">
                                    {saleTotal}
                                </div>
                            </div>
                        </div>

                        {/* Global Rents */}
                        <div className="bg-gradient-to-br from-purple-600 to-indigo-500 text-white rounded-3xl p-5 shadow-xl shadow-purple-500/10 relative overflow-hidden border border-purple-500/20">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                            <div className="flex items-center justify-between gap-4 relative z-10">
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-bold uppercase tracking-widest bg-white/10 px-2.5 py-0.5 rounded-full border border-white/20">De Închiriat</span>
                                        <Key className="w-3.5 h-3.5 text-white/80" />
                                    </div>
                                    <p className="text-[10px] font-semibold text-white/80 uppercase tracking-wider max-w-[180px] leading-tight">Total listări active de închiriat</p>
                                </div>
                                <div className="text-4xl md:text-5xl font-mono font-extrabold tracking-tight text-white shrink-0">
                                    {rentTotal}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section title for detailed matrix cards */}
                    <div className="pt-6 pb-2 border-b border-slate-200">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Distribuție pe Categorii de Proprietăți</h3>
                        <p className="text-[11px] font-semibold text-slate-400 mt-0.5">Fiecare categorie de proprietate prezintă un card dedicat cu starea curentă a pieței imobiliare</p>
                    </div>

                    {/* Category Matrix Grid (separate card for every type) */}
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                        {Object.entries(matrix).map(([type, stats]) => {
                            const Icon = ICON_MAP[type as keyof typeof ICON_MAP] || HelpCircle;
                            const salePercent = stats.total > 0 ? (stats.sale / stats.total) * 100 : 0;
                            const rentPercent = stats.total > 0 ? (stats.rent / stats.total) * 100 : 0;

                            return (
                                <div key={type} className="bg-white text-slate-800 rounded-2xl md:rounded-3xl p-3 md:p-6 shadow-md hover:shadow-xl hover:border-indigo-500/50 hover:-translate-y-1.5 transition-all duration-300 border border-slate-200/80 flex flex-col justify-between relative overflow-hidden group min-h-[200px] md:min-h-[240px]">
                                    {/* Glowing top line on hover */}
                                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    
                                    <div>
                                        <div className="flex items-center justify-between mb-2 md:mb-4">
                                            <div className="w-9 h-9 md:w-12 md:h-12 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-all duration-300">
                                                <Icon className="w-4 h-4 md:w-5 md:h-5" />
                                            </div>
                                            <span className="text-[9px] md:text-[12px] font-bold bg-slate-100 text-slate-700 px-2 py-1 md:px-3.5 md:py-1.5 rounded-full border border-slate-200/60 font-mono shadow-sm group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-all duration-300">
                                                {stats.total} Listări
                                            </span>
                                        </div>
                                        
                                        <h4 className="text-sm md:text-lg font-bold text-slate-800 mb-2 md:mb-4 group-hover:text-indigo-600 transition-colors duration-300">{type}</h4>
                                        
                                        <div className="space-y-2 text-xs">
                                            <div className="flex justify-between items-center py-1 md:py-1.5 border-b border-slate-100">
                                                <span className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs font-semibold text-slate-500">
                                                    <span className="w-2 md:w-2.5 h-2 md:h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/30" />
                                                    De Vânzare
                                                </span>
                                                <span className="text-slate-900 font-bold text-xs md:text-sm font-mono">{stats.sale}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-1 md:py-1.5">
                                                <span className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs font-semibold text-slate-500">
                                                    <span className="w-2 md:w-2.5 h-2 md:h-2.5 rounded-full bg-purple-500 shadow-sm shadow-purple-500/30" />
                                                    De Închiriat
                                                </span>
                                                <span className="text-slate-900 font-bold text-xs md:text-sm font-mono">{stats.rent}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-3 md:mt-5 pt-2 md:pt-3 border-t border-slate-100">
                                        {/* Split progress bar */}
                                        <div className="w-full h-2.5 md:h-3.5 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200/50 shadow-inner p-[1px] md:p-[2px]">
                                            {stats.total > 0 ? (
                                                <>
                                                    {stats.sale > 0 && (
                                                        <div 
                                                            className="bg-gradient-to-r from-blue-600 to-blue-400 h-full rounded-l-full transition-all" 
                                                            style={{ width: `${salePercent}%` }}
                                                            title={`${stats.sale} de vânzare (${salePercent.toFixed(0)}%)`}
                                                        />
                                                    )}
                                                    {stats.rent > 0 && (
                                                        <div 
                                                            className="bg-gradient-to-r from-purple-600 to-purple-400 h-full rounded-r-full transition-all" 
                                                            style={{ width: `${rentPercent}%` }}
                                                            title={`${stats.rent} de închiriat (${rentPercent.toFixed(0)}%)`}
                                                        />
                                                    )}
                                                </>
                                            ) : (
                                                <div className="w-full h-full bg-slate-100 rounded-full" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Active Leads Counter Card */}
                    <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 text-white rounded-3xl p-8 border border-orange-400/30 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden mt-12 transition-all duration-300 hover:shadow-orange-500/10 hover:-translate-y-1 group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="flex-1 space-y-3 relative z-10 text-center md:text-left">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/15 text-white border border-white/20 uppercase tracking-wider">
                                <Users className="w-3.5 h-3.5 text-white animate-pulse" />
                                Monitorizare Live
                            </span>
                            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight">
                                Câți clienți caută ACTIV în piață acum !
                            </h2>
                            <p className="text-orange-50 text-sm max-w-xl leading-relaxed">
                                Cumpărători și chiriași verificați, cu bugete active, care caută proprietăți.
                            </p>
                        </div>
                        <div className="bg-slate-950/40 border border-white/10 rounded-2xl px-8 py-5 flex flex-col items-center justify-center min-w-[160px] text-center relative z-10 shadow-inner group-hover:scale-105 transition-transform duration-300">
                            <span className="text-5xl font-mono font-extrabold text-white tracking-tight leading-none animate-pulse">
                                {leadsCount || 63}
                            </span>
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-orange-200 mt-2 font-mono">Clienți Activi</span>
                        </div>
                    </div>

                    {/* Onboarding Incentive Banner at the bottom */}
                    <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-950 text-white rounded-3xl p-8 lg:p-12 border border-indigo-700 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden mt-6">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20" />
                        
                        <div className="flex-1 space-y-4 relative z-10 text-center lg:text-left">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
                                <Key className="w-3.5 h-3.5 text-indigo-400" />
                                Catalog Privat MLS
                            </span>
                            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight">
                                Deblochează Catalogul MLS Imobum
                            </h2>
                            <p className="text-indigo-200 text-sm max-w-2xl leading-relaxed">
                                Creează-ți un cont gratuit în câteva secunde pentru a debloca complet pozele la rezoluție maximă, adresele exacte ale proprietăților, tururile virtuale 3D și instrumentele de comunicare directă cu agenții sau proprietarii, dupa cum preferi tu.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0 relative z-10 w-full lg:w-auto">
                            <Link 
                                href="/auth/signup" 
                                className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-slate-100 text-indigo-900 font-bold rounded-xl shadow-lg transition-all text-center text-sm uppercase tracking-wider"
                            >
                                Creează Cont
                            </Link>
                            <Link 
                                href="/auth/login" 
                                className="w-full sm:w-auto px-8 py-3.5 bg-indigo-950/40 hover:bg-indigo-950/60 text-white font-bold rounded-xl transition-all border border-indigo-500/40 text-center text-sm uppercase tracking-wider"
                            >
                                Conectează-te
                            </Link>
                        </div>
                    </div>

                    {/* Owners & Developers Insights Card */}
                    <div className="bg-gradient-to-br from-violet-800 via-purple-800 to-indigo-950 border border-purple-500/20 text-white rounded-3xl p-8 lg:p-12 shadow-2xl relative overflow-hidden mt-6 transition-all duration-300 hover:shadow-indigo-500/20 hover:-translate-y-0.5 group">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />

                        <div className="relative z-10 space-y-6">
                            <div className="space-y-3">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white border border-white/30 uppercase tracking-widest">
                                    <Target className="w-3.5 h-3.5 text-white" />
                                    Pentru Proprietari și Dezvoltatori
                                </span>
                                <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight text-white">
                                    Află rapid care este prețul de piață al Proprietății tale și găsește-i un client imediat !
                                </h3>
                                <p className="text-indigo-100 text-sm font-semibold leading-relaxed">
                                    Intră în contact direct cu Clienții interesați ACTIV acum.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                <div className="bg-white/10 backdrop-blur-md border border-white/10 p-5 rounded-2xl space-y-2 hover:bg-white/15 transition-colors">
                                    <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white mb-2">
                                        <TrendingUp className="w-4 h-4" />
                                    </span>
                                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">Evaluare Reală de Piață</h4>
                                    <p className="text-xs text-white/90 leading-relaxed">
                                        Vezi prețul real al proprietății tale
                                        <span className="block mt-1">+ Ce alte proprietăți similare se vând sau se închiriază acum</span>
                                        <span className="block mt-1">+ Câți clienți caută și cate proprietăți similare există și pe ce loc este proprietatea ta în această listă.</span>
                                    </p>
                                </div>

                                <div className="bg-white/10 backdrop-blur-md border border-white/10 p-5 rounded-2xl space-y-2 hover:bg-white/15 transition-colors">
                                    <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white mb-2">
                                        <Clock className="w-4 h-4" />
                                    </span>
                                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">Predictibilitate de Vânzare</h4>
                                    <p className="text-xs text-white/90 leading-relaxed">
                                        În cât Timp vei vinde la prețul dorit și care sunt șansele tale reale în funcție de câți clienți caută ce vinzi tu
                                        <span className="block mt-1">+ Cum poti vinde în timpul dorit de tine: 1 săptămână, 1 lună, 3 luni.</span>
                                    </p>
                                </div>
                            </div>

                            {/* New Report Generator Button */}
                            <div className="pt-4 flex justify-center w-full">
                                <Link 
                                    href="/auth/signup"
                                    className="w-full md:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-xl shadow-lg transition-all text-center text-sm uppercase tracking-wider transform hover:-translate-y-0.5"
                                >
                                    Genereaza un raport de piata Complet pentru proprietatea care te intereseaza
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Bulk check for "Make an Offer" feature for all property owners
    const ownerIds = Array.from(new Set(properties.map(p => p.owner_id).filter(Boolean)));
    const makeOfferAccessMap = await bulkCheckUserFeatureAccess(ownerIds, SYSTEM_FEATURES.MAKE_AN_OFFER);

    const currentPerPage = Math.min(parseInt(filters?.per_page) || 15, 50);
    const currentPage = Math.max(parseInt(filters?.page) || 1, 1);
    const totalPages = Math.ceil(totalCount / currentPerPage);

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <div className="py-4 mb-2">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-2xl md:text-3xl font-medium tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Properties for Sale & Rent
                    </h1>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <Suspense fallback={<div className="p-4 bg-white rounded-lg shadow-sm">Loading filters...</div>}>
                    <PropertySearchFilters />
                </Suspense>

                <PropertiesClientView
                    initialProperties={properties}
                    totalCount={totalCount}
                    makeOfferAccessMap={makeOfferAccessMap}
                    paginationParams={filters}
                >
                    {properties.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed">
                            <h3 className="text-xl font-bold text-slate-900 mb-2">No properties found</h3>
                            <p className="text-slate-500">Try adjusting your filters to see more results.</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {properties.map((property: any) => (
                                    <PropertyCard
                                        key={property.id}
                                        property={property}
                                    />
                                ))}
                            </div>
                            <Pagination currentPage={currentPage} totalPages={totalPages} />
                        </>
                    )}
                </PropertiesClientView>
            </div>
        </div>
    );
}
