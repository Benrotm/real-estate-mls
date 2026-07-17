'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Search, MapPin, Map, Loader2, Sparkles } from 'lucide-react';
import { addSystemLocation, deleteSystemLocation } from '@/app/lib/actions/admin-settings';
import { toast } from 'react-hot-toast';

interface LocationItem {
    id: string;
    name: string;
}

interface Props {
    initialCities: LocationItem[];
    initialAreas: LocationItem[];
}

export default function LocationsSettingsClient({ initialCities, initialAreas }: Props) {
    const [activeTab, setActiveTab] = useState<'city' | 'area'>('city');
    const [cities, setCities] = useState<LocationItem[]>(initialCities);
    const [areas, setAreas] = useState<LocationItem[]>(initialAreas);
    const [searchQuery, setSearchQuery] = useState('');
    const [newLocationName, setNewLocationName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Get current list based on tab
    const currentList = activeTab === 'city' ? cities : areas;

    // Filter current list based on search query
    const filteredList = currentList.filter(item =>
        item.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );

    const handleAddLocation = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = newLocationName.trim();
        if (!trimmedName) return;

        // Check duplicates locally first
        const isDuplicate = currentList.some(
            item => item.name.toLowerCase() === trimmedName.toLowerCase()
        );
        if (isDuplicate) {
            toast.error(`"${trimmedName}" already exists in the list!`);
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await addSystemLocation(activeTab, trimmedName);
            if (res.success && res.data) {
                const newItem: LocationItem = { id: res.data.id, name: res.data.name };
                if (activeTab === 'city') {
                    setCities(prev => [...prev, newItem].sort((a, b) => a.name.localeCompare(b.name, 'ro')));
                } else {
                    setAreas(prev => [...prev, newItem].sort((a, b) => a.name.localeCompare(b.name, 'ro')));
                }
                setNewLocationName('');
                toast.success('Location added successfully!');
            } else {
                toast.error(res.error || 'Failed to add location.');
            }
        } catch (err) {
            console.error('Failed to add location', err);
            toast.error('An unexpected error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteLocation = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}" from the system lists?`)) return;

        setDeletingId(id);
        try {
            const res = await deleteSystemLocation(id);
            if (res.success) {
                if (activeTab === 'city') {
                    setCities(prev => prev.filter(item => item.id !== id));
                } else {
                    setAreas(prev => prev.filter(item => item.id !== id));
                }
                toast.success('Location removed successfully!');
            } else {
                toast.error(res.error || 'Failed to delete location.');
            }
        } catch (err) {
            console.error('Failed to delete location', err);
            toast.error('An unexpected error occurred.');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Tab Swapping Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="flex bg-slate-900 p-1.5 rounded-xl border border-slate-800/80">
                    <button
                        onClick={() => {
                            setActiveTab('city');
                            setSearchQuery('');
                        }}
                        className={`flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                            activeTab === 'city'
                                ? 'bg-orange-500 text-white shadow-md'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <MapPin className="w-4 h-4" />
                        Cities & Communes ({cities.length})
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('area');
                            setSearchQuery('');
                        }}
                        className={`flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                            activeTab === 'area'
                                ? 'bg-orange-500 text-white shadow-md'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <Map className="w-4 h-4" />
                        Areas & Neighbourhoods ({areas.length})
                    </button>
                </div>

                {/* Inline Add form */}
                <form onSubmit={handleAddLocation} className="flex gap-2">
                    <input
                        type="text"
                        required
                        value={newLocationName}
                        onChange={(e) => setNewLocationName(e.target.value)}
                        placeholder={`Add new ${activeTab === 'city' ? 'city...' : 'area...'}`}
                        className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-orange-500/50 text-white placeholder-slate-500 w-64"
                    />
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-extrabold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-lg shadow-orange-500/10 disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Plus className="w-4 h-4" />
                        )}
                        Add
                    </button>
                </form>
            </div>

            {/* Filter Search Input */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search ${activeTab === 'city' ? 'cities' : 'areas'} list...`}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-sm font-semibold outline-none focus:border-orange-500/50 text-white placeholder-slate-500"
                />
            </div>

            {/* Main items grid */}
            {filteredList.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {filteredList.map((item) => (
                        <div
                            key={item.id}
                            className="flex items-center justify-between p-3.5 bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/60 rounded-xl transition-all group"
                        >
                            <span className="text-sm font-bold text-slate-200 truncate pr-2">
                                {item.name}
                            </span>
                            <button
                                type="button"
                                disabled={deletingId === item.id}
                                onClick={() => handleDeleteLocation(item.id, item.name)}
                                className="text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 p-1.5 rounded-lg transition-all active:scale-90 opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-50"
                                title={`Delete ${item.name}`}
                            >
                                {deletingId === item.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Trash2 className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-16 border border-dashed border-slate-800 rounded-2xl bg-slate-900/20 text-center">
                    <Sparkles className="w-10 h-10 text-slate-600 mb-3" />
                    <p className="text-sm text-slate-400 font-semibold">No locations found</p>
                    <p className="text-xs text-slate-600 mt-1">Try refining your search or add a new location above.</p>
                </div>
            )}
        </div>
    );
}
