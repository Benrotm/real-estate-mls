"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, X, User, ClipboardList, Eye, Check, ChevronDown, ChevronUp, Fingerprint, Briefcase, Users as UsersIcon, Home, Dog, Ban, Baby, Building2, PieChart, TrendingUp, Sliders } from 'lucide-react';
import {
    PROPERTY_TYPES,
    TRANSACTION_TYPES,
    PROPERTY_FEATURES,
    PARTITIONING_TYPES,
    COMFORT_TYPES,
    BUILDING_TYPES,
    INTERIOR_CONDITIONS,
    FURNISHING_TYPES
} from '@/app/lib/properties';
import { createLead, updateLead } from '@/app/lib/actions/leads';
import { LeadData } from '@/app/lib/types';
import DrawAreaSelector from '@/app/components/DrawAreaSelector';
import { ROMANIAN_CITIES, TIMISOARA_AREAS, formatCityList, cleanCityName, normalizeText } from '@/app/lib/constants/locations';
import MultiSearchableSelect from '@/app/components/MultiSearchableSelect';
import { getSystemLocations } from '@/app/lib/actions/admin-settings';
import { useEffect, useMemo } from 'react';

// FEATURE_CATEGORIES block remains the same


const FEATURE_CATEGORIES = {
    'Listing Tags': ['Commission 0%', 'Exclusive', 'Foreclosure', 'Hotel Regime', 'Luxury'],
    'Unit Features': ['Air Conditioning', 'Balcony', 'Central Heating', 'Fireplace', 'Garage', 'Jacuzzi', 'Laundry', 'Parking', 'Private Pool', 'Sauna', 'Storage'],
    'Community & Recreation': ['Amphitheatre', 'Clubhouse', 'Common Garden', 'Jogging Track', 'Library', 'Park', 'Party Hall', 'Playground'],
    'Sports & Fitness': ['Basketball Court', 'Football Field', 'Gym', 'Squash Court', 'Swimming Pool', 'Tennis Court', 'Yoga Deck'],
    'Security & Safety': ['24/7 Security', 'CCTV Surveillance', 'Fire Safety', 'Gated Community', 'Intercom', 'Shelter', 'Video Door Phone'],
    'Sustainability & Services': ['Concierge', 'Elevator', 'Green Building', 'Maintenance Staff', 'Power Backup', 'Rainwater Harvesting', 'Sewage Treatment', 'Smart Home', 'Solar Panels', 'Visitor Parking']
};

const CATEGORY_COLORS: Record<string, { bg: string, border: string, shadow: string, text: string, dot: string }> = {
    'Unit Features': { bg: 'bg-violet-600', border: 'border-violet-500', shadow: 'shadow-violet-600/20', text: 'text-violet-400', dot: 'bg-violet-500' },
    'Community & Recreation': { bg: 'bg-emerald-600', border: 'border-emerald-500', shadow: 'shadow-emerald-600/20', text: 'text-emerald-400', dot: 'bg-emerald-500' },
    'Sports & Fitness': { bg: 'bg-orange-600', border: 'border-orange-500', shadow: 'shadow-orange-600/20', text: 'text-orange-400', dot: 'bg-orange-500' },
    'Security & Safety': { bg: 'bg-red-600', border: 'border-red-500', shadow: 'shadow-red-600/20', text: 'text-red-400', dot: 'bg-red-500' },
    'Sustainability & Services': { bg: 'bg-teal-600', border: 'border-teal-500', shadow: 'shadow-teal-600/20', text: 'text-teal-400', dot: 'bg-teal-500' },
    'Listing Tags': { bg: 'bg-indigo-600', border: 'border-indigo-500', shadow: 'shadow-indigo-600/20', text: 'text-indigo-400', dot: 'bg-indigo-500' }
};

const STATUS_SELECT_COLORS = {
    new: 'bg-blue-50 text-blue-700 border-blue-300 focus:border-blue-500 focus:ring-blue-500/10',
    contacted: 'bg-yellow-50/70 text-yellow-700 border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500/10',
    properties_selection: 'bg-pink-50 text-pink-700 border-pink-300 focus:border-pink-500 focus:ring-pink-500/10',
    viewing: 'bg-purple-50 text-purple-700 border-purple-300 focus:border-purple-500 focus:ring-purple-500/10',
    negotiation: 'bg-orange-50 text-orange-700 border-orange-300 focus:border-orange-500 focus:ring-orange-500/10',
    closed: 'bg-green-50 text-green-700 border-green-300 focus:border-green-500 focus:ring-green-500/10',
    lost: 'bg-zinc-100 text-zinc-600 border-zinc-300 focus:border-zinc-500 focus:ring-zinc-500/10',
    not_interested: 'bg-red-50 text-red-700 border-red-300 focus:border-red-500 focus:ring-red-500/10',
} as const;

interface LeadFormProps {
    initialData?: LeadData;
    isEditing?: boolean;
    onCancel?: () => void;
    readOnly?: boolean;
}

type TabType = 'contact' | 'classification' | 'viewing' | 'profile';

const DEFAULT_FORM_DATA: LeadData = {
    name: '',
    email: '',
    phone: '',
    id_document_type: 'C.I.',
    id_series_number: '',
    cnp: '',
    status: 'new',
    source: '',
    notes: '',
    preference_type: 'Apartment',
    preference_listing_type: 'For Sale',
    currency: 'EUR',
    preference_features: [],

    // New Preferences from Add Property Form
    preference_location_city: '',
    preference_location_area: '',
    preference_rooms_min: 0,
    preference_rooms_max: 0,
    preference_bedrooms_min: 0,
    preference_baths_min: 0,
    preference_surface_min: 0,
    preference_surface_max: 0,
    preference_year_built_min: 0,
    preference_floor_min: 0,
    preference_floor_max: 0,
    preference_partitioning: '',
    preference_comfort: '',
    preference_building_type: '',
    preference_interior_condition: '',
    preference_furnishing: '',

    search_duration: '< 1 month',
    viewed_count_total: '0',
    move_urgency: '< 1 month (Urgent)',
    payment_method: 'Credit',
    bank_status: 'No',
    budget_vs_market: 'Moderate',
    agent_interest_rating: 'Moderate',
    viewed_count_agent: 0,
    outcome_status: 'Still Searching',
    age: 0,
    kids_count: 0,
    marital_status: 'Single',
    occupation: '',
    employer: '',
    living_situation: 'In Town',
    current_city: '',
    is_smoker: false,
    has_pets: false,
    has_small_kids: false,
    pets_details: '',
    social_notes: '',
    points_of_interest: {},
    buying_reason: 'Locuinta Personala',
    negative_preferences: '',
    already_owns_properties: false,
    owned_properties_count: 0,
    ownership_purpose_investment: false,
    ownership_purpose_personal: false,
    search_with_agent: true,
    search_direct_owner: true
};

export default function LeadForm({ initialData, isEditing = false, onCancel, readOnly = false }: LeadFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('contact');
    const [showAreaMap, setShowAreaMap] = useState(false);
    const [formData, setFormData] = useState<LeadData>({
        ...DEFAULT_FORM_DATA,
        ...initialData
    });

    const [citiesListFull, setCitiesListFull] = useState<{ id: string; name: string }[]>([]);
    const [allRawAreas, setAllRawAreas] = useState<{ name: string; parent_id: string | null }[]>([]);
    const [citiesList, setCitiesList] = useState<string[]>(ROMANIAN_CITIES);

    useEffect(() => {
        getSystemLocations().then(res => {
            if (res.cities?.length) {
                setCitiesListFull(res.cities);
                const formatted = formatCityList(res.cities, res.counties || []);
                setCitiesList(formatted);
            }
            if (res.areas?.length) {
                setAllRawAreas(res.areas);
            }
        });
    }, []);

    const filteredAreasList = useMemo(() => {
        const selectedCityNames = formData.preference_location_city
            ? formData.preference_location_city.split(',').map(c => cleanCityName(c).trim()).filter(Boolean)
            : [];

        if (selectedCityNames.length === 0) {
            return [];
        }

        const normalizedSelected = selectedCityNames.map(name => normalizeText(name));

        // Find IDs of selected cities
        const selectedCityIds = citiesListFull
            .filter(c => normalizedSelected.includes(normalizeText(c.name)))
            .map(c => c.id);

        const matchedAreas = allRawAreas.filter(a => a.parent_id && selectedCityIds.includes(a.parent_id));
        
        if (matchedAreas.length > 0) {
            return Array.from(new Set(matchedAreas.map(a => a.name))).sort((a, b) => a.localeCompare(b, 'ro'));
        }

        if (normalizedSelected.some(n => n.includes('timi'))) {
            return TIMISOARA_AREAS;
        }

        return [];
    }, [formData.preference_location_city, allRawAreas, citiesListFull]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        // Handle numeric inputs strictly
        if (type === 'number') {
            setFormData(prev => ({
                ...prev,
                [name]: value === '' ? 0 : Number(value)
            }));
        } else if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleFeatureToggle = (feature: string) => {
        setFormData(prev => {
            const features = prev.preference_features || [];
            if (features.includes(feature)) {
                return { ...prev, preference_features: features.filter(f => f !== feature) };
            } else {
                return { ...prev, preference_features: [...features, feature] };
            }
        });
    };

    const handlePOIChange = (key: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            points_of_interest: {
                ...(prev.points_of_interest || {}),
                [key]: value
            }
        }));
    };

    const router = useRouter();
    const [isFeaturesExpanded, setIsFeaturesExpanded] = useState(false);
    const [isMoreCriteriaExpanded, setIsMoreCriteriaExpanded] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            let result;
            if (isEditing && initialData?.id) {
                result = await updateLead(initialData.id, formData);
            } else {
                result = await createLead(formData);
            }

            if (result && !result.success) {
                alert(result.error || 'Failed to save lead. Please try again.');
                return;
            }

            if (onCancel) {
                onCancel();
            } else if (isEditing) {
                // Show success message and stay on page
                setIsSuccess(true);
                setTimeout(() => setIsSuccess(false), 3000);
                router.refresh();
            } else {
                // If not in a modal and creating a new lead, redirect
                router.push('/dashboard/agent/leads');
                router.refresh();
            }
        } catch (error: any) {
            console.error('Lead save error:', error);
            // Only alert if it's NOT a redirect error (though we removed redirects from server action, safety first)
            if (!error.message?.includes('NEXT_REDIRECT')) {
                alert(error.message || 'Failed to save lead. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const TabButton = ({ id, label, icon: Icon }: { id: TabType, label: string, icon: any }) => (
        <button
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 border ${activeTab === id
                ? 'bg-orange-50 border-orange-200 text-orange-700 shadow-sm'
                : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
        >
            <Icon className={`w-4 h-4 ${activeTab === id ? 'text-orange-600' : 'text-slate-400'}`} />
            {label}
        </button>
    );

    // Styled classes for consistent high-contrast design
    const inputClass = "w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm placeholder:text-slate-400 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-medium";
    const labelClass = "block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1";
    const selectClass = "w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-medium cursor-pointer";

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden h-full flex flex-col">
            {/* Header Tabs */}
            <div className="bg-white p-2 flex gap-2 border-b border-slate-100">
                <TabButton id="contact" label="Contact Data" icon={User} />
                <TabButton id="classification" label="Classification" icon={ClipboardList} />
                <TabButton id="viewing" label="Lead Score" icon={Eye} />
                <TabButton id="profile" label="Lead Profile" icon={Fingerprint} />
            </div>

            <fieldset disabled={readOnly} className="p-6 overflow-y-auto flex-1 custom-scrollbar">

                {/* CONTACT TAB */}
                {activeTab === 'contact' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-6">
                            <h3 className="text-blue-800 font-bold flex items-center gap-2 mb-1">
                                <User className="w-5 h-5" />
                                Basic Information
                            </h3>
                            <p className="text-blue-600/80 text-sm">Main contact details and lead status.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={labelClass}>Full Name *</label>
                                <input type="text" name="name" required value={formData.name} onChange={handleChange} className={inputClass} placeholder="e.g. John Doe" />
                            </div>
                            <div>
                                <label className={labelClass}>Status</label>
                                <div className="relative">
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 border rounded-xl focus:bg-white focus:ring-4 transition-all font-semibold cursor-pointer ${
                                            STATUS_SELECT_COLORS[(formData.status || 'new') as keyof typeof STATUS_SELECT_COLORS] || 'bg-slate-50 text-slate-900 border-slate-300'
                                        }`}
                                    >
                                        <option value="new" className="bg-white text-blue-700 font-medium">New Lead</option>
                                        <option value="contacted" className="bg-white text-yellow-700 font-medium">Contacted</option>
                                        <option value="properties_selection" className="bg-white text-pink-700 font-medium">Properties Selection</option>
                                        <option value="viewing" className="bg-white text-purple-700 font-medium">Viewing Scheduled</option>
                                        <option value="negotiation" className="bg-white text-orange-700 font-medium">Negotiation</option>
                                        <option value="closed" className="bg-white text-green-700 font-medium">Closed / Won</option>
                                        <option value="lost" className="bg-white text-slate-700 font-medium">Lost</option>
                                        <option value="not_interested" className="bg-white text-red-700 font-medium">Not Interested</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Email</label>
                                <input type="email" name="email" value={formData.email || ''} onChange={handleChange} className={inputClass} placeholder="client@example.com" />
                            </div>
                            <div>
                                <label className={labelClass}>Phone</label>
                                <input type="tel" name="phone" value={formData.phone || ''} onChange={handleChange} className={inputClass} placeholder="+1 234 567 890" />
                            </div>
                            <div className="md:col-span-2">
                                <label className={labelClass}>Source</label>
                                <input type="text" name="source" placeholder="e.g. Website, Walk-in, Referral" value={formData.source || ''} onChange={handleChange} className={inputClass} />
                            </div>

                            {/* Property Source Checkboxes */}
                            <div className="md:col-span-2 mt-4 pt-4 border-t border-slate-100">
                                <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                                    🔍 Property Source Preferences (Find from Agent vs Direct Owner)
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <label className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer select-none transition-all ${formData.search_with_agent !== false ? 'border-orange-500 bg-orange-50/40' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                                        <input
                                            type="checkbox"
                                            checked={formData.search_with_agent !== false}
                                            onChange={(e) => setFormData(prev => ({ ...prev, search_with_agent: e.target.checked }))}
                                            className="rounded border-slate-300 text-orange-600 focus:ring-orange-500/20 w-4 h-4 cursor-pointer"
                                        />
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-slate-800">Listed by Real Estate Agents</span>
                                            <span className="text-[10px] text-slate-400 font-medium">Find properties listed by agencies/agents</span>
                                        </div>
                                    </label>

                                    <label className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer select-none transition-all ${formData.search_direct_owner !== false ? 'border-orange-500 bg-orange-50/40' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                                        <input
                                            type="checkbox"
                                            checked={formData.search_direct_owner !== false}
                                            onChange={(e) => setFormData(prev => ({ ...prev, search_direct_owner: e.target.checked }))}
                                            className="rounded border-slate-300 text-orange-600 focus:ring-orange-500/20 w-4 h-4 cursor-pointer"
                                        />
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-slate-800">Listed Directly by Owners</span>
                                            <span className="text-[10px] text-slate-400 font-medium">Find properties listed direct from owners</span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Presentation Contract Verification Fields */}
                            <div className="md:col-span-2 mt-4 pt-4 border-t border-slate-100">
                                <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    🪪 Date Identitate Cumpărător / Chiriaș (Contract de Vizionare)
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className={labelClass}>Tip Document Identitate</label>
                                        <div className="relative">
                                            <select name="id_document_type" value={formData.id_document_type || 'C.I.'} onChange={handleChange} className={selectClass}>
                                                <option value="C.I.">Carte de Identitate (C.I.)</option>
                                                <option value="Pasaport">Pașaport</option>
                                                <option value="NIF">NIF / NIF CIF</option>
                                                <option value="Altele">Altele</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Serie și Număr Act</label>
                                        <input type="text" name="id_series_number" value={formData.id_series_number || ''} onChange={handleChange} className={inputClass} placeholder="Ex: AX 123456" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className={labelClass}>Cod Numeric Personal (CNP)</label>
                                        <input type="text" name="cnp" value={formData.cnp || ''} onChange={handleChange} className={inputClass} placeholder="Ex: 1900101......" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* CLASSIFICATION TAB */}
                {activeTab === 'classification' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">

                        {/* Property Requirements Section */}
                        <div className="border-t border-slate-200 pt-3 first:border-0 first:pt-0">
                            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                                <ClipboardList className="w-4 h-4 text-slate-500" />
                                Property Requirements
                            </h3>

                            {/* Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                <div>
                                    <label className={labelClass}>Property Type</label>
                                    <div className="relative">
                                        <select name="preference_type" value={formData.preference_type} onChange={handleChange} className={selectClass}>
                                            {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>Listing Type</label>
                                    <div className="relative">
                                        <select name="preference_listing_type" value={formData.preference_listing_type} onChange={handleChange} className={selectClass}>
                                            {TRANSACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Location */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                                <div>
                                    <label className={labelClass}>City</label>
                                    <MultiSearchableSelect
                                        values={formData.preference_location_city ? formData.preference_location_city.split(',').map(c => c.trim()).filter(Boolean) : []}
                                        options={citiesList}
                                        onChange={(vals) => setFormData(prev => ({ ...prev, preference_location_city: vals.join(', ') }))}
                                        placeholder="Type or select cities..."
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Area / Neighbourhood</label>
                                    <MultiSearchableSelect
                                        values={formData.preference_location_area ? formData.preference_location_area.split(',').map(a => a.trim()).filter(Boolean) : []}
                                        options={filteredAreasList}
                                        onChange={(vals) => setFormData(prev => ({ ...prev, preference_location_area: vals.join(', ') }))}
                                        placeholder="Type or select areas..."
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Area of Interest (Map)</label>
                                    <button 
                                        type="button" 
                                        onClick={() => setShowAreaMap(true)}
                                        className="w-full flex items-center justify-between px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
                                    >
                                        <span className="text-xs font-medium text-slate-700">
                                            🗺️ {formData.preference_location_polygon?.length ? 'Edit Area on Map' : 'Draw Area on Map'}
                                        </span>
                                        {formData.preference_location_polygon?.length ? (
                                            <span className="text-[10px] bg-violet-100 text-violet-700 font-bold px-1.5 py-0.5 rounded-full">Area Selected</span>
                                        ) : (
                                            <span className="text-[10px] bg-slate-200 text-slate-600 font-bold px-1.5 py-0.5 rounded-full">No Area</span>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Modal with DrawAreaSelector */}
                            {showAreaMap && (
                                <DrawAreaSelector
                                    city={formData.preference_location_city}
                                    value={formData.preference_location_polygon}
                                    onChange={(polygon) => setFormData({...formData, preference_location_polygon: polygon || undefined})}
                                    onClose={() => setShowAreaMap(false)}
                                />
                            )}

                            {/* Property Details Grid */}
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                {/* Rooms */}
                                <div>
                                    <label className={labelClass}>Min Rooms</label>
                                    <input type="number" name="preference_rooms_min" value={formData.preference_rooms_min || ''} onChange={handleChange} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Max Rooms</label>
                                    <input type="number" name="preference_rooms_max" value={formData.preference_rooms_max || ''} onChange={handleChange} className={inputClass} />
                                </div>
                            </div>
                        </div>

                        {/* Financials (Moved from Lead Score tab to Classification tab) */}
                        <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 shadow-sm mb-3">
                            <h4 className="text-sm font-bold text-orange-800 mb-3 flex items-center gap-2">
                                💰 Financial Classification
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                <div>
                                    <label className={labelClass}>Cash or Credit</label>
                                    <div className="flex gap-6 items-center p-2 bg-white rounded-xl border border-orange-200">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input type="radio" name="payment_method" value="Cash" checked={formData.payment_method === 'Cash'} onChange={handleChange} className="w-4 h-4 text-orange-600 focus:ring-orange-500 border-gray-300" />
                                            <span className="text-slate-900 text-sm font-bold">Cash</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input type="radio" name="payment_method" value="Credit" checked={formData.payment_method === 'Credit'} onChange={handleChange} className="w-4 h-4 text-orange-600 focus:ring-orange-500 border-gray-300" />
                                            <span className="text-slate-900 text-sm font-bold">Credit</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Conditional Cash Amount (Only visible if Credit is selected) */}
                                {formData.payment_method === 'Credit' && (
                                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                        <label className={labelClass}>Available Cash Amount</label>
                                        <input
                                            type="number"
                                            name="cash_amount"
                                            placeholder="e.g. 120000"
                                            value={formData.cash_amount || ''}
                                            onChange={handleChange}
                                            className={`${inputClass} !bg-green-50 !border-green-200 !text-green-800 focus:!border-green-500 focus:!ring-green-500/20`}
                                        />
                                    </div>
                                )}

                                {/* Conditional Bank Status (Only visible if Credit is selected) */}
                                {formData.payment_method === 'Credit' && (
                                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                        <label className={labelClass}>Bank Status (Pre-approval)</label>
                                        <div className="relative">
                                            <select name="bank_status" value={formData.bank_status || ''} onChange={handleChange} className={selectClass}>
                                                <option value="No">No / Not Started</option>
                                                <option value="In Progress">In Progress</option>
                                                <option value="Pre-approved">Pre-approved</option>
                                                <option value="Not Needed">Not Needed (Cash)</option>
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className={labelClass}>Budget ({formData.currency})</label>
                                    <div className="flex gap-3">
                                        <input type="number" name="budget_min" placeholder="Min" value={formData.budget_min || ''} onChange={handleChange} className={inputClass} />
                                        <input type="number" name="budget_max" placeholder="Max" value={formData.budget_max || ''} onChange={handleChange} className={inputClass} />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>Budget vs Market Reality</label>
                                    <div className="relative">
                                        <select name="budget_vs_market" value={formData.budget_vs_market || ''} onChange={handleChange} className={selectClass}>
                                            <option value="Realistic">Realistic</option>
                                            <option value="Low">Low / Difficult</option>
                                            <option value="High">Generous</option>
                                            <option value="Unsure">Unsure</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* More Search Criteria Collapsible Section */}
                        <div className="border-t border-slate-200 pt-3">
                            <button
                                type="button"
                                onClick={() => setIsMoreCriteriaExpanded(!isMoreCriteriaExpanded)}
                                className="w-full flex items-center justify-between text-sm font-bold text-slate-900 mb-3 group"
                            >
                                <span className="flex items-center gap-2">
                                    <Sliders className="w-4 h-4 text-slate-500" />
                                    More Search Criteria
                                </span>
                                {isMoreCriteriaExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                                )}
                            </button>

                            {isMoreCriteriaExpanded && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200 pb-3">
                                    {/* Bedrooms, Bathrooms, Surface, Floors, Year Built Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <div>
                                            <label className={labelClass}>Min Bedrooms</label>
                                            <input type="number" name="preference_bedrooms_min" value={formData.preference_bedrooms_min || ''} onChange={handleChange} className={inputClass} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Min Bathrooms</label>
                                            <input type="number" name="preference_baths_min" value={formData.preference_baths_min || ''} onChange={handleChange} className={inputClass} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Min Surface (sqm)</label>
                                            <input type="number" name="preference_surface_min" value={formData.preference_surface_min || ''} onChange={handleChange} className={inputClass} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Max Surface (sqm)</label>
                                            <input type="number" name="preference_surface_max" value={formData.preference_surface_max || ''} onChange={handleChange} className={inputClass} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Min Floor</label>
                                            <input type="number" name="preference_floor_min" value={formData.preference_floor_min || ''} onChange={handleChange} className={inputClass} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Max Floor</label>
                                            <input type="number" name="preference_floor_max" value={formData.preference_floor_max || ''} onChange={handleChange} className={inputClass} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Min Year Built</label>
                                            <input type="number" name="preference_year_built_min" value={formData.preference_year_built_min || ''} onChange={handleChange} className={inputClass} />
                                        </div>
                                    </div>

                                    {/* Dropdowns */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div>
                                            <label className={labelClass}>Building Type</label>
                                            <div className="relative">
                                                <select name="preference_building_type" value={formData.preference_building_type || ''} onChange={handleChange} className={selectClass}>
                                                    <option value="">Any</option>
                                                    {BUILDING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className={labelClass}>Partitioning</label>
                                            <div className="relative">
                                                <select name="preference_partitioning" value={formData.preference_partitioning || ''} onChange={handleChange} className={selectClass}>
                                                    <option value="">Any</option>
                                                    {PARTITIONING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className={labelClass}>Comfort</label>
                                            <div className="relative">
                                                <select name="preference_comfort" value={formData.preference_comfort || ''} onChange={handleChange} className={selectClass}>
                                                    <option value="">Any</option>
                                                    {COMFORT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className={labelClass}>Interior Condition</label>
                                            <div className="relative">
                                                <select name="preference_interior_condition" value={formData.preference_interior_condition || ''} onChange={handleChange} className={selectClass}>
                                                    <option value="">Any</option>
                                                    {INTERIOR_CONDITIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className={labelClass}>Furnishing</label>
                                            <div className="relative">
                                                <select name="preference_furnishing" value={formData.preference_furnishing || ''} onChange={handleChange} className={selectClass}>
                                                    <option value="">Any</option>
                                                    {FURNISHING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Lifestyle Habits (Moved from Profile tab to Classification tab) */}
                        <div className="space-y-3 mb-3">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="h-5 w-1 bg-rose-500 rounded-full"></div>
                                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Social & Lifestyle Classification</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <label className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer select-none transition-all shadow-sm ${formData.is_smoker ? 'bg-rose-100/70 border-rose-400 ring-2 ring-rose-500/20 text-rose-900' : 'bg-rose-50/40 border-rose-200 hover:bg-rose-50/60 text-rose-800/90 hover:border-rose-300'}`}>
                                    <div className="flex items-center gap-3">
                                        <Ban className={`w-5 h-5 ${formData.is_smoker ? 'text-rose-600' : 'text-rose-500'}`} />
                                        <div>
                                            <p className={`text-sm font-bold ${formData.is_smoker ? 'text-rose-900 font-extrabold' : 'text-rose-800'}`}>Smoker</p>
                                            <p className={`text-[11px] ${formData.is_smoker ? 'text-rose-700/80' : 'text-rose-600/70'}`}>Does the lead smoke?</p>
                                        </div>
                                    </div>
                                    <input type="checkbox" name="is_smoker" checked={formData.is_smoker || false} onChange={handleChange} className="w-5 h-5 text-rose-600 rounded border-rose-300 focus:ring-rose-500 cursor-pointer" />
                                </label>

                                <label className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer select-none transition-all shadow-sm ${formData.has_pets ? 'bg-blue-100/70 border-blue-400 ring-2 ring-blue-500/20 text-blue-900' : 'bg-blue-50/40 border-blue-200 hover:bg-blue-50/60 text-blue-800/90 hover:border-blue-300'}`}>
                                    <div className="flex items-center gap-3">
                                        <Dog className={`w-5 h-5 ${formData.has_pets ? 'text-blue-600' : 'text-blue-500'}`} />
                                        <div>
                                            <p className={`text-sm font-bold ${formData.has_pets ? 'text-blue-900 font-extrabold' : 'text-blue-800'}`}>Has Pets</p>
                                            <p className={`text-[11px] ${formData.has_pets ? 'text-blue-700/80' : 'text-blue-600/70'}`}>Dogs, cats, or others?</p>
                                        </div>
                                    </div>
                                    <input type="checkbox" name="has_pets" checked={formData.has_pets || false} onChange={handleChange} className="w-5 h-5 text-blue-600 rounded border-blue-300 focus:ring-blue-500 cursor-pointer" />
                                </label>

                                <label className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer select-none transition-all shadow-sm ${formData.has_small_kids ? 'bg-emerald-100/70 border-emerald-400 ring-2 ring-emerald-500/20 text-emerald-900' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                                    <div className="flex items-center gap-3">
                                        <Baby className={`w-5 h-5 ${formData.has_small_kids ? 'text-emerald-600' : 'text-emerald-500'}`} />
                                        <div>
                                            <p className={`text-sm font-bold ${formData.has_small_kids ? 'text-emerald-900 font-extrabold' : 'text-emerald-800'}`}>Has small Kids</p>
                                            <p className={`text-[11px] ${formData.has_small_kids ? 'text-emerald-700/80' : 'text-emerald-600/70'}`}>Toddlers or young kids?</p>
                                        </div>
                                    </div>
                                    <input type="checkbox" name="has_small_kids" checked={formData.has_small_kids || false} onChange={handleChange} className="w-5 h-5 text-emerald-600 rounded border-emerald-300 focus:ring-emerald-500 cursor-pointer" />
                                </label>

                                {formData.has_pets && (
                                    <div className="md:col-span-3 animate-in fade-in slide-in-from-top-2 duration-300 mt-2">
                                        <label className={labelClass}>Pet Details (What kind, how many?)</label>
                                        <input type="text" name="pets_details" value={formData.pets_details || ''} onChange={handleChange} className={inputClass} placeholder="e.g. 2 Golden Retrievers" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Agent Interest Level (Moved below Social & Lifestyle, and styled) */}
                        <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 mb-3">
                            <label className={`${labelClass} !text-indigo-700`}>Agent Interest Level</label>
                            <div className="relative">
                                <select 
                                    name="agent_interest_rating" 
                                    value={formData.agent_interest_rating || ''} 
                                    onChange={handleChange} 
                                    className={`${selectClass} !bg-white !border-indigo-200 focus:!border-indigo-500 focus:!ring-indigo-500/20`}
                                >
                                    <option value="High">High</option>
                                    <option value="Moderate">Moderate</option>
                                    <option value="Low">Low</option>
                                </select>
                            </div>
                        </div>

                        {/* Features Section */}
                        <div className="border-t border-slate-200 pt-3">
                            <button
                                type="button"
                                onClick={() => setIsFeaturesExpanded(!isFeaturesExpanded)}
                                className="w-full flex items-center justify-between text-sm font-bold text-slate-900 mb-3 group"
                            >
                                <span className="flex items-center gap-2">
                                    <Check className="w-4 h-4 text-slate-500" />
                                    Features
                                    <span className="text-xs font-normal text-slate-400 ml-2">
                                        ({(formData.preference_features || []).length} selected)
                                    </span>
                                </span>
                                {isFeaturesExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                                )}
                            </button>

                            {isFeaturesExpanded && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                    {Object.entries(FEATURE_CATEGORIES).map(([category, features]) => {
                                        const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS['Unit Features'];
                                        return (
                                            <div key={category} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                                <h4 className={`text-[10px] font-bold uppercase tracking-wider ${colors.text.replace('text-', 'text-slate-500 ')} mb-2 flex items-center gap-2`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                                                    {category}
                                                </h4>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                    {features.map(feature => (
                                                        <div key={feature}
                                                            onClick={() => handleFeatureToggle(feature)}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all border shadow-sm flex items-center gap-2 ${(formData.preference_features || []).includes(feature)
                                                                ? `${colors.bg} text-white border-transparent shadow-md`
                                                                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                                                }`}
                                                        >
                                                            {(formData.preference_features || []).includes(feature) ? (
                                                                <Check className="w-3 h-3 shrink-0" />
                                                            ) : (
                                                                <div className="w-3 h-3 rounded-full border border-slate-300 shrink-0" />
                                                            )}
                                                            <span className="truncate">{feature}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* VIEWING TAB */}
                {activeTab === 'viewing' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100 mb-6">
                            <h3 className="text-purple-800 font-bold flex items-center gap-2 mb-1">
                                <Eye className="w-5 h-5" />
                                Lead Score & History
                            </h3>
                            <p className="text-purple-600/80 text-sm">Track viewings and outcome.</p>
                        </div>

                        {/* Status Grid (Moved from Classification) */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className={labelClass}>Search Duration</label>
                                <div className="relative">
                                    <select name="search_duration" value={formData.search_duration || ''} onChange={handleChange} className={selectClass}>
                                        <option value="< 1 month">{'< 1 month'}</option>
                                        <option value="1-3 months">1-3 months</option>
                                        <option value="3-6 months">3-6 months</option>
                                        <option value="> 6 months">{'> 6 months'}</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Variants Viewed</label>
                                <div className="relative">
                                    <select name="viewed_count_total" value={formData.viewed_count_total || ''} onChange={handleChange} className={selectClass}>
                                        <option value="0">0</option>
                                        <option value="1-2 variants">1-2 variants</option>
                                        <option value="3-5 variants">3-5 variants</option>
                                        <option value="> 5 variants">{'> 5 variants'}</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Move Urgency</label>
                                <div className="relative">
                                    <select name="move_urgency" value={formData.move_urgency || ''} onChange={handleChange} className={selectClass}>
                                        <option value="< 1 month (Urgent)">{'< 1 month (Urgent)'}</option>
                                        <option value="1-3 months (Moderate)">1-3 months (Moderate)</option>
                                        <option value="> 3 months (Low)">{'> 3 months (Low)'}</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={labelClass}>Apartments Viewed (with me)</label>
                                <input type="number" name="viewed_count_agent" value={formData.viewed_count_agent || 0} onChange={handleChange} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Last Viewing Date</label>
                                <input type="date" name="last_viewing_date" value={formData.last_viewing_date || ''} onChange={handleChange} className={inputClass} />
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Outcome Status (Cum am ramas)</label>
                            <div className="relative">
                                <select name="outcome_status" value={formData.outcome_status || ''} onChange={handleChange} className={selectClass}>
                                    <option value="Mai cauta">Still Searching (Mai caută)</option>
                                    <option value="Asteapta Credit">Waiting for Credit</option>
                                    <option value="Se gandeste">Thinking about an offer</option>
                                    <option value="A facut oferta">Offer Made</option>
                                    <option value="Nu e interesat">Not Interested</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Next Steps / Summary (Motivul)</label>
                            <textarea
                                name="next_steps_summary"
                                rows={3}
                                placeholder="Ex: Asteapta aprobarea creditului, revin saptamana viitoare..."
                                value={formData.next_steps_summary || ''}
                                onChange={handleChange}
                                className={inputClass}
                            ></textarea>
                        </div>

                        <div className="pt-4 border-t border-slate-200">
                            <label className={labelClass}>General Notes</label>
                            <textarea name="notes" rows={4} value={formData.notes || ''} onChange={handleChange} className={inputClass} placeholder="Any other important details..."></textarea>
                        </div>
                    </div>
                )}

                {/* PROFILE TAB */}
                {activeTab === 'profile' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 mb-6">
                            <h3 className="text-indigo-800 font-bold flex items-center gap-2 mb-1">
                                <Fingerprint className="w-5 h-5" />
                                Social & Lifestyle Profile
                            </h3>
                            <p className="text-indigo-600/80 text-sm">Details about the lead's social status, family, and habits.</p>
                        </div>

                        {/* Personal & Family */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div>
                                <label className={labelClass}>Age</label>
                                <input type="number" name="age" value={formData.age || ''} onChange={handleChange} className={inputClass} placeholder="e.g. 35" />
                            </div>
                            <div>
                                <label className={labelClass}>Marital Status</label>
                                <select name="marital_status" value={formData.marital_status || 'Single'} onChange={handleChange} className={selectClass}>
                                    <option value="Single">Single</option>
                                    <option value="Married">Married</option>
                                    <option value="In a Relationship">In a Relationship</option>
                                    <option value="Divorced">Divorced</option>
                                    <option value="Widowed">Widowed</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Number of Kids</label>
                                <input type="number" name="kids_count" value={formData.kids_count || 0} onChange={handleChange} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Reason for Buying</label>
                                <select name="buying_reason" value={formData.buying_reason || 'Locuinta Personala'} onChange={handleChange} className={selectClass}>
                                    <option value="Locuinta Personala">Locuinta Personala</option>
                                    <option value="Investitie">Investitie</option>
                                    <option value="Locuinta pt copii">Locuinta pt copii</option>
                                    <option value="Locuinta de vacanta">Locuinta de vacanta</option>
                                    <option value="Sediu">Sediu</option>
                                </select>
                            </div>
                        </div>

                        {/* Property Ownership Expansion */}
                        <div className="p-6 bg-slate-900 text-white rounded-2xl border border-slate-700 shadow-xl overflow-hidden relative group">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Home className="w-24 h-24 rotate-12" />
                            </div>

                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-orange-500 rounded-lg">
                                        <Building2 className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-black tracking-tight">Existing Property Ownership</h4>
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Client Portfolio Details</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded-full ${formData.already_owns_properties ? 'bg-green-400 animate-pulse' : 'bg-slate-600'}`} />
                                            <div>
                                                <p className="text-sm font-black text-white leading-none">Already Owns Properties?</p>
                                                <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Current Status</p>
                                            </div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            name="already_owns_properties"
                                            checked={formData.already_owns_properties || false}
                                            onChange={handleChange}
                                            className="w-6 h-6 rounded-lg border-white/20 bg-white/10 text-orange-500 focus:ring-orange-500 transition-all cursor-pointer"
                                        />
                                    </div>

                                    {formData.already_owns_properties && (
                                        <div className="animate-in zoom-in-95 fade-in duration-300">
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Number of Properties Owned</label>
                                            <div className="relative">
                                                <PieChart className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400" />
                                                <input
                                                    type="number"
                                                    name="owned_properties_count"
                                                    value={formData.owned_properties_count || 0}
                                                    onChange={handleChange}
                                                    className="w-full bg-white/10 border-white/20 rounded-xl py-3 pl-12 pr-4 text-white font-black focus:border-orange-500 focus:ring-orange-500/20 transition-all"
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ownership / Usage Purpose</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div
                                                onClick={() => handleChange({ target: { name: 'ownership_purpose_investment', value: !formData.ownership_purpose_investment, type: 'checkbox', checked: !formData.ownership_purpose_investment } } as any)}
                                                className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${formData.ownership_purpose_investment ? 'bg-orange-500 border-transparent shadow-lg shadow-orange-500/20' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                                            >
                                                <TrendingUp className={`w-5 h-5 ${formData.ownership_purpose_investment ? 'text-white' : 'text-slate-400'}`} />
                                                <span className={`text-[10px] font-black uppercase tracking-tighter ${formData.ownership_purpose_investment ? 'text-white' : 'text-slate-400'}`}>Investment</span>
                                            </div>
                                            <div
                                                onClick={() => handleChange({ target: { name: 'ownership_purpose_personal', value: !formData.ownership_purpose_personal, type: 'checkbox', checked: !formData.ownership_purpose_personal } } as any)}
                                                className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${formData.ownership_purpose_personal ? 'bg-orange-500 border-transparent shadow-lg shadow-orange-500/20' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                                            >
                                                <User className={`w-5 h-5 ${formData.ownership_purpose_personal ? 'text-white' : 'text-slate-400'}`} />
                                                <span className={`text-[10px] font-black uppercase tracking-tighter ${formData.ownership_purpose_personal ? 'text-white' : 'text-slate-400'}`}>Personal</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Employment */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={labelClass}>Occupation / Job Title</label>
                                <div className="relative">
                                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input type="text" name="occupation" value={formData.occupation || ''} onChange={handleChange} className={`${inputClass} pl-11`} placeholder="e.g. Antreprenoeur, Project Manager, Mechanic, etc.." />
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Domain / Company</label>
                                <div className="relative">
                                    <Home className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input type="text" name="employer" value={formData.employer || ''} onChange={handleChange} className={`${inputClass} pl-11`} placeholder="e.g. IT, Doctor, Marketing, etc.." />
                                </div>
                            </div>
                        </div>

                        {/* Living Situation */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={labelClass}>Living Situation</label>
                                <select name="living_situation" value={formData.living_situation || 'In Town'} onChange={handleChange} className={selectClass}>
                                    <option value="In Town">Lives in Town</option>
                                    <option value="Outside Town">Lives Outside Town (Commuter)</option>
                                    <option value="Relocating">Relocating from another city</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Current City</label>
                                <input type="text" name="current_city" value={formData.current_city || ''} onChange={handleChange} className={inputClass} placeholder="Where do they live now?" />
                            </div>
                        </div>



                        {/* Points of Interest */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="h-6 w-1 bg-indigo-500 rounded-full"></div>
                                <h4 className="text-sm font-bold text-slate-700 uppercase tracking-widest">Points of Interest & Favorite Locations</h4>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className={labelClass}>Other Important Places</label>
                                    <textarea
                                        rows={3}
                                        value={formData.points_of_interest?.others || ''}
                                        onChange={(e) => handlePOIChange('others', e.target.value)}
                                        className={inputClass}
                                        placeholder="Schools, Kindergarten (Names & Addresses), Supermarkets, Markets, Parks, Recreation, Office, Work Location, Public Transport, etc."
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={labelClass}>Preferences (Ce isi doreste)</label>
                                <textarea
                                    name="social_notes"
                                    rows={4}
                                    placeholder="e.g. High floor, quiet area, near subway..."
                                    value={formData.social_notes || ''}
                                    onChange={handleChange}
                                    className={inputClass}
                                ></textarea>
                            </div>
                            <div>
                                <label className={labelClass}>Negative Preferences (Ce NU doreste)</label>
                                <textarea
                                    name="negative_preferences"
                                    rows={4}
                                    placeholder="e.g. No ground floor, no construction sites nearby..."
                                    value={formData.negative_preferences || ''}
                                    onChange={handleChange}
                                    className={inputClass}
                                ></textarea>
                            </div>
                        </div>
                    </div>
                )}
            </fieldset>

            {/* Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center">
                <div className="text-xs text-slate-400 font-mono">
                    {/* Optional Status text */}
                    Tab: {activeTab === 'viewing' ? 'LEAD SCORE' : activeTab === 'profile' ? 'LEAD PROFILE' : activeTab.toUpperCase()}
                </div>
                <div className="flex gap-3 items-center">
                    {isSuccess && (
                        <span className="text-sm font-bold text-green-600 flex items-center gap-1 animate-in fade-in slide-in-from-right-4 mr-2">
                            <Check className="w-4 h-4" /> Saved changes
                        </span>
                    )}
                    {onCancel && (
                        <button type="button" onClick={onCancel} className="px-6 py-2 border border-slate-300 rounded-lg font-bold text-slate-600 hover:bg-white transition-colors">
                            Cancel
                        </button>
                    )}
                    {!readOnly && (
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-6 py-2 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
                        >
                            <Save className="w-4 h-4" />
                            {isLoading ? 'Saving...' : (isEditing ? 'Update Lead' : 'Create Client')}
                        </button>
                    )}
                </div>
            </div>
        </form>
    );
}
