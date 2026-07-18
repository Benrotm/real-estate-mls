'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Search, MapPin, Map, Loader2, Sparkles, Edit2, X, Save } from 'lucide-react';
import { addSystemLocation, deleteSystemLocation, updateSystemLocation } from '@/app/lib/actions/admin-settings';
import { toast } from 'react-hot-toast';
import LocationMap from '@/app/components/LocationMap';

interface LocationItem {
    id: string;
    name: string;
    type?: 'city' | 'area';
    parent_id?: string | null;
    latitude?: number | null;
    longitude?: number | null;
}

interface Props {
    initialCities: LocationItem[];
    initialAreas: LocationItem[];
}

const DEFAULT_LAT = 45.75372;
const DEFAULT_LNG = 21.22571;

export default function LocationsSettingsClient({ initialCities, initialAreas }: Props) {
    const [activeTab, setActiveTab] = useState<'city' | 'area'>('city');
    const [cities, setCities] = useState<LocationItem[]>(initialCities);
    const [areas, setAreas] = useState<LocationItem[]>(initialAreas);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Add State
    const [newLocationName, setNewLocationName] = useState('');
    const [newLocationParentId, setNewLocationParentId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Edit Modal State
    const [editingItem, setEditingItem] = useState<LocationItem | null>(null);
    const [editName, setEditName] = useState('');
    const [editParentId, setEditParentId] = useState('');
    const [editLat, setEditLat] = useState<number>(DEFAULT_LAT);
    const [editLng, setEditLng] = useState<number>(DEFAULT_LNG);
    const [isUpdating, setIsUpdating] = useState(false);

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
            const res = await addSystemLocation(
                activeTab, 
                trimmedName, 
                activeTab === 'area' ? newLocationParentId || null : null,
                activeTab === 'city' ? DEFAULT_LAT : null,
                activeTab === 'city' ? DEFAULT_LNG : null
            );
            if (res.success && res.data) {
                const newItem: LocationItem = { 
                    id: res.data.id, 
                    name: res.data.name,
                    type: res.data.type,
                    parent_id: res.data.parent_id,
                    latitude: res.data.latitude,
                    longitude: res.data.longitude
                };
                if (activeTab === 'city') {
                    setCities(prev => [...prev, newItem].sort((a, b) => a.name.localeCompare(b.name, 'ro')));
                } else {
                    setAreas(prev => [...prev, newItem].sort((a, b) => a.name.localeCompare(b.name, 'ro')));
                }
                setNewLocationName('');
                setNewLocationParentId('');
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

    const handleDeleteLocation = async (id: string, name: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Avoid opening edit modal
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

    // Open Edit Modal
    const openEditModal = (item: LocationItem) => {
        setEditingItem(item);
        setEditName(item.name);
        setEditParentId(item.parent_id || '');
        setEditLat(Number(item.latitude) || DEFAULT_LAT);
        setEditLng(Number(item.longitude) || DEFAULT_LNG);
    };

    const handleUpdateLocation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem) return;

        setIsUpdating(true);
        try {
            const res = await updateSystemLocation(editingItem.id, {
                name: editName,
                parent_id: activeTab === 'area' ? editParentId || null : null,
                latitude: editLat,
                longitude: editLng
            });

            if (res.success && res.data) {
                const updatedItem: LocationItem = {
                    id: res.data.id,
                    name: res.data.name,
                    type: res.data.type,
                    parent_id: res.data.parent_id,
                    latitude: res.data.latitude,
                    longitude: res.data.longitude
                };

                if (activeTab === 'city') {
                    setCities(prev => prev.map(item => item.id === editingItem.id ? updatedItem : item).sort((a, b) => a.name.localeCompare(b.name, 'ro')));
                } else {
                    setAreas(prev => prev.map(item => item.id === editingItem.id ? updatedItem : item).sort((a, b) => a.name.localeCompare(b.name, 'ro')));
                }

                toast.success('Location updated successfully!');
                setEditingItem(null);
            } else {
                toast.error(res.error || 'Failed to update location.');
            }
        } catch (err) {
            console.error('Failed to update location', err);
            toast.error('An unexpected error occurred.');
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Tab Swapping Header */}
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="flex bg-slate-900 p-1.5 rounded-xl border border-slate-800/80">
                    <button
                        onClick={() => {
                            setActiveTab('city');
                            setSearchQuery('');
                        }}
                        className={`flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                            activeTab === 'city'
                                ? 'bg-orange-50 text-white shadow-md'
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
                <form onSubmit={handleAddLocation} className="flex flex-wrap gap-2 items-center">
                    {activeTab === 'area' && (
                        <select
                            value={newLocationParentId}
                            onChange={(e) => setNewLocationParentId(e.target.value)}
                            required
                            className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none text-white focus:border-orange-500/50 w-52 cursor-pointer"
                        >
                            <option value="">Select Parent City... *</option>
                            {cities.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    )}
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
                    {filteredList.map((item) => {
                        const parentCityName = item.parent_id 
                            ? cities.find(c => c.id === item.parent_id)?.name 
                            : null;

                        return (
                            <div
                                key={item.id}
                                onClick={() => openEditModal(item)}
                                className="flex items-center justify-between p-3.5 bg-slate-900/60 border border-slate-800/80 hover:border-orange-500/30 rounded-xl transition-all group cursor-pointer hover:bg-slate-900"
                            >
                                <div className="flex flex-col min-w-0 pr-2">
                                    <span className="text-sm font-bold text-slate-200 truncate group-hover:text-orange-400 transition-colors">
                                        {item.name}
                                    </span>
                                    {parentCityName && (
                                        <span className="text-[10px] text-slate-500 font-medium">
                                            linked to {parentCityName}
                                        </span>
                                    )}
                                    {item.latitude && item.longitude ? (
                                        <span className="text-[10px] text-emerald-500 font-semibold mt-0.5">
                                            📍 Coords Set
                                        </span>
                                    ) : (
                                        <span className="text-[10px] text-rose-500/70 font-semibold mt-0.5">
                                            ⚠️ No Coords
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        className="text-slate-500 hover:text-orange-400 p-1 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                        title="Edit coordinates & details"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        disabled={deletingId === item.id}
                                        onClick={(e) => handleDeleteLocation(item.id, item.name, e)}
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
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-16 border border-dashed border-slate-800 rounded-2xl bg-slate-900/20 text-center">
                    <Sparkles className="w-10 h-10 text-slate-600 mb-3" />
                    <p className="text-sm text-slate-400 font-semibold">No locations found</p>
                    <p className="text-xs text-slate-600 mt-1">Try refining your search or add a new location above.</p>
                </div>
            )}

            {/* Edit details modal dialog */}
            {editingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Edit2 className="w-5 h-5 text-orange-500" />
                                Edit {activeTab === 'city' ? 'City' : 'Area'} Details
                            </h3>
                            <button
                                type="button"
                                onClick={() => setEditingItem(null)}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={handleUpdateLocation} className="flex flex-col overflow-y-auto">
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                                        Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-orange-500/50 text-white"
                                    />
                                </div>

                                {activeTab === 'area' && (
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                                            Parent City
                                        </label>
                                        <select
                                            value={editParentId}
                                            onChange={(e) => setEditParentId(e.target.value)}
                                            required
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none text-white focus:border-orange-500/50 cursor-pointer"
                                        >
                                            <option value="">Select Parent City... *</option>
                                            {cities.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                                            Latitude
                                        </label>
                                        <input
                                            type="number"
                                            step="0.000001"
                                            required
                                            value={editLat}
                                            onChange={(e) => setEditLat(Number(e.target.value))}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-orange-500/50 text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                                            Longitude
                                        </label>
                                        <input
                                            type="number"
                                            step="0.000001"
                                            required
                                            value={editLng}
                                            onChange={(e) => setEditLng(Number(e.target.value))}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-orange-500/50 text-white"
                                        />
                                    </div>
                                </div>

                                <div className="border border-slate-800 rounded-xl overflow-hidden">
                                    <div className="bg-slate-950 px-4 py-2 text-xs font-bold text-slate-400 border-b border-slate-800">
                                        Drag Pin to Location / Click Map to Update Coordinates
                                    </div>
                                    <LocationMap
                                        lat={editLat}
                                        lng={editLng}
                                        onLocationSelect={(lat, lng) => {
                                            setEditLat(Number(lat.toFixed(6)));
                                            setEditLng(Number(lng.toFixed(6)));
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex justify-end gap-3 px-6 py-4 bg-slate-950 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setEditingItem(null)}
                                    className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isUpdating}
                                    className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-extrabold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-lg shadow-orange-500/10 disabled:opacity-50"
                                >
                                    {isUpdating ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4" />
                                    )}
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
