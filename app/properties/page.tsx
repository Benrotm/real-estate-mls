
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
import { ShieldAlert, Key, Search, BarChart3, Building2, CheckCircle2 } from 'lucide-react';

export default async function PropertiesPage({ searchParams }: { searchParams: Promise<any> }) {
    const filters = await searchParams;
    const { properties, totalCount } = await getProperties(filters);

    const profile = await getUserProfile();
    const adminSettings = await getAdminSettings();

    // If properties page is private and user is not logged in, display visitor dashboard
    if (adminSettings.properties_page_public === false && !profile) {
        const supabase = await createClient();

        // Concurrently query counts by property type
        const typeCounts = await Promise.all(
            ['Apartment', 'House', 'Commercial', 'Industrial', 'Land', 'Business', 'Other'].map(async (t) => {
                const { count } = await supabase
                    .from('properties')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'active')
                    .eq('type', t);
                return { type: t, count: count || 0 };
            })
        );

        // Concurrently query counts by transaction type
        const transactionCounts = await Promise.all(
            ['For Sale', 'For Rent', 'Hotel Regime'].map(async (tx) => {
                const { count } = await supabase
                    .from('properties')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'active')
                    .eq('listing_type', tx);
                return { transaction: tx, count: count || 0 };
            })
        );

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

                    {/* Incentive Main Card */}
                    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white rounded-3xl p-8 lg:p-12 border border-slate-700 shadow-2xl flex flex-col lg:flex-row items-center gap-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
                        
                        <div className="flex-1 space-y-6 relative z-10 text-center lg:text-left">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                                <Key className="w-3.5 h-3.5" />
                                Catalog Securizat
                            </span>
                            <h2 className="text-2xl md:text-4xl font-black tracking-tight leading-tight">
                                Deblochează Catalogul MLS Imobum
                            </h2>
                            <p className="text-slate-300 text-sm md:text-base max-w-xl leading-relaxed">
                                Pentru a proteja datele noastre exclusiviste și proprietarii platformei, catalogul complet de proprietăți este accesibil doar utilizatorilor înregistrați. 
                            </p>
                            <p className="text-slate-400 text-xs md:text-sm max-w-xl">
                                Creează-ți un cont gratuit în câteva secunde pentru a vizualiza listările complete, fotografii de înaltă rezoluție, tururi virtuale 3D și pentru a contacta proprietarii.
                            </p>
                            
                            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                                <Link 
                                    href="/auth/signup" 
                                    className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition-all text-center text-sm"
                                >
                                    Creează Cont Gratuit
                                </Link>
                                <Link 
                                    href="/auth/login" 
                                    className="w-full sm:w-auto px-8 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition-all border border-slate-705 text-center text-sm"
                                >
                                    Conectează-te
                                </Link>
                            </div>
                        </div>

                        <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center border border-indigo-500/20 text-indigo-400 shrink-0">
                            <ShieldAlert className="w-10 h-10" />
                        </div>
                    </div>

                    {/* Stats Dashboard */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Dynamic Count Card */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                                    <Search className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-slate-800 text-sm">Filtre Selectate</h3>
                            </div>
                            <div className="py-2">
                                <div className="text-4xl font-black text-slate-900">{totalCount}</div>
                                <p className="text-slate-500 text-xs font-bold mt-1">Proprietăți corespund criteriilor selectate</p>
                            </div>
                            <div className="text-xs text-slate-400 font-semibold bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-start gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                                <span>Căutarea ta este activă! Înregistrează-te pentru a vizualiza aceste proprietăți.</span>
                            </div>
                        </div>

                        {/* Types Card */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                                    <Building2 className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-slate-800 text-sm">Disponibile după Tip</h3>
                            </div>
                            <div className="space-y-2 overflow-y-auto max-h-[140px] pr-1">
                                {typeCounts.map((tc) => (
                                    <div key={tc.type} className="flex justify-between items-center text-xs text-slate-600">
                                        <span className="font-bold">{tc.type}</span>
                                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-bold">{tc.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Transactions Card */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                                    <BarChart3 className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-slate-800 text-sm">Disponibile după Tranzacție</h3>
                            </div>
                            <div className="space-y-2">
                                {transactionCounts.map((txc) => (
                                    <div key={txc.transaction} className="flex justify-between items-center text-xs text-slate-600">
                                        <span className="font-bold">{txc.transaction}</span>
                                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-bold">{txc.count}</span>
                                    </div>
                                ))}
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
