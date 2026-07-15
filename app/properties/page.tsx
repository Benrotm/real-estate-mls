
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

        // Query active properties (type & listing_type only) to build in-memory cross matrix counts
        const { data: activeProps } = await supabase
            .from('properties')
            .select('type, listing_type')
            .eq('status', 'active');

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

        let saleTotal = 0;
        let rentTotal = 0;

        activeProps?.forEach((p: any) => {
            const t = p.type;
            const tx = p.listing_type;

            if (tx === 'For Sale') saleTotal++;
            else if (tx === 'For Rent') rentTotal++;

            const key = matrix[t] ? t : 'Other';
            if (tx === 'For Sale') matrix[key].sale++;
            else if (tx === 'For Rent') matrix[key].rent++;
            matrix[key].total++;
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
                            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                                MLS Market Insights & Inventory Overview
                            </h2>
                            <p className="text-xs font-bold text-slate-500 mt-0.5">Real-time inventory analysis of the active database</p>
                        </div>
                        <div className="mt-2 md:mt-0 text-[10px] uppercase font-black tracking-wider text-slate-400 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 w-fit">
                            Updated: Live
                        </div>
                    </div>

                    {/* Premium Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Current Search Results Indicator */}
                        <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 flex flex-col justify-between min-h-[300px] lg:min-h-0 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl" />
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">Căutare Activă</span>
                                <Search className="w-4 h-4 text-blue-400" />
                            </div>
                            <div className="my-6">
                                <div className="text-5xl font-black tracking-tight text-white glow-blue leading-none">{totalCount}</div>
                                <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-wide">Proprietăți identificate</p>
                            </div>
                            <div className="text-[11px] leading-relaxed text-slate-300 bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
                                Criteriile tale de căutare au returnat <strong>{totalCount}</strong> rezultate active în platformă. Înregistrează-te pentru a accesa adresele exacte și a lua legătura cu agenții.
                            </div>
                        </div>

                        {/* Detailed Inventory Matrix Card */}
                        <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 lg:col-span-2 space-y-5">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Distribuție pe Categorii & Tranzacții</h3>
                                <div className="flex gap-4 text-[10px] font-bold">
                                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /> De Vânzare ({saleTotal})</span>
                                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-500" /> De Închiriat ({rentTotal})</span>
                                </div>
                            </div>
                            
                            <div className="divide-y divide-slate-800/60 space-y-4 pt-1">
                                {Object.entries(matrix).map(([type, stats]) => {
                                    const salePercent = stats.total > 0 ? (stats.sale / stats.total) * 100 : 0;
                                    const rentPercent = stats.total > 0 ? (stats.rent / stats.total) * 100 : 0;
                                    
                                    return (
                                        <div key={type} className="pt-4 first:pt-0 flex flex-col space-y-2">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="font-extrabold text-slate-200">{type}</span>
                                                <span className="text-slate-400 text-[11px] font-bold">
                                                    Total: <strong className="text-white font-mono">{stats.total}</strong> ({stats.sale} vânzare • {stats.rent} chirie)
                                                </span>
                                            </div>
                                            
                                            {/* Split progress bar */}
                                            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex border border-slate-950">
                                                {stats.total > 0 ? (
                                                    <>
                                                        {stats.sale > 0 && (
                                                            <div 
                                                                className="bg-gradient-to-r from-blue-600 to-blue-400 h-full transition-all" 
                                                                style={{ width: `${salePercent}%` }}
                                                                title={`${stats.sale} de vânzare (${salePercent.toFixed(0)}%)`}
                                                            />
                                                        )}
                                                        {stats.rent > 0 && (
                                                            <div 
                                                                className="bg-gradient-to-r from-purple-600 to-purple-400 h-full transition-all" 
                                                                style={{ width: `${rentPercent}%` }}
                                                                title={`${stats.rent} de închiriat (${rentPercent.toFixed(0)}%)`}
                                                            />
                                                        )}
                                                    </>
                                                ) : (
                                                    <div className="w-full h-full bg-slate-850" />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Onboarding Incentive Banner at the bottom */}
                    <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-950 text-white rounded-3xl p-8 lg:p-12 border border-indigo-700 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden mt-12">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20" />
                        
                        <div className="flex-1 space-y-4 relative z-10 text-center lg:text-left">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
                                <Key className="w-3.5 h-3.5 text-indigo-400" />
                                Catalog Privat MLS
                            </span>
                            <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
                                Deblochează Catalogul MLS Imobum
                            </h2>
                            <p className="text-indigo-200 text-sm max-w-2xl leading-relaxed">
                                Creează-ți un cont gratuit în câteva secunde pentru a debloca complet pozele la rezoluție maximă, adresele exacte ale proprietăților, tururile virtuale 3D și instrumentele de comunicare directă cu agenții și proprietarii.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0 relative z-10 w-full lg:w-auto">
                            <Link 
                                href="/auth/signup" 
                                className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-slate-100 text-indigo-900 font-extrabold rounded-xl shadow-lg transition-all text-center text-sm uppercase tracking-wider"
                            >
                                Creează Cont
                            </Link>
                            <Link 
                                href="/auth/login" 
                                className="w-full sm:w-auto px-8 py-3.5 bg-indigo-950/40 hover:bg-indigo-950/60 text-white font-extrabold rounded-xl transition-all border border-indigo-500/40 text-center text-sm uppercase tracking-wider"
                            >
                                Conectează-te
                            </Link>
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
