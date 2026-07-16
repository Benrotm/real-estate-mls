'use client';

import { useState } from 'react';
import { Search, Trash2, Edit2, Check, X, ExternalLink, ChevronDown, ChevronUp, Calendar, Clock, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { updateSavedSearch } from '@/app/lib/actions/savedSearches';
import { useRouter } from 'next/navigation';

interface SavedSearchCardProps {
    search: {
        id: string;
        name: string;
        created_at: string;
        last_run_at?: string;
        query_params: any;
    };
    onDelete: (id: string) => void;
    leadId?: string;
}

export default function SavedSearchCard({ search, onDelete, leadId }: SavedSearchCardProps) {
    const router = useRouter();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(search.name);
    const [isSavingName, setIsSavingName] = useState(false);

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this saved search?')) return;
        setIsDeleting(true);
        await onDelete(search.id);
        setIsDeleting(false);
    };

    const handleSaveName = async () => {
        if (!editName.trim()) return;
        setIsSavingName(true);
        try {
            const res = await updateSavedSearch(search.id, editName);
            if (res.success) {
                setIsEditing(false);
                router.refresh();
            } else {
                alert('Failed to update name: ' + res.error);
            }
        } catch (e: any) {
            alert('Failed to update name: ' + e.message);
        } finally {
            setIsSavingName(false);
        }
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
            if (['minPrice', 'maxPrice', 'location_city', 'location_area', 'rooms', 'area', 'features', 'location_polygon'].includes(key)) return;
            if (value && value !== 'false') {
                badges.push(`${key.replace(/_/g, ' ')}: ${value}`);
            }
        });

        // Add features
        if (filters.features && Array.isArray(filters.features)) {
            filters.features.forEach((f: string) => badges.push(f));
        }

        // Add polygon badge if present
        if (filters.location_polygon) {
            badges.push('Custom Map Area');
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
            } else if (typeof value === 'object' && value !== null) {
                // Correctly serialize objects/polygons to avoid [object Object] syntax error
                searchParams.set(key, JSON.stringify(value));
            } else {
                searchParams.set(key, String(value));
            }
        });
    }
    const searchUrl = `/properties?${searchParams.toString()}`;

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-shadow flex flex-col h-full">
            {/* Header Section */}
            <div className="p-5 flex-1">
                <div className="flex gap-4">
                    {/* Icon Container */}
                    <div className="w-12 h-12 rounded-xl flex-shrink-0 bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-md">
                        <Search className="w-6 h-6" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        {isEditing ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="flex-1 px-3 py-1 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500"
                                    disabled={isSavingName}
                                    autoFocus
                                />
                                <button
                                    onClick={handleSaveName}
                                    disabled={isSavingName}
                                    className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors border border-green-200"
                                    title="Save name"
                                >
                                    <Check className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => { setIsEditing(false); setEditName(search.name); }}
                                    disabled={isSavingName}
                                    className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
                                    title="Cancel"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between gap-2">
                                <h3 className="font-bold text-base text-slate-900 truncate" title={search.name}>
                                    {search.name}
                                </h3>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors shrink-0"
                                    title="Edit name"
                                >
                                    <Edit2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1.5">
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                {new Date(search.created_at).toLocaleDateString()}
                            </span>
                            {search.last_run_at && (
                                <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                                    <Clock className="w-3 h-3 text-slate-400" /> Run: {new Date(search.last_run_at).toLocaleDateString()}
                                </span>
                            )}
                            <span className="font-bold text-indigo-600 bg-indigo-50/50 px-2 py-0.5 rounded-full border border-indigo-100">
                                {activeFilters.length} Criteria
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions Bar */}
            <div className="px-5 pb-5 pt-1 flex items-center justify-between gap-3 border-b border-slate-100">
                <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-3 py-2 text-slate-500 hover:text-red-650 hover:bg-red-50 rounded-xl transition-all border border-slate-200 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 shrink-0"
                    title="Delete Search"
                >
                    {isDeleting ? (
                        <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                        <>
                            <Trash2 className="w-4 h-4 text-slate-400 group-hover:text-red-500" />
                            Șterge
                        </>
                    )}
                </button>

                {leadId ? (
                    <Link
                        href={`/dashboard/agent/leads/${leadId}/matches`}
                        className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl text-xs font-bold hover:shadow-lg hover:shadow-indigo-600/10 transition-all flex items-center gap-1.5 active:scale-95 shrink-0"
                    >
                        <Sparkles className="w-4 h-4" />
                        See Search Results
                    </Link>
                ) : (
                    <Link
                        href={searchUrl}
                        className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all flex items-center gap-1.5 active:scale-95 shrink-0"
                    >
                        <ExternalLink className="w-4 h-4" />
                        See Search Results
                    </Link>
                )}
            </div>

            {/* Collapsible Criteria Section */}
            <div className="border-t border-slate-100">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full px-5 py-3 flex items-center justify-between text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
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
