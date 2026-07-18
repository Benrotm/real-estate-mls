'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Search, MapPin, Map, Loader2, Sparkles, Edit2, X, Save, Globe, Check, Info, HelpCircle } from 'lucide-react';
import { addSystemLocation, deleteSystemLocation, updateSystemLocation, batchAddSystemLocations, importRomaniaLocations } from '@/app/lib/actions/admin-settings';
import { toast } from 'react-hot-toast';
import LocationMap from '@/app/components/LocationMap';
import { useGoogleMaps } from '@/app/lib/hooks/useGoogleMaps';

interface LocationItem {
    id: string;
    name: string;
    type?: 'country' | 'county' | 'city' | 'area';
    parent_id?: string | null;
    latitude?: number | null;
    longitude?: number | null;
}

interface Props {
    initialCountries: LocationItem[];
    initialCounties: LocationItem[];
    initialCities: LocationItem[];
    initialAreas: LocationItem[];
}

const DEFAULT_LAT = 45.75372;
const DEFAULT_LNG = 21.22571;

export default function LocationsSettingsClient({ initialCountries, initialCounties, initialCities, initialAreas }: Props) {
    const [activeTab, setActiveTab] = useState<'country' | 'county' | 'city' | 'area' | 'auto-import'>('city');

    // Auto-Import States
    const [hierarchySearchQuery, setHierarchySearchQuery] = useState('');
    const [resolvedHierarchy, setResolvedHierarchy] = useState<any | null>(null);
    const [isResolving, setIsResolving] = useState(false);

    const [scanType, setScanType] = useState<'city' | 'area'>('area');
    const [selectedScanParentId, setSelectedScanParentId] = useState('');
    const [scanResults, setScanResults] = useState<any[]>([]);
    const [selectedResults, setSelectedResults] = useState<string[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [isImportingRomania, setIsImportingRomania] = useState(false);
    const { isLoaded } = useGoogleMaps();

    const handleImportRomania = async () => {
        setIsImportingRomania(true);
        const loadingToast = toast.loading("Importing all Romanian counties, cities, and neighborhoods...");
        try {
            const res = await importRomaniaLocations();
            toast.dismiss(loadingToast);
            if (res.success) {
                toast.success(res.message || "Successfully imported all of Romania!");
                window.location.reload();
            } else {
                toast.error(res.error || "Failed to import Romania dataset.");
            }
        } catch (err: any) {
            toast.dismiss(loadingToast);
            toast.error(err.message || "Failed to import Romania dataset.");
        } finally {
            setIsImportingRomania(false);
        }
    };

    const parseAddressComponents = (components: any[], targetLocation: { lat: number; lng: number }) => {
        const result: {
            country?: { name: string; latitude: number; longitude: number };
            county?: { name: string; latitude: number; longitude: number };
            city?: { name: string; latitude: number; longitude: number };
            area?: { name: string; latitude: number; longitude: number };
        } = {};
        
        const countryComp = components.find(c => c.types.includes('country'));
        if (countryComp) {
            result.country = { name: countryComp.long_name, latitude: targetLocation.lat, longitude: targetLocation.lng };
        }
        
        const countyComp = components.find(c => c.types.includes('administrative_area_level_1'));
        if (countyComp) {
            let name = countyComp.long_name;
            if (name.startsWith('Județul ')) name = name.replace('Județul ', '');
            if (name.endsWith(' County')) name = name.replace(' County', '');
            result.county = { name, latitude: targetLocation.lat, longitude: targetLocation.lng };
        }
        
        const cityComp = components.find(c => c.types.includes('locality')) || 
                         components.find(c => c.types.includes('postal_town')) ||
                         components.find(c => c.types.includes('administrative_area_level_2'));
        if (cityComp) {
            result.city = { name: cityComp.long_name, latitude: targetLocation.lat, longitude: targetLocation.lng };
        }
        
        const areaComp = components.find(c => c.types.includes('neighborhood')) ||
                         components.find(c => c.types.includes('sublocality')) ||
                         components.find(c => c.types.includes('colloquial_area')) ||
                         components.find(c => c.types.includes('sublocality_level_1'));
        if (areaComp) {
            result.area = { name: areaComp.long_name, latitude: targetLocation.lat, longitude: targetLocation.lng };
        }

        return result;
    };

    const handleResolveHierarchy = async () => {
        if (!hierarchySearchQuery.trim()) return;
        if (!window.google) {
            toast.error("Google Maps script not loaded yet.");
            return;
        }

        setIsResolving(true);
        setResolvedHierarchy(null);

        const service = new google.maps.places.PlacesService(document.createElement('div'));
        
        service.textSearch({ query: hierarchySearchQuery }, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results && results[0]) {
                const place = results[0];
                const placeId = place.place_id;

                if (!placeId) {
                    toast.error("Place ID not found for this location.");
                    setIsResolving(false);
                    return;
                }

                service.getDetails({ placeId, fields: ['address_components', 'geometry'] }, async (placeDetail, detailStatus) => {
                    if (detailStatus === google.maps.places.PlacesServiceStatus.OK && placeDetail) {
                        const coords = {
                            lat: placeDetail.geometry?.location?.lat() || DEFAULT_LAT,
                            lng: placeDetail.geometry?.location?.lng() || DEFAULT_LNG
                        };

                        const parsed = parseAddressComponents(placeDetail.address_components || [], coords);
                        const geocoder = new google.maps.Geocoder();

                        const geocodePromise = (address: string) => {
                            return new Promise<{lat: number, lng: number} | null>((resolve) => {
                                geocoder.geocode({ address }, (geoResults, geoStatus) => {
                                    if (geoStatus === 'OK' && geoResults && geoResults[0]) {
                                        resolve({
                                            lat: geoResults[0].geometry.location.lat(),
                                            lng: geoResults[0].geometry.location.lng()
                                        });
                                    } else {
                                        resolve(null);
                                    }
                                });
                            });
                        };

                        // Geocode parents to get actual center coordinates if possible
                        if (parsed.country) {
                            const cGeo = await geocodePromise(parsed.country.name);
                            parsed.country.latitude = cGeo?.lat || coords.lat;
                            parsed.country.longitude = cGeo?.lng || coords.lng;
                        }
                        if (parsed.county) {
                            const parentString = parsed.country ? `${parsed.county.name}, ${parsed.country.name}` : parsed.county.name;
                            const cGeo = await geocodePromise(parentString);
                            parsed.county.latitude = cGeo?.lat || coords.lat;
                            parsed.county.longitude = cGeo?.lng || coords.lng;
                        }
                        if (parsed.city) {
                            const parentString = [parsed.city.name, parsed.county?.name, parsed.country?.name].filter(Boolean).join(', ');
                            const cGeo = await geocodePromise(parentString);
                            parsed.city.latitude = cGeo?.lat || coords.lat;
                            parsed.city.longitude = cGeo?.lng || coords.lng;
                        }
                        if (parsed.area) {
                            parsed.area.latitude = coords.lat;
                            parsed.area.longitude = coords.lng;
                        }

                        setResolvedHierarchy(parsed);
                        toast.success("Resolved address hierarchy!");
                    } else {
                        toast.error("Failed to retrieve place details.");
                    }
                    setIsResolving(false);
                });
            } else {
                toast.error("No location found matching that query.");
                setIsResolving(false);
            }
        });
    };

    const handleImportHierarchy = async () => {
        if (!resolvedHierarchy) return;

        setIsImporting(true);
        try {
            let currentParentId: string | null = null;

            // 1. Process Country
            if (resolvedHierarchy.country) {
                const existing = countries.find(c => c.name.toLowerCase() === resolvedHierarchy.country.name.toLowerCase());
                if (existing) {
                    currentParentId = existing.id;
                } else {
                    const res = await addSystemLocation(
                        'country',
                        resolvedHierarchy.country.name,
                        null,
                        resolvedHierarchy.country.latitude,
                        resolvedHierarchy.country.longitude
                    );
                    if (res.success && res.data) {
                        const newItem: LocationItem = {
                            id: res.data.id,
                            name: res.data.name,
                            type: 'country',
                            latitude: res.data.latitude,
                            longitude: res.data.longitude
                        };
                        setCountries(prev => [...prev, newItem].sort((a, b) => a.name.localeCompare(b.name, 'ro')));
                        currentParentId = res.data.id;
                    } else {
                        throw new Error(res.error || "Failed to import Country");
                    }
                }
            }

            // 2. Process County
            if (resolvedHierarchy.county) {
                const existing = counties.find(c => c.name.toLowerCase() === resolvedHierarchy.county.name.toLowerCase() && c.parent_id === currentParentId);
                if (existing) {
                    currentParentId = existing.id;
                } else {
                    const res = await addSystemLocation(
                        'county',
                        resolvedHierarchy.county.name,
                        currentParentId,
                        resolvedHierarchy.county.latitude,
                        resolvedHierarchy.county.longitude
                    );
                    if (res.success && res.data) {
                        const newItem: LocationItem = {
                            id: res.data.id,
                            name: res.data.name,
                            type: 'county',
                            parent_id: res.data.parent_id,
                            latitude: res.data.latitude,
                            longitude: res.data.longitude
                        };
                        setCounties(prev => [...prev, newItem].sort((a, b) => a.name.localeCompare(b.name, 'ro')));
                        currentParentId = res.data.id;
                    } else {
                        throw new Error(res.error || "Failed to import County");
                    }
                }
            }

            // 3. Process City
            if (resolvedHierarchy.city) {
                const existing = cities.find(c => c.name.toLowerCase() === resolvedHierarchy.city.name.toLowerCase() && c.parent_id === currentParentId);
                if (existing) {
                    currentParentId = existing.id;
                } else {
                    const res = await addSystemLocation(
                        'city',
                        resolvedHierarchy.city.name,
                        currentParentId,
                        resolvedHierarchy.city.latitude,
                        resolvedHierarchy.city.longitude
                    );
                    if (res.success && res.data) {
                        const newItem: LocationItem = {
                            id: res.data.id,
                            name: res.data.name,
                            type: 'city',
                            parent_id: res.data.parent_id,
                            latitude: res.data.latitude,
                            longitude: res.data.longitude
                        };
                        setCities(prev => [...prev, newItem].sort((a, b) => a.name.localeCompare(b.name, 'ro')));
                        currentParentId = res.data.id;
                    } else {
                        throw new Error(res.error || "Failed to import City");
                    }
                }
            }

            // 4. Process Area
            if (resolvedHierarchy.area) {
                const existing = areas.find(c => c.name.toLowerCase() === resolvedHierarchy.area.name.toLowerCase() && c.parent_id === currentParentId);
                if (!existing) {
                    const res = await addSystemLocation(
                        'area',
                        resolvedHierarchy.area.name,
                        currentParentId,
                        resolvedHierarchy.area.latitude,
                        resolvedHierarchy.area.longitude
                    );
                    if (res.success && res.data) {
                        const newItem: LocationItem = {
                            id: res.data.id,
                            name: res.data.name,
                            type: 'area',
                            parent_id: res.data.parent_id,
                            latitude: res.data.latitude,
                            longitude: res.data.longitude
                        };
                        setAreas(prev => [...prev, newItem].sort((a, b) => a.name.localeCompare(b.name, 'ro')));
                    } else {
                        throw new Error(res.error || "Failed to import Area");
                    }
                }
            }

            toast.success("Successfully imported entire nested location hierarchy!");
            setResolvedHierarchy(null);
            setHierarchySearchQuery('');
        } catch (err: any) {
            toast.error(err.message || "Failed to import location hierarchy.");
        } finally {
            setIsImporting(false);
        }
    };

    const handleGoogleScanAreas = () => {
        if (!selectedScanParentId) {
            toast.error("Please select a parent location first.");
            return;
        }
        if (!window.google) {
            toast.error("Google Maps script not loaded yet.");
            return;
        }

        const parentObj = scanType === 'city' 
            ? counties.find(c => c.id === selectedScanParentId) 
            : cities.find(c => c.id === selectedScanParentId);
            
        if (!parentObj) return;

        setIsScanning(true);
        setScanResults([]);
        setSelectedResults([]);

        const service = new google.maps.places.PlacesService(document.createElement('div'));
        const queries = scanType === 'city'
            ? [
                `cities in ${parentObj.name}`,
                `towns in ${parentObj.name}`,
                `localities in ${parentObj.name}`
              ]
            : [
                `neighborhoods in ${parentObj.name}`,
                `cartiere in ${parentObj.name}`,
                `areas in ${parentObj.name}`
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
                    const filtered = combinedResults.filter(r => r.name.toLowerCase() !== parentObj.name.toLowerCase());
                    setScanResults(filtered);
                    setSelectedResults(filtered.map(r => r.name));
                    setIsScanning(false);
                    if (filtered.length === 0) {
                        toast.error(`No sub-locations found for ${parentObj.name} on Google.`);
                    } else {
                        toast.success(`Found ${filtered.length} locations on Google for ${parentObj.name}!`);
                    }
                }
            });
        });
    };

    const handleImportSelectedAreas = async () => {
        if (selectedResults.length === 0) {
            toast.error("Please select at least one item to import.");
            return;
        }

        const parentObj = scanType === 'city'
            ? counties.find(c => c.id === selectedScanParentId)
            : cities.find(c => c.id === selectedScanParentId);

        if (!parentObj) return;

        setIsImporting(true);
        try {
            const itemsToImport = scanResults
                .filter(r => selectedResults.includes(r.name))
                .map(r => ({
                    type: scanType,
                    name: r.name,
                    parent_id: parentObj.id,
                    latitude: r.latitude,
                    longitude: r.longitude
                }));

            const res = await batchAddSystemLocations(itemsToImport);
            if (res.success && res.data) {
                toast.success(`Successfully imported ${itemsToImport.length} ${scanType === 'city' ? 'cities' : 'areas'} into ${parentObj.name}!`);
                
                const newItems: LocationItem[] = res.data.map((d: any) => ({
                    id: d.id,
                    name: d.name,
                    type: d.type,
                    parent_id: d.parent_id,
                    latitude: d.latitude,
                    longitude: d.longitude
                }));

                if (scanType === 'city') {
                    setCities(prev => [...prev, ...newItems].sort((a, b) => a.name.localeCompare(b.name, 'ro')));
                } else {
                    setAreas(prev => [...prev, ...newItems].sort((a, b) => a.name.localeCompare(b.name, 'ro')));
                }
                
                setScanResults([]);
                setSelectedResults([]);
            } else {
                toast.error(res.error || `Failed to batch import ${scanType === 'city' ? 'cities' : 'areas'}.`);
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to import items.");
        } finally {
            setIsImporting(false);
        }
    };
    const [countries, setCountries] = useState<LocationItem[]>(initialCountries || []);
    const [counties, setCounties] = useState<LocationItem[]>(initialCounties || []);
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
    const currentList = 
        activeTab === 'country' ? countries :
        activeTab === 'county' ? counties :
        activeTab === 'city' ? cities :
        areas;

    // Filter current list based on search query
    const filteredList = currentList.filter(item =>
        item.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );

    const RENDER_LIMIT = 100;
    const displayedList = filteredList.slice(0, RENDER_LIMIT);

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
            const targetType = activeTab === 'auto-import' ? 'city' : activeTab;
            const res = await addSystemLocation(
                targetType, 
                trimmedName, 
                targetType === 'country' ? null : newLocationParentId || null,
                targetType === 'city' ? DEFAULT_LAT : null,
                targetType === 'city' ? DEFAULT_LNG : null
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
                if (activeTab === 'country') {
                    setCountries(prev => [...prev, newItem].sort((a, b) => a.name.localeCompare(b.name, 'ro')));
                } else if (activeTab === 'county') {
                    setCounties(prev => [...prev, newItem].sort((a, b) => a.name.localeCompare(b.name, 'ro')));
                } else if (activeTab === 'city') {
                    setCities(prev => [...prev, newItem].sort((a, b) => a.name.localeCompare(b.name, 'ro')));
                } else if (activeTab === 'area') {
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
                if (activeTab === 'country') {
                    setCountries(prev => prev.filter(item => item.id !== id));
                } else if (activeTab === 'county') {
                    setCounties(prev => prev.filter(item => item.id !== id));
                } else if (activeTab === 'city') {
                    setCities(prev => prev.filter(item => item.id !== id));
                } else if (activeTab === 'area') {
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
                parent_id: activeTab === 'country' ? null : editParentId || null,
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

                if (activeTab === 'country') {
                    setCountries(prev => prev.map(item => item.id === editingItem.id ? updatedItem : item).sort((a, b) => a.name.localeCompare(b.name, 'ro')));
                } else if (activeTab === 'county') {
                    setCounties(prev => prev.map(item => item.id === editingItem.id ? updatedItem : item).sort((a, b) => a.name.localeCompare(b.name, 'ro')));
                } else if (activeTab === 'city') {
                    setCities(prev => prev.map(item => item.id === editingItem.id ? updatedItem : item).sort((a, b) => a.name.localeCompare(b.name, 'ro')));
                } else if (activeTab === 'area') {
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
            {/* 1. PREMIUM STATS & INTERACTIVE GUIDE CARD */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Info Card explaining what to do */}
                <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group">
                    {/* Background glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-3xl rounded-full group-hover:bg-orange-500/10 transition-all duration-500" />
                    <div>
                        <div className="flex items-center gap-2 text-white font-bold text-base mb-3">
                            <Info className="w-5 h-5 text-orange-500" />
                            <span>System Locations & Coordinates Guide</span>
                        </div>
                        <p className="text-slate-400 text-xs leading-relaxed mb-4">
                            The location list defines the geographical hierarchy used across <strong>Properties</strong>, <strong>Leads</strong>, and <strong>Scraped Listings</strong>. Pinpointing locations on the map coordinates ensures lead preference drawn polygons match accurately.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-slate-300 text-xs">
                            <div className="flex items-start gap-2.5">
                                <span className="bg-orange-500/10 text-orange-400 font-bold px-2 py-0.5 rounded text-[10px] shrink-0 mt-0.5">1</span>
                                <div>
                                    <p className="font-bold text-slate-200">Hierarchy Nesting</p>
                                    <p className="text-slate-500 text-[11px] mt-0.5">Country ➔ County ➔ City/Commune ➔ Area/Neighborhood</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2.5">
                                <span className="bg-orange-500/10 text-orange-400 font-bold px-2 py-0.5 rounded text-[10px] shrink-0 mt-0.5">2</span>
                                <div>
                                    <p className="font-bold text-slate-200">Pin Coordinates</p>
                                    <p className="text-slate-500 text-[11px] mt-0.5">Click any card to open the interactive map pin editor and pinpoint the coordinates.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2.5">
                                <span className="bg-orange-500/10 text-orange-400 font-bold px-2 py-0.5 rounded text-[10px] shrink-0 mt-0.5">3</span>
                                <div>
                                    <p className="font-bold text-slate-200">Manual Addition</p>
                                    <p className="text-slate-500 text-[11px] mt-0.5">Under any tab, select the parent first (e.g. County), then type the city name and click Add.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2.5">
                                <span className="bg-orange-500/10 text-orange-400 font-bold px-2 py-0.5 rounded text-[10px] shrink-0 mt-0.5">4</span>
                                <div>
                                    <p className="font-bold text-slate-200">Auto-Import Google</p>
                                    <p className="text-slate-500 text-[11px] mt-0.5">Go to the Auto-Import tab to batch-import whole counties or search google directly.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Database Quick Stats */}
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-white font-bold text-base mb-4">
                            <Sparkles className="w-5 h-5 text-orange-500" />
                            <span>Database Overview</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-900">
                                <span className="text-slate-500 text-[10px] uppercase font-black tracking-wider block">Countries</span>
                                <span className="text-lg font-black text-white mt-1 block">{countries.length}</span>
                            </div>
                            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-900">
                                <span className="text-slate-500 text-[10px] uppercase font-black tracking-wider block">Counties</span>
                                <span className="text-lg font-black text-white mt-1 block">{counties.length}</span>
                            </div>
                            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-900">
                                <span className="text-slate-500 text-[10px] uppercase font-black tracking-wider block">Cities</span>
                                <span className="text-lg font-black text-white mt-1 block">{cities.length}</span>
                            </div>
                            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-900">
                                <span className="text-slate-500 text-[10px] uppercase font-black tracking-wider block">Areas</span>
                                <span className="text-lg font-black text-white mt-1 block">{areas.length}</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-[10px] text-slate-500 font-semibold border-t border-slate-800/80 pt-3 mt-4 flex items-center gap-1.5 justify-center">
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>All database entries are deduplicated & clean</span>
                    </div>
                </div>
            </div>

            {/* 2. TAB CONTROL HEADER */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex bg-slate-955 p-1 rounded-xl border border-slate-800 flex-wrap gap-1">
                    <button
                        onClick={() => {
                            setActiveTab('country');
                            setSearchQuery('');
                        }}
                        className={`flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                            activeTab === 'country'
                                ? 'bg-orange-500 text-white shadow-md'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <Globe className="w-4 h-4" />
                        Countries
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('county');
                            setSearchQuery('');
                        }}
                        className={`flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                            activeTab === 'county'
                                ? 'bg-orange-500 text-white shadow-md'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        <MapPin className="w-4 h-4" />
                        Counties
                    </button>
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
                        Cities & Communes
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
                        Areas & Neighbourhoods
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
                        <Sparkles className="w-4 h-4" />
                        Auto-Import (Google)
                    </button>
                </div>

                {/* Filter Search Input */}
                {activeTab !== 'auto-import' && (
                    <div className="relative md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={`Search ${activeTab === 'city' ? 'cities' : activeTab === 'area' ? 'areas' : activeTab} list...`}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-2.5 text-sm font-semibold outline-none focus:border-orange-500/50 text-white placeholder-slate-500"
                        />
                    </div>
                )}
            </div>

            {/* 3. ADD CUSTOM LOCATION BAR */}
            {activeTab !== 'auto-import' && (
                <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3 text-slate-200 font-bold text-xs uppercase tracking-wider">
                        <Plus className="w-4 h-4 text-orange-500" />
                        <span>Add Custom {activeTab === 'city' ? 'City' : activeTab === 'area' ? 'Area' : activeTab} Entry</span>
                    </div>
                    <form onSubmit={handleAddLocation} className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                        {activeTab === 'county' && (
                            <div className="flex flex-col gap-1 md:w-64">
                                <span className="text-[10px] font-bold text-slate-500">1. Select Country</span>
                                <select
                                    value={newLocationParentId}
                                    onChange={(e) => setNewLocationParentId(e.target.value)}
                                    required
                                    className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-semibold outline-none text-white focus:border-orange-500/50 cursor-pointer w-full"
                                >
                                    <option value="">Select Parent Country... *</option>
                                    {countries.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        {activeTab === 'city' && (
                            <div className="flex flex-col gap-1 md:w-64">
                                <span className="text-[10px] font-bold text-slate-500">1. Select County</span>
                                <select
                                    value={newLocationParentId}
                                    onChange={(e) => setNewLocationParentId(e.target.value)}
                                    required
                                    className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-semibold outline-none text-white focus:border-orange-500/50 cursor-pointer w-full"
                                >
                                    <option value="">Select Parent County... *</option>
                                    {counties.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        {activeTab === 'area' && (
                            <div className="flex flex-col gap-1 md:w-64">
                                <span className="text-[10px] font-bold text-slate-500">1. Select City</span>
                                <select
                                    value={newLocationParentId}
                                    onChange={(e) => setNewLocationParentId(e.target.value)}
                                    required
                                    className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-semibold outline-none text-white focus:border-orange-500/50 cursor-pointer w-full"
                                >
                                    <option value="">Select Parent City... *</option>
                                    {cities.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div className="flex flex-col gap-1 flex-1">
                            <span className="text-[10px] font-bold text-slate-500">
                                {activeTab === 'country' ? '1. Country Name' : '2. Enter Name'}
                            </span>
                            <input
                                type="text"
                                required
                                value={newLocationName}
                                onChange={(e) => setNewLocationName(e.target.value)}
                                placeholder={`Enter ${activeTab === 'city' ? 'city' : activeTab === 'area' ? 'area/neighborhood' : activeTab} name...`}
                                className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-orange-500/50 text-white placeholder-slate-500 w-full"
                            />
                        </div>
                        <div className="flex flex-col justify-end pt-5">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-extrabold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-orange-500/10 disabled:opacity-50 h-[46px]"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Plus className="w-4 h-4" />
                                )}
                                Add location
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Main items grid */}
            {/* Main items grid */}
            {activeTab !== 'auto-import' ? (
                filteredList.length > 0 ? (
                    <div className="flex flex-col gap-3.5">
                        {filteredList.length > RENDER_LIMIT && (
                            <div className="bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-xl px-4 py-3 text-xs font-semibold flex items-center gap-2">
                                <Sparkles className="w-4 h-4 shrink-0" />
                                <span>
                                    Showing first <strong>{RENDER_LIMIT}</strong> of <strong>{filteredList.length}</strong> locations. Refine your search query to see other locations.
                                </span>
                            </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {displayedList.map((item) => {
                                const parentName = !item.parent_id ? null :
                                    activeTab === 'county' ? countries.find(c => c.id === item.parent_id)?.name :
                                    activeTab === 'city' ? counties.find(c => c.id === item.parent_id)?.name :
                                    activeTab === 'area' ? cities.find(c => c.id === item.parent_id)?.name :
                                    null;

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
                                            {parentName && (
                                                <span className="text-[10px] text-slate-500 font-medium">
                                                    linked to {parentName}
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
                        {/* Left Column: Search & Resolve Hierarchy */}
                        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 flex flex-col space-y-4">
                            <div className="flex items-center gap-2 text-white font-bold text-base border-b border-slate-800 pb-3">
                                <Globe className="w-5 h-5 text-orange-500" />
                                <h3>Resolve & Import Location Hierarchy</h3>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Search for any specific location (e.g. <i>"Seminyak, Bali, Indonesia"</i> or <i>"Braytim, Timisoara"</i>). Google will automatically trace and resolve the entire parent hierarchy of countries, counties, cities, and areas for instant importing.
                            </p>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={hierarchySearchQuery}
                                    onChange={(e) => setHierarchySearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleResolveHierarchy()}
                                    placeholder="Search location hierarchy (e.g. Dubai Marina...)"
                                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none focus:border-orange-500/50 text-white placeholder-slate-600"
                                />
                                <button
                                    type="button"
                                    onClick={handleResolveHierarchy}
                                    disabled={isResolving || !hierarchySearchQuery.trim()}
                                    className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-extrabold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50"
                                >
                                    {isResolving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                    Resolve
                                </button>
                            </div>

                            {/* Resolved Hierarchy Tree */}
                            {resolvedHierarchy && (
                                <div className="mt-4 p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Resolved Location Tree</span>
                                    <div className="space-y-2.5 border-l-2 border-orange-500/30 pl-4 ml-2">
                                        {resolvedHierarchy.country && (
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-slate-200 font-semibold flex items-center gap-1.5">
                                                    <span className="text-sm">🌍</span> Country: <strong className="text-white">{resolvedHierarchy.country.name}</strong>
                                                </span>
                                                {countries.some(c => c.name.toLowerCase() === resolvedHierarchy.country.name.toLowerCase()) ? (
                                                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/30">✓ Saved</span>
                                                ) : (
                                                    <span className="text-[10px] text-orange-400 font-bold bg-orange-950/40 px-2 py-0.5 rounded border border-orange-900/30">+ New</span>
                                                )}
                                            </div>
                                        )}
                                        {resolvedHierarchy.county && (
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-slate-200 font-semibold flex items-center gap-1.5">
                                                    <span className="text-sm">📍</span> County: <strong className="text-white">{resolvedHierarchy.county.name}</strong>
                                                </span>
                                                {counties.some(c => c.name.toLowerCase() === resolvedHierarchy.county.name.toLowerCase()) ? (
                                                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/30">✓ Saved</span>
                                                ) : (
                                                    <span className="text-[10px] text-orange-400 font-bold bg-orange-950/40 px-2 py-0.5 rounded border border-orange-900/30">+ New</span>
                                                )}
                                            </div>
                                        )}
                                        {resolvedHierarchy.city && (
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-slate-200 font-semibold flex items-center gap-1.5">
                                                    <span className="text-sm">🏙️</span> City: <strong className="text-white">{resolvedHierarchy.city.name}</strong>
                                                </span>
                                                {cities.some(c => c.name.toLowerCase() === resolvedHierarchy.city.name.toLowerCase()) ? (
                                                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/30">✓ Saved</span>
                                                ) : (
                                                    <span className="text-[10px] text-orange-400 font-bold bg-orange-950/40 px-2 py-0.5 rounded border border-orange-900/30">+ New</span>
                                                )}
                                            </div>
                                        )}
                                        {resolvedHierarchy.area && (
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-slate-200 font-semibold flex items-center gap-1.5">
                                                    <span className="text-sm">📍</span> Area: <strong className="text-white">{resolvedHierarchy.area.name}</strong>
                                                </span>
                                                {areas.some(c => c.name.toLowerCase() === resolvedHierarchy.area.name.toLowerCase()) ? (
                                                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/30">✓ Saved</span>
                                                ) : (
                                                    <span className="text-[10px] text-orange-400 font-bold bg-orange-950/40 px-2 py-0.5 rounded border border-orange-900/30">+ New</span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleImportHierarchy}
                                        disabled={isImporting}
                                        className="w-full mt-3 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-extrabold text-xs uppercase tracking-wider py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-orange-500/10"
                                    >
                                        {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                        Import Entire Resolved Hierarchy
                                    </button>
                                </div>
                            )}

                            {!resolvedHierarchy && !isResolving && (
                                <div className="text-center py-12 text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl flex-1 flex flex-col items-center justify-center">
                                    Search for a query above to view the resolved address tree.
                                </div>
                            )}

                            {/* Romania One-Click Importer */}
                            <div className="mt-4 border-t border-slate-800/80 pt-5 flex flex-col space-y-3 shrink-0">
                                <div className="flex items-center gap-2 text-white font-bold text-sm">
                                    <Globe className="w-4 h-4 text-orange-500" />
                                    <h4>One-Click Country Importer</h4>
                                </div>
                                <p className="text-[11px] text-slate-400 leading-relaxed">
                                    Select a country to instantly seed/import its entire official administrative divisions (all counties, all cities/towns/communes, and major neighborhoods) in a single click.
                                </p>
                                <div className="flex gap-2">
                                    <select
                                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs font-semibold outline-none text-white focus:border-orange-500/50 cursor-pointer"
                                        defaultValue="RO"
                                    >
                                        <option value="RO">Romania (42 Counties, 13,800+ Cities & Major Neighbourhoods)</option>
                                    </select>
                                    <button
                                        type="button"
                                        onClick={handleImportRomania}
                                        disabled={isImportingRomania}
                                        className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-extrabold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
                                    >
                                        {isImportingRomania ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Importing...
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="w-4 h-4" />
                                                Import Romania
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Scan & Batch Import Sub-Locations */}
                        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 flex flex-col space-y-4">
                            <div className="flex items-center gap-2 text-white font-bold text-base border-b border-slate-800 pb-3">
                                <Sparkles className="w-5 h-5 text-orange-500" />
                                <h3>Scan & Batch Import Sub-Locations</h3>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Select a hierarchy level to batch scan sub-locations from Google Places (e.g. scan all cities inside a county, or scan neighborhoods inside a city).
                            </p>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">Scan Type</label>
                                    <select
                                        value={scanType}
                                        onChange={(e) => {
                                            setScanType(e.target.value as 'city' | 'area');
                                            setSelectedScanParentId('');
                                            setScanResults([]);
                                        }}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs font-semibold outline-none text-white focus:border-orange-500/50 cursor-pointer"
                                    >
                                        <option value="city">Cities in a County</option>
                                        <option value="area">Areas in a City</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">Parent Location</label>
                                    <select
                                        value={selectedScanParentId}
                                        onChange={(e) => {
                                            setSelectedScanParentId(e.target.value);
                                            setScanResults([]);
                                        }}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs font-semibold outline-none text-white focus:border-orange-500/50 cursor-pointer"
                                    >
                                        <option value="">Select parent...</option>
                                        {scanType === 'city' ? (
                                            counties.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))
                                        ) : (
                                            cities.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))
                                        )}
                                    </select>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleGoogleScanAreas}
                                disabled={isScanning || !selectedScanParentId}
                                className="w-full bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-extrabold text-xs uppercase tracking-wider py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 shrink-0"
                            >
                                {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                Scan Sub-Locations
                            </button>

                            {/* Checklist of Scan Results */}
                            {scanResults.length > 0 && (
                                <div className="flex flex-col flex-1 min-h-0 space-y-2 mt-2">
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-xs font-bold text-slate-400 uppercase">Found {scanResults.length} Sub-locations</span>
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
                                        {scanResults.map((item, idx) => {
                                            const isChecked = selectedResults.includes(item.name);
                                            const exists = scanType === 'city' 
                                                ? cities.some(c => c.name.toLowerCase() === item.name.toLowerCase() && c.parent_id === selectedScanParentId)
                                                : areas.some(a => a.name.toLowerCase() === item.name.toLowerCase() && a.parent_id === selectedScanParentId);

                                            return (
                                                <div
                                                    key={idx}
                                                    onClick={() => {
                                                        if (exists) return;
                                                        setSelectedResults(prev =>
                                                            isChecked ? prev.filter(n => n !== item.name) : [...prev, item.name]
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
                                                            <span className="text-sm font-bold text-slate-200 truncate">{item.name}</span>
                                                            <span className="text-[10px] text-orange-400/80 font-semibold">📍 Lat: {item.latitude.toFixed(4)}, Lng: {item.longitude.toFixed(4)}</span>
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
                                <div className="text-center py-12 text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl flex-1 flex flex-col items-center justify-center">
                                    Select a parent location and click "Scan Sub-Locations" above to preview and import sub-localities.
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
                                Edit {activeTab} Details
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
                                <div className={`grid grid-cols-1 sm:grid-cols-${activeTab !== 'country' ? '4' : '3'} gap-4 shrink-0`}>
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

                                    {activeTab !== 'country' && (
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                                                Parent {activeTab === 'county' ? 'Country' : activeTab === 'city' ? 'County' : 'City'}
                                            </label>
                                            <select
                                                value={editParentId}
                                                onChange={(e) => setEditParentId(e.target.value)}
                                                required
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none text-white focus:border-orange-500/50 cursor-pointer"
                                            >
                                                <option value="">Select Parent... *</option>
                                                {activeTab === 'county' && countries.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                                {activeTab === 'city' && counties.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                                {activeTab === 'area' && cities.map(c => (
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
