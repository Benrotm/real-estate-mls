'use client';

import { useState } from 'react';
import { Search, Trash2, ExternalLink, ChevronDown, ChevronUp, Calendar, Clock } from 'lucide-react';
import Link from 'next/link';

interface SavedSearchCardProps {
    search: {
        id: string;
        name: string;
        created_at: string;
        last_run_at?: string;
        query_params: any;
    };
    onDelete: (id: string) => void;
}

export default function SavedSearchCard({ search, onDelete }: SavedSearchCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this saved search?')) return;
        setIsDeleting(true);
        await onDelete(search.id);
        setIsDeleting(false);
    };

    // Helper to format filter display
    const getFilterBadges = () => {
        const filters = search.query_params || {};
        const badges = [];

        if (filters.minPrice || filters.maxPrice) {
            badges.push(`Price: ${filters.minPrice ? '€' + filters.minPrice : '0'} - ${filters.maxPrice ? '€' + filters.maxPrice : 'Any'}`);
        }
        if (filters.location_city || filters.location_area) {
            badges.push(`${filters.location_city || ''} ${filters.location_area || ''}`.trim());
        }
        if (filters.rooms) badges.push(`${filters.rooms}+ Rooms`);
        if (filters.area) badges.push(`${filters.area}+ sqm`);

        // Add other key filters
        Object.entries(filters).forEach(([key, value]) => {
            if (['minPrice', 'maxPrice', 'location_city', 'location_area', 'rooms', 'area', 'features'].includes(key)) return;
            if (value && value !== 'false') {
                badges.push(`${key.replace(/_/g, ' ')}: ${value}`);
            }
        });

        // Add features
        if (filters.features && Array.isArray(filters.features)) {
            filters.features.forEach((f: string) => badges.push(f));
        }

        return badges;
    };

    const activeFilters = getFilterBadges();

    // Construct search URL
    const searchParams = new URLSearchParams();
    if (search.query_params) {
        Object.entries(search.query_params).forEach(([key, value]) => {
            if (key === 'features' && Array.isArray(value)) {
                value.forEach((v: any) => searchParams.append('features', v));
            } else {
                searchParams.set(key, String(value));
            }
        });
    }
    const searchUrl = `/properties?${searchParams.toString()}`;

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
            {/* Header Section */}
            <div className="p-5 border-b border-slate-100">
                <div className="flex gap-4">
                    {/* Icon Container - Replaces Property Image */}
                    <div className="w-16 h-16 rounded-xl flex-shrink-0 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
                        <Search className="w-8 h-8" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <h3 className="font-bold text-lg text-slate-900 truncate">{search.name}</h3>
                                <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>Created: {new Date(search.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>

                            {/* Actions Right */}
                            <div className="flex items-center gap-2">
                                <Link
                                    href={searchUrl}
                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Run Search"
                                >
                                    <ExternalLink className="w-5 h-5" />
                                </Link>
                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete Search"
                                >
                                    {isDeleting ? <span className="loading loading-spinner loading-xs"></span> : <Trash2 className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Recent Activity / Stats */}
                        <div className="flex items-center gap-4 mt-3">
                            {search.last_run_at && (
                                <span className="text-xs text-slate-500 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-full">
                                    <Clock className="w-3 h-3" /> Last run: {new Date(search.last_run_at).toLocaleDateString()}
                                </span>
                            )}
                            <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-full">
                                {activeFilters.length} Criteria
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Collapsible Criteria Section (Mimicking Offers/Inquiries) */}
            <div className="border-t border-slate-100">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full px-5 py-3 flex items-center justify-between text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                    <span className="flex items-center gap-2">
                        <span className="bg-slate-100 p-1 rounded-md"><Search className="w-3 h-3 text-slate-500" /></span>
                        Search Criteria
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {isExpanded && (
                    <div className="px-5 pb-5">
                        <div className="flex flex-wrap gap-2">
                            {activeFilters.length > 0 ? (
                                activeFilters.map((badge, idx) => (
                                    <span key={idx} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-md border border-blue-100">
                                        {badge}
                                    </span>
                                ))
                            ) : (
                                <span className="text-sm text-slate-400 italic">No specific filters set</span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
