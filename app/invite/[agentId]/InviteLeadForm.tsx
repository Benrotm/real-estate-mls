'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createLeadPublic } from '@/app/lib/actions/leads';
import { LeadData } from '@/app/lib/types';
import DrawAreaSelector from '@/app/components/DrawAreaSelector';
import { ROMANIAN_CITIES, TIMISOARA_AREAS, formatCityList, cleanCityName, normalizeText } from '@/app/lib/constants/locations';
import MultiSearchableSelect from '@/app/components/MultiSearchableSelect';
import { getSystemLocations } from '@/app/lib/actions/admin-settings';
import { 
    ChevronDown, 
    ChevronUp, 
    CheckCircle, 
    MapPin, 
    Loader2 
} from 'lucide-react';

interface Props {
    agentId: string;
}

export default function InviteLeadForm({ agentId }: Props) {
    // Form State
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [listingType, setListingType] = useState<'For Sale' | 'For Rent'>('For Sale');
    const [propertyType, setPropertyType] = useState<'Apartment' | 'House' | 'Land' | 'Commercial'>('Apartment');
    const [rooms, setRooms] = useState(2);
    const [budget, setBudget] = useState('');
    const [city, setCity] = useState('Timișoara');
    const [area, setArea] = useState('');
    const [citiesList, setCitiesList] = useState<string[]>(ROMANIAN_CITIES);
    const [citiesListFull, setCitiesListFull] = useState<{ id: string; name: string }[]>([]);
    const [allRawAreas, setAllRawAreas] = useState<{ name: string; parent_id: string | null }[]>([]);
    const [searchWithAgent, setSearchWithAgent] = useState(true);
    const [searchDirectOwner, setSearchDirectOwner] = useState(true);

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
        const selectedCityNames = city
            ? city.split(',').map(c => cleanCityName(c).trim()).filter(Boolean)
            : [];

        if (selectedCityNames.length === 0) {
            return [];
        }

        const normalizedSelected = selectedCityNames.map(name => normalizeText(name));

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
    }, [city, citiesListFull, allRawAreas]);

    const [polygon, setPolygon] = useState<{ lat: number; lng: number }[] | undefined>(undefined);

    // Accordion State
    const [showMoreDetails, setShowMoreDetails] = useState(false);

    // Optional Fields State
    const [surfaceMin, setSurfaceMin] = useState('');
    const [urgency, setUrgency] = useState('');
    const [hasSmallKids, setHasSmallKids] = useState(false);
    const [hasPets, setHasPets] = useState(false);
    const [notes, setNotes] = useState('');

    // Interface State
    const [showMap, setShowMap] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};
        if (!name.trim()) newErrors.name = 'Name or nickname is required';
        if (!phone.trim()) newErrors.phone = 'Phone number is required';
        if (!budget.trim() || isNaN(Number(budget)) || Number(budget) <= 0) {
            newErrors.budget = 'A valid budget is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);

        const leadPayload: LeadData = {
            name: name.trim(),
            phone: phone.trim(),
            status: 'new',
            preference_listing_type: listingType,
            preference_type: propertyType,
            preference_rooms_min: rooms,
            preference_rooms_max: rooms === 4 ? undefined : rooms,
            budget_max: Number(budget),
            currency: 'EUR',
            preference_location_city: city.trim(),
            preference_location_area: area.trim() || undefined,
            preference_location_polygon: polygon,
            preference_surface_min: surfaceMin ? Number(surfaceMin) : undefined,
            move_urgency: urgency || undefined,
            has_small_kids: hasSmallKids,
            has_pets: hasPets,
            social_notes: notes.trim() || undefined,
            notes: notes.trim() || undefined,
            search_with_agent: searchWithAgent,
            search_direct_owner: searchDirectOwner
        };

        try {
            const res = await createLeadPublic(agentId, leadPayload);
            if (res.success) {
                setIsSuccess(true);
            } else {
                alert(res.error || 'Failed to submit form.');
            }
        } catch (err) {
            console.error('Error submitting public lead', err);
            alert('An unexpected error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="text-center py-12 px-4 space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="flex justify-center">
                    <div className="p-4 bg-green-50 rounded-full animate-bounce">
                        <CheckCircle className="w-16 h-16 text-green-600" />
                    </div>
                </div>
                <h2 className="text-2xl font-black text-slate-800">Preferences Submitted!</h2>
                <p className="text-slate-500 font-medium max-w-sm mx-auto leading-relaxed text-sm">
                    Thank you! We will analyze matching properties and send you a customized list shortly.
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Buy / Rent Toggle */}
            <div>
                <label className="block text-xs font-black uppercase tracking-wider text-orange-600 mb-2">
                    I want to
                </label>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={() => setListingType('For Sale')}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-bold text-center transition-all ${listingType === 'For Sale' ? 'border-orange-500 bg-orange-50/50 text-orange-600 font-extrabold shadow-sm shadow-orange-500/5' : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'}`}
                    >
                        Buy
                    </button>
                    <button
                        type="button"
                        onClick={() => setListingType('For Rent')}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-bold text-center transition-all ${listingType === 'For Rent' ? 'border-orange-500 bg-orange-50/50 text-orange-600 font-extrabold shadow-sm shadow-orange-500/5' : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'}`}
                    >
                        Rent
                    </button>
                </div>
            </div>

            {/* Property Type Selection Chips */}
            <div>
                <label className="block text-xs font-black uppercase tracking-wider text-orange-600 mb-2">
                    Property Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['Apartment', 'House', 'Land', 'Commercial'] as const).map(type => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => setPropertyType(type)}
                            className={`py-2.5 px-3 rounded-xl border text-xs font-bold text-center transition-all ${propertyType === type ? 'border-orange-500 bg-orange-50/50 text-orange-600 font-extrabold shadow-sm shadow-orange-500/5' : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'}`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            {/* Rooms or Surface Selector based on Property Type */}
            {propertyType === 'Land' || propertyType === 'Commercial' ? (
                <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-orange-600 mb-2">
                        Surface (sqm) <span className="text-rose-500">*</span>
                    </label>
                    <input
                        type="number"
                        value={surfaceMin}
                        onChange={(e) => setSurfaceMin(e.target.value)}
                        placeholder="e.g. 500"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-semibold transition-all outline-none focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500"
                    />
                </div>
            ) : (
                <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-orange-600 mb-2">
                        Number of Rooms
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                        {([1, 2, 3, 4] as const).map(num => (
                            <button
                                key={num}
                                type="button"
                                onClick={() => setRooms(num)}
                                className={`py-2.5 px-3 rounded-xl border text-xs font-bold text-center transition-all ${rooms === num ? 'border-orange-500 bg-orange-50/50 text-orange-600 font-extrabold shadow-sm shadow-orange-500/5' : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'}`}
                            >
                                {num === 4 ? '4+' : num}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Budget */}
            <div>
                <label className="block text-xs font-black uppercase tracking-wider text-orange-600 mb-2">
                    Budget Maxim (EUR) <span className="text-rose-500">*</span>
                </label>
                <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="e.g. 120000"
                    className={`w-full px-4 py-3 rounded-xl border bg-slate-50 text-slate-900 text-sm font-semibold transition-all outline-none focus:bg-white focus:ring-4 focus:ring-orange-500/10 ${errors.budget ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-orange-500'}`}
                />
                {errors.budget && <p className="text-xs text-rose-500 mt-1 font-bold">{errors.budget}</p>}
            </div>

            {/* Area of Interest (City, Area & Map Draw) */}
            <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-black uppercase tracking-wider text-orange-600 mb-2">
                            City
                        </label>
                        <MultiSearchableSelect
                            values={city ? city.split(',').map(c => c.trim()).filter(Boolean) : []}
                            options={citiesList}
                            onChange={(vals) => setCity(vals.join(', '))}
                            placeholder="Type or select cities..."
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-semibold transition-all outline-none focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black uppercase tracking-wider text-orange-600 mb-2">
                            Area / Neighbourhood
                        </label>
                        <MultiSearchableSelect
                            values={area ? area.split(',').map(a => a.trim()).filter(Boolean) : []}
                            options={filteredAreasList}
                            onChange={(vals) => setArea(vals.join(', '))}
                            placeholder={filteredAreasList.length ? "Type or Select More Areas" : "Select city first..."}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-semibold transition-all outline-none focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-orange-600 mb-2">
                        Draw on Map the exact area
                    </label>
                    <button
                        type="button"
                        onClick={() => setShowMap(true)}
                        className={`w-full flex items-center justify-center gap-1.5 px-4 py-3 border rounded-xl text-xs font-black transition-all active:scale-95 ${polygon?.length ? 'border-violet-500 bg-violet-50 text-violet-700 font-extrabold' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'}`}
                    >
                        <MapPin className="w-4 h-4" />
                        {polygon?.length ? 'Edit Area on Map' : 'Draw Area on Map'}
                    </button>
                </div>
                {polygon?.length && (
                    <div className="text-[10px] text-green-600 font-black flex items-center gap-1 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
                        ✓ Specific search boundaries drawn on the map
                    </div>
                )}
            </div>

            {/* Map Selector Modal */}
            {showMap && (
                <DrawAreaSelector
                    city={city}
                    value={polygon}
                    onChange={(poly) => setPolygon(poly || undefined)}
                    onClose={() => setShowMap(false)}
                />
            )}

            {/* Name or Nickname */}
            <div>
                <label className="block text-xs font-black uppercase tracking-wider text-orange-600 mb-2">
                    Name or Nickname <span className="text-rose-500">*</span>
                </label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className={`w-full px-4 py-3 rounded-xl border bg-slate-50 text-slate-900 text-sm font-semibold transition-all outline-none focus:bg-white focus:ring-4 focus:ring-orange-500/10 ${errors.name ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-orange-500'}`}
                />
                {errors.name && <p className="text-xs text-rose-500 mt-1 font-bold">{errors.name}</p>}
            </div>

            {/* Phone Number */}
            <div>
                <label className="block text-xs font-black uppercase tracking-wider text-orange-600 mb-1">
                    Phone Number <span className="text-rose-500">*</span>
                </label>
                <span className="text-slate-400 font-medium text-[10px] md:text-xs block mb-2">
                    (where the link with matching properties will be sent)
                </span>
                <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +40 722 000 000"
                    className={`w-full px-4 py-3 rounded-xl border bg-slate-50 text-slate-900 text-sm font-semibold transition-all outline-none focus:bg-white focus:ring-4 focus:ring-orange-500/10 ${errors.phone ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-orange-500'}`}
                />
                {errors.phone && <p className="text-xs text-rose-500 mt-1 font-bold">{errors.phone}</p>}
            </div>

            {/* Property Source / Checkboxes moved right before Optional Details */}
            <div>
                <label className="block text-xs font-black uppercase tracking-wider text-orange-600 mb-2">
                    Find Properties From
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer select-none transition-all ${searchWithAgent ? 'border-orange-500 bg-orange-50/50 text-orange-900 shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>
                        <input
                            type="checkbox"
                            checked={searchWithAgent}
                            onChange={(e) => setSearchWithAgent(e.target.checked)}
                            className="rounded border-slate-300 text-orange-600 focus:ring-orange-500/20 w-4 h-4 cursor-pointer shrink-0"
                        />
                        <div className="flex flex-col min-w-0">
                            <span className="text-xs font-extrabold">Get help from an Real Estate Broker</span>
                            <span className="text-[10px] text-slate-400 font-medium">Properties listed by agencies & brokers</span>
                        </div>
                    </label>

                    <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer select-none transition-all ${searchDirectOwner ? 'border-orange-500 bg-orange-50/50 text-orange-900 shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>
                        <input
                            type="checkbox"
                            checked={searchDirectOwner}
                            onChange={(e) => setSearchDirectOwner(e.target.checked)}
                            className="rounded border-slate-300 text-orange-600 focus:ring-orange-500/20 w-4 h-4 cursor-pointer shrink-0"
                        />
                        <div className="flex flex-col min-w-0">
                            <span className="text-xs font-extrabold">Find yourself from Property Owners</span>
                            <span className="text-[10px] text-slate-400 font-medium">Directly from owners without intermediary</span>
                        </div>
                    </label>
                </div>
            </div>

            {/* Optional Details Collapsible Accordion */}
            <div className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50">
                <button
                    type="button"
                    onClick={() => setShowMoreDetails(!showMoreDetails)}
                    className="w-full px-4 py-3.5 flex items-center justify-between text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100/70 border-b border-slate-100 transition-colors"
                >
                    <span>Optional details (Urgency, surface, comments...)</span>
                    {showMoreDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                
                {showMoreDetails && (
                    <div className="p-4 space-y-4 bg-white animate-in slide-in-from-top-4 duration-200">
                        {/* Min Surface / Moving Urgency */}
                        <div className={`grid ${propertyType === 'Land' || propertyType === 'Commercial' ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
                            {propertyType !== 'Land' && propertyType !== 'Commercial' && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">Min Surface (sqm)</label>
                                    <input
                                        type="number"
                                        value={surfaceMin}
                                        onChange={(e) => setSurfaceMin(e.target.value)}
                                        placeholder="e.g. 50"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-xs font-medium focus:outline-none focus:border-orange-500"
                                    />
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Moving Urgency</label>
                                <select
                                    value={urgency}
                                    onChange={(e) => setUrgency(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-xs font-medium focus:outline-none focus:border-orange-500 bg-white"
                                >
                                    <option value="">Select urgency</option>
                                    <option value="Urgent">Urgent (&lt; 1 month)</option>
                                    <option value="Moderate">Moderate (1-3 months)</option>
                                    <option value="Low">Low (&gt; 3 months)</option>
                                </select>
                            </div>
                        </div>

                        {/* Checkboxes cards for kids & pets */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <label className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer select-none transition-all ${hasSmallKids ? 'border-orange-500 bg-orange-50/30' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                                <input
                                    type="checkbox"
                                    checked={hasSmallKids}
                                    onChange={(e) => setHasSmallKids(e.target.checked)}
                                    className="rounded border-slate-300 text-orange-600 focus:ring-orange-500/20 w-4 h-4 cursor-pointer"
                                />
                                <div className="flex flex-col">
                                    <span className="text-xs font-black text-slate-800">I have small kids</span>
                                    <span className="text-[10px] text-slate-400 font-medium">Toddlers or young kids</span>
                                </div>
                            </label>

                            <label className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer select-none transition-all ${hasPets ? 'border-orange-500 bg-orange-50/30' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                                <input
                                    type="checkbox"
                                    checked={hasPets}
                                    onChange={(e) => setHasPets(e.target.checked)}
                                    className="rounded border-slate-300 text-orange-600 focus:ring-orange-500/20 w-4 h-4 cursor-pointer"
                                />
                                <div className="flex flex-col">
                                    <span className="text-xs font-black text-slate-800">I have a friendly Pet</span>
                                    <span className="text-[10px] text-slate-400 font-medium">Dogs, cats, or others</span>
                                </div>
                            </label>
                        </div>

                        {/* Additional Notes */}
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1">Additional requirements or notes</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Describe parking spaces, floor preferences, balconies..."
                                rows={3}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 text-xs font-medium focus:outline-none focus:border-orange-500"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all shadow-md shadow-orange-500/10 active:scale-98 disabled:opacity-50 disabled:pointer-events-none"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Sending Request...
                    </>
                ) : (
                    'Send Request'
                )}
            </button>
        </form>
    );
}
