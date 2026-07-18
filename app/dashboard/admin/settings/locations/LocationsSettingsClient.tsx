'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Search, MapPin, Map, Loader2, Sparkles, Edit2, X, Save, Globe, Check } from 'lucide-react';
import { addSystemLocation, deleteSystemLocation, updateSystemLocation, batchAddSystemLocations } from '@/app/lib/actions/admin-settings';
import { toast } from 'react-hot-toast';
import LocationMap from '@/app/components/LocationMap';
import { useGoogleMaps } from '@/app/lib/hooks/useGoogleMaps';

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
    const [activeTab, setActiveTab] = useState<'city' | 'area' | 'auto-import'>('city');

    // Auto-Import States
    const [citySearchQuery, setCitySearchQuery] = useState('');
    const [citySearchResults, setCitySearchResults] = useState<any[]>([]);
    const [isSearchingCity, setIsSearchingCity] = useState(false);

    const [selectedScanCity, setSelectedScanCity] = useState('');
    const [scanResults, setScanResults] = useState<any[]>([]);
    const [selectedResults, setSelectedResults] = useState<string[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const { isLoaded } = useGoogleMaps();

    const handleGoogleCitySearch = () => {
        if (!citySearchQuery.trim()) return;
        if (!window.google) {
            toast.error("Google Maps script not loaded yet.");
            return;
        }
        setIsSearchingCity(true);
        setCitySearchResults([]);

        const service = new google.maps.places.PlacesService(document.createElement('div'));
        service.textSearch({ query: citySearchQuery }, (results, status) => {
            setIsSearchingCity(false);
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                const found = results.map(place => ({
                    name: place.name,
                    latitude: place.geometry?.location?.lat() || 0,
                    longitude: place.geometry?.location?.lng() || 0,
                    formatted_address: place.formatted_address || ''
                }));
                setCitySearchResults(found);
                toast.success(`Found ${found.length} results on Google.`);
            } else {
                toast.error("No locations found matching that query.");
            }
        });
    };

    const handleImportSingleCity = async (cityData: any) => {
        try {
            const res = await addSystemLocation(
                'city',
                cityData.name,
                null,
                cityData.latitude,
                cityData.longitude
            );
            if (res.success && res.data) {
                toast.success(`City "${cityData.name}" imported successfully!`);
                const newItem: LocationItem = {
                    id: res.data.id,
                    name: res.data.name,
                    type: 'city',
                    latitude: res.data.latitude,
                    longitude: res.data.longitude
                };
                setCities(prev => [...prev, newItem].sort((a, b) => a.name.localeCompare(b.name, 'ro')));
                setCitySearchResults(prev => prev.filter(c => c.name !== cityData.name));
            } else {
                toast.error(res.error || "Failed to import city.");
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to import city.");
        }
    };

    const handleGoogleScanAreas = () => {
        if (!selectedScanCity) {
            toast.error("Please select a city first.");
            return;
        }
        if (!window.google) {
            toast.error("Google Maps script not loaded yet.");
            return;
        }

        const cityObj = cities.find(c => c.id === selectedScanCity);
        if (!cityObj) return;

        setIsScanning(true);
        setScanResults([]);
        setSelectedResults([]);

        const service = new google.maps.places.PlacesService(document.createElement('div'));
        const queries = [
            `neighborhoods in ${cityObj.name}`,
            `cartiere in ${cityObj.name}`,
            `areas in ${cityObj.name}`
        ];

        let combinedResults: any[] = [];
        let completed = 0;

        queries.forEach(query => {
            service.textSearch({ query }, (results, status) => {
                completed++;
                if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                    results.forEach(place => {
                        if (place.name && place.geometry?.location) {
                            const name = place.name;
                            const lat = place.geometry.location.lat();
                            const lng = place.geometry.location.lng();
                            
                            if (!combinedResults.some(r => r.name.toLowerCase() === name.toLowerCase())) {
                                combinedResults.push({
                                    name,
                                    latitude: Number(lat.toFixed(6)),
                                    longitude: Number(lng.toFixed(6))
                                });
                            }
                        }
                    });
                }

                if (completed === queries.length) {
                    const filtered = combinedResults.filter(r => r.name.toLowerCase() !== cityObj.name.toLowerCase());
                    setScanResults(filtered);
                    setSelectedResults(filtered.map(r => r.name));
                    setIsScanning(false);
                    if (filtered.length === 0) {
                        toast.error(`No sublocalities or areas found for ${cityObj.name} on Google.`);
                    } else {
                        toast.success(`Found ${filtered.length} locations on Google for ${cityObj.name}!`);
                    }
                }
            });
        });
    };

    const handleImportSelectedAreas = async () => {
        if (selectedResults.length === 0) {
            toast.error("Please select at least one area to import.");
            return;
        }

        const cityObj = cities.find(c => c.id === selectedScanCity);
        if (!cityObj) return;

        setIsImporting(true);
        try {
            const itemsToImport = scanResults
                .filter(r => selectedResults.includes(r.name))
                .map(r => ({
                    type: 'area' as const,
                    name: r.name,
                    parent_id: cityObj.id,
                    latitude: r.latitude,
                    longitude: r.longitude
                }));

            const res = await batchAddSystemLocations(itemsToImport);
            if (res.success && res.data) {
                toast.success(`Successfully imported ${itemsToImport.length} areas into ${cityObj.name}!`);
                
                const newItems: LocationItem[] = res.data.map((d: any) => ({
                    id: d.id,
                    name: d.name,
                    type: 'area',
                    parent_id: d.parent_id,
                    latitude: d.latitude,
                    longitude: d.longitude
                }));

                setAreas(prev => [...prev, ...newItems].sort((a, b) => a.name.localeCompare(b.name, 'ro')));
                setScanResults([]);
                setSelectedResults([]);
            } else {
                toast.error(res.error || "Failed to batch import areas.");
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to import areas.");
        } finally {
            setIsImporting(false);
        }
    };
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
                activeTab === 'city' ? 'city' : 'area', 
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
                    <button
                        onClick={() => {
                            setActiveTab('auto-import');
                            setSearchQuery('');
                        }}
                        className={`flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                            activeTab === 'auto-import'
                                ? 'bg-orange-500 text-white shadow-md'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <Globe className="w-4 h-4" />
                        Auto-Import (Google)
                    </button>
                </div>

                {/* Inline Add form */}
                {activeTab !== 'auto-import' && (
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
                )}
            </div>

            {/* Filter Search Input */}
            {activeTab !== 'auto-import' && (
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
            )}

            {/* Main items grid */}
            {/* Main items grid */}
            {activeTab !== 'auto-import' ? (
                filteredList.length > 0 ? (
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
                )
            ) : (
                // Auto-Import Google Places Panel
                !isLoaded ? (
                    <div className="p-12 text-center bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl">
                        <Loader2 className="w-6 h-6 animate-spin text-orange-500 mx-auto mb-2" />
                        <p className="text-xs text-slate-400 font-semibold">Loading Google Places service...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-200">
                        {/* Left Column: Search & Add Cities */}
                        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 flex flex-col space-y-4">
                            <div className="flex items-center gap-2 text-white font-bold text-base border-b border-slate-800 pb-3">
                                <Globe className="w-5 h-5 text-orange-500" />
                                <h3>Search & Import Cities from Google</h3>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Search any city globally using Google Maps Places database. It resolves the coordinates automatically so you can import the city into your database with a single click.
                            </p>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={citySearchQuery}
                                    onChange={(e) => setCitySearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleGoogleCitySearch()}
                                    placeholder="Search City (e.g. Dubai, Bali, București...)"
                                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-orange-500/50 text-white placeholder-slate-600"
                                />
                                <button
                                    type="button"
                                    onClick={handleGoogleCitySearch}
                                    disabled={isSearchingCity || !citySearchQuery.trim()}
                                    className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-extrabold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50"
                                >
                                    {isSearchingCity ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                    Search
                                </button>
                            </div>

                            {/* Search Results list */}
                            <div className="flex-1 overflow-y-auto max-h-[400px] pr-1 space-y-2 mt-2">
                                {citySearchResults.map((city, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-700 transition-all">
                                        <div className="flex flex-col min-w-0 pr-2">
                                            <span className="text-sm font-bold text-slate-200 truncate">{city.name}</span>
                                            <span className="text-[10px] text-slate-500 truncate">{city.formatted_address}</span>
                                            <span className="text-[10px] text-orange-400 font-semibold mt-0.5">📍 Lat: {city.latitude.toFixed(4)}, Lng: {city.longitude.toFixed(4)}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleImportSingleCity(city)}
                                            className="bg-slate-900 border border-slate-800 hover:border-orange-500/30 text-white hover:text-orange-400 font-bold text-xs uppercase tracking-wider px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shrink-0"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            Import
                                        </button>
                                    </div>
                                ))}
                                {citySearchResults.length === 0 && !isSearchingCity && (
                                    <div className="text-center py-12 text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                                        Search for a city above to view results.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column: Scan & Batch Import Areas */}
                        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 flex flex-col space-y-4">
                            <div className="flex items-center gap-2 text-white font-bold text-base border-b border-slate-800 pb-3">
                                <Sparkles className="w-5 h-5 text-orange-500" />
                                <h3>Scan & Batch Import Areas / Neighbourhoods</h3>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Select an existing city from your list. Google Places will be queried to automatically discover all sub-locations, zones, or neighbourhoods with their coordinates.
                            </p>

                            <div className="flex gap-2">
                                <select
                                    value={selectedScanCity}
                                    onChange={(e) => {
                                        setSelectedScanCity(e.target.value);
                                        setScanResults([]);
                                    }}
                                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none text-white focus:border-orange-500/50 cursor-pointer"
                                >
                                    <option value="">Select a city to scan...</option>
                                    {cities.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={handleGoogleScanAreas}
                                    disabled={isScanning || !selectedScanCity}
                                    className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-extrabold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
                                >
                                    {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                    Scan Areas
                                </button>
                            </div>

                            {/* Checklist of Scan Results */}
                            {scanResults.length > 0 && (
                                <div className="flex flex-col flex-1 min-h-0 space-y-2 mt-2">
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-xs font-bold text-slate-400 uppercase">Found {scanResults.length} Areas</span>
                                        <div className="flex gap-3 text-xs">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedResults(scanResults.map(r => r.name))}
                                                className="text-orange-400 hover:text-orange-300 font-semibold underline"
                                            >
                                                Select All
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setSelectedResults([])}
                                                className="text-slate-500 hover:text-slate-400 font-semibold underline"
                                            >
                                                Deselect All
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto max-h-[350px] pr-1 space-y-2 border border-slate-850 p-2.5 rounded-xl bg-slate-950/50">
                                        {scanResults.map((area, idx) => {
                                            const isChecked = selectedResults.includes(area.name);
                                            const exists = areas.some(a => a.name.toLowerCase() === area.name.toLowerCase() && a.parent_id === selectedScanCity);

                                            return (
                                                <div
                                                    key={idx}
                                                    onClick={() => {
                                                        if (exists) return;
                                                        setSelectedResults(prev =>
                                                            isChecked ? prev.filter(n => n !== area.name) : [...prev, area.name]
                                                        );
                                                    }}
                                                    className={`flex items-center justify-between p-3 border rounded-xl transition-all ${
                                                        exists 
                                                            ? 'opacity-40 border-slate-850 bg-slate-950/20 cursor-not-allowed'
                                                            : 'border-slate-800 bg-slate-950 hover:border-slate-700 cursor-pointer'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3 min-w-0 pr-2">
                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                                                            isChecked ? 'bg-orange-500 border-orange-600 text-white' : 'border-slate-700 bg-slate-900'
                                                        }`}>
                                                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-sm font-bold text-slate-200 truncate">{area.name}</span>
                                                            <span className="text-[10px] text-orange-400/80 font-semibold">📍 Lat: {area.latitude.toFixed(4)}, Lng: {area.longitude.toFixed(4)}</span>
                                                        </div>
                                                    </div>
                                                    {exists && (
                                                        <span className="bg-slate-900 text-slate-500 border border-slate-800 text-[9px] font-black uppercase px-2 py-0.5 rounded shrink-0">
                                                            Already Saved
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleImportSelectedAreas}
                                        disabled={isImporting || selectedResults.length === 0}
                                        className="w-full bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-extrabold text-xs uppercase tracking-wider py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-lg shadow-orange-500/10 mt-2 shrink-0"
                                    >
                                        {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                        Import Selected ({selectedResults.length}) to Database
                                    </button>
                                </div>
                            )}

                            {scanResults.length === 0 && !isScanning && (
                                <div className="text-center py-12 text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                                    Select a city and click "Scan Areas" above to list and import neighbourhoods automatically.
                                </div>
                            )}
                        </div>
                    </div>
                )
            )}

            {/* Edit details modal dialog */}
            {/* Edit details modal dialog */}
            {editingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-800 rounded-none md:rounded-2xl w-full h-full md:max-w-[95vw] md:h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
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
                        <form onSubmit={handleUpdateLocation} className="flex-1 flex flex-col min-h-0 overflow-hidden">
                            <div className="p-6 flex flex-col gap-4 flex-1 min-h-0">
                                {/* Fields Row at the Top */}
                                <div className={`grid grid-cols-1 sm:grid-cols-${activeTab === 'area' ? '4' : '3'} gap-4 shrink-0`}>
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

                                {/* Full Width Map beneath the fields */}
                                <div className="border border-slate-800 rounded-xl overflow-hidden flex flex-col flex-1 min-h-[300px]">
                                    <div className="bg-slate-950 px-4 py-2 text-xs font-bold text-slate-400 border-b border-slate-800 shrink-0">
                                        Drag Pin to Location / Click Map to Update Coordinates
                                    </div>
                                    <div className="flex-1 relative w-full">
                                        <LocationMap
                                            lat={editLat}
                                            lng={editLng}
                                            height="100%"
                                            onLocationSelect={(lat, lng) => {
                                                setEditLat(Number(lat.toFixed(6)));
                                                setEditLng(Number(lng.toFixed(6)));
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex justify-end gap-3 px-6 py-4 bg-slate-950 border-t border-slate-800 shrink-0">
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
