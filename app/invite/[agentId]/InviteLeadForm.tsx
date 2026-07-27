'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createLeadPublic, submitClientNoAgencyFromInvite } from '@/app/lib/actions/leads';
import { LeadData } from '@/app/lib/types';
import DrawAreaSelector from '@/app/components/DrawAreaSelector';
import { ROMANIAN_CITIES, TIMISOARA_AREAS, formatCityList, cleanCityName, normalizeText } from '@/app/lib/constants/locations';
import MultiSearchableSelect from '@/app/components/MultiSearchableSelect';
import { getSystemLocations } from '@/app/lib/actions/admin-settings';
import { 
    CheckCircle, 
    MapPin, 
    Loader2,
    Calendar,
    Users,
    Baby,
    Dog,
    Link as LinkIcon,
    Plus,
    Trash2,
    Mail,
    Lock
} from 'lucide-react';

interface Props {
    agentId: string;
    mode?: string;
}

export default function InviteLeadForm({ agentId, mode }: Props) {
    // Form State
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [listingType, setListingType] = useState<'For Sale' | 'For Rent'>('For Sale');
    const [propertyType, setPropertyType] = useState<'Apartment' | 'House' | 'Land' | 'Commercial'>('Apartment');
    const [rooms, setRooms] = useState(2);
    const [budgetMin, setBudgetMin] = useState('');
    const [budgetMax, setBudgetMax] = useState('');
    const [city, setCity] = useState('Timișoara');
    const [area, setArea] = useState('');
    const [citiesList, setCitiesList] = useState<string[]>(ROMANIAN_CITIES);
    const [citiesListFull, setCitiesListFull] = useState<{ id: string; name: string }[]>([]);
    const [allRawAreas, setAllRawAreas] = useState<{ name: string; parent_id: string | null }[]>([]);
    const [searchWithAgent, setSearchWithAgent] = useState(mode === 'crm_invite');
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

    // Optional Fields State
    const [surfaceMin, setSurfaceMin] = useState('');
    const [moveInDate, setMoveInDate] = useState('');
    const [occupantsInfo, setOccupantsInfo] = useState('');
    const [hasSmallKids, setHasSmallKids] = useState(false);
    const [hasPets, setHasPets] = useState(false);
    const [notes, setNotes] = useState('');
    const [likedListingsLinks, setLikedListingsLinks] = useState<string[]>(['']);

    const handleLinkChange = (index: number, value: string) => {
        const updated = [...likedListingsLinks];
        updated[index] = value;
        setLikedListingsLinks(updated);
    };

    const handleAddLink = () => {
        setLikedListingsLinks(prev => [...prev, '']);
    };

    const handleRemoveLink = (index: number) => {
        setLikedListingsLinks(prev => {
            const updated = prev.filter((_, i) => i !== index);
            return updated.length > 0 ? updated : [''];
        });
    };

    // Interface State
    const [showMap, setShowMap] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};
        if (!name.trim()) newErrors.name = 'Numele sau nickname-ul este obligatoriu';
        if (!phone.trim()) newErrors.phone = 'Numărul de telefon este obligatoriu';
        if (!budgetMax.trim() || isNaN(Number(budgetMax)) || Number(budgetMax) <= 0) {
            newErrors.budget = 'Introduceți un buget maxim valid';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);

        const validLinks = likedListingsLinks.map(l => l.trim()).filter(Boolean);
        const formattedLinks = validLinks.length > 0
            ? (validLinks.length === 1 ? validLinks[0] : JSON.stringify(validLinks))
            : undefined;

        const leadPayload: LeadData = {
            name: name.trim(),
            phone: phone.trim(),
            status: 'new',
            preference_listing_type: listingType,
            preference_type: propertyType,
            preference_rooms_min: rooms,
            preference_rooms_max: rooms === 4 ? undefined : rooms,
            budget_min: budgetMin ? Number(budgetMin) : undefined,
            budget_max: Number(budgetMax),
            currency: 'EUR',
            preference_location_city: city.trim(),
            preference_location_area: area.trim() || undefined,
            preference_location_polygon: polygon,
            preference_surface_min: surfaceMin ? Number(surfaceMin) : undefined,
            move_in_date: moveInDate || undefined,
            occupants_info: listingType === 'For Rent' ? occupantsInfo.trim() || undefined : undefined,
            has_small_kids: listingType === 'For Rent' ? hasSmallKids : false,
            has_pets: listingType === 'For Rent' ? hasPets : false,
            social_notes: notes.trim() || undefined,
            notes: notes.trim() || undefined,
            liked_listings_links: formattedLinks,
            search_with_agent: searchWithAgent,
            search_direct_owner: searchDirectOwner
        };

        try {
            if (mode === 'client_no_agency') {
                const res = await submitClientNoAgencyFromInvite(agentId, {
                    name: name.trim(),
                    phone: phone.trim(),
                    leadData: leadPayload
                });

                if (res.success && res.redirectUrl) {
                    window.location.href = res.redirectUrl;
                    return;
                } else {
                    alert(res.error || 'A apărut o eroare la crearea contului tău.');
                }
            } else {
                const res = await createLeadPublic(agentId, leadPayload);
                if (res.success) {
                    setIsSuccess(true);
                } else {
                    alert(res.error || 'A apărut o eroare la trimiterea formularului.');
                }
            }
        } catch (err: any) {
            console.error('Error submitting public lead', err);
            alert('A apărut o eroare neașteptată: ' + (err.message || 'Vă rugăm să încercați din nou.'));
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
                <h2 className="text-2xl font-black text-slate-800">Cererea ta a fost trimisă cu succes!</h2>
                <p className="text-slate-500 font-medium max-w-sm mx-auto leading-relaxed text-sm">
                    Îți mulțumim! Vom analiza proprietățile potrivite și îți vom trimite un link personalizat în cel mai scurt timp.
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Buy / Rent Toggle */}
            <div>
                <label className="block text-xs font-black uppercase tracking-wider text-orange-600 mb-2">
                    VREAU SĂ
                </label>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={() => setListingType('For Sale')}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-bold text-center transition-all ${listingType === 'For Sale' ? 'border-orange-500 bg-orange-50/50 text-orange-600 font-extrabold shadow-sm shadow-orange-500/5' : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'}`}
                    >
                        Cumpăr (De vânzare)
                    </button>
                    <button
                        type="button"
                        onClick={() => setListingType('For Rent')}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-bold text-center transition-all ${listingType === 'For Rent' ? 'border-orange-500 bg-orange-50/50 text-orange-600 font-extrabold shadow-sm shadow-orange-500/5' : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'}`}
                    >
                        Închiriez (De închiriat)
                    </button>
                </div>
            </div>

            {/* Property Type Selection Chips */}
            <div>
                <label className="block text-xs font-black uppercase tracking-wider text-orange-600 mb-2">
                    TIP PROPRIETATE
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                        { key: 'Apartment', label: 'Apartament' },
                        { key: 'House', label: 'Casă' },
                        { key: 'Land', label: 'Teren' },
                        { key: 'Commercial', label: 'Spațiu Comercial' },
                    ].map(item => (
                        <button
                            key={item.key}
                            type="button"
                            onClick={() => setPropertyType(item.key as any)}
                            className={`py-2.5 px-3 rounded-xl border text-xs font-bold text-center transition-all ${propertyType === item.key ? 'border-orange-500 bg-orange-50/50 text-orange-600 font-extrabold shadow-sm shadow-orange-500/5' : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'}`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Rooms or Surface Selector based on Property Type */}
            {propertyType === 'Land' || propertyType === 'Commercial' ? (
                <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-orange-600 mb-2">
                        Suprafață Minimă (mp)
                    </label>
                    <input
                        type="number"
                        value={surfaceMin}
                        onChange={(e) => setSurfaceMin(e.target.value)}
                        placeholder="ex. 500"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-semibold transition-all outline-none focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500"
                    />
                </div>
            ) : (
                <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-orange-600 mb-2">
                        NUMĂR CAMERE
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

            {/* Budget Min & Max */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-orange-600 mb-2">
                        BUGET MINIM (EUR)
                    </label>
                    <input
                        type="number"
                        value={budgetMin}
                        onChange={(e) => setBudgetMin(e.target.value)}
                        placeholder="ex. 50000"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-semibold transition-all outline-none focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500"
                    />
                </div>

                <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-orange-600 mb-2">
                        BUGET MAXIM (EUR) <span className="text-rose-500">*</span>
                    </label>
                    <input
                        type="number"
                        value={budgetMax}
                        onChange={(e) => setBudgetMax(e.target.value)}
                        placeholder="ex. 120000"
                        className={`w-full px-4 py-3 rounded-xl border bg-slate-50 text-slate-900 text-sm font-semibold transition-all outline-none focus:bg-white focus:ring-4 focus:ring-orange-500/10 ${errors.budget ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-orange-500'}`}
                    />
                    {errors.budget && <p className="text-xs text-rose-500 mt-1 font-bold">{errors.budget}</p>}
                </div>
            </div>

            {/* Min Surface if apartment/house */}
            {(propertyType === 'Apartment' || propertyType === 'House') && (
                <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-orange-600 mb-2">
                        SUPRAFAȚĂ MINIMĂ (MP)
                    </label>
                    <input
                        type="number"
                        value={surfaceMin}
                        onChange={(e) => setSurfaceMin(e.target.value)}
                        placeholder="ex. 50"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-semibold transition-all outline-none focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500"
                    />
                </div>
            )}

            {/* Area of Interest (City, Area & Map Draw) */}
            <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-black uppercase tracking-wider text-orange-600 mb-2">
                            Oraș
                        </label>
                        <MultiSearchableSelect
                            values={city ? city.split(',').map(c => c.trim()).filter(Boolean) : []}
                            options={citiesList}
                            onChange={(vals) => setCity(vals.join(', '))}
                            placeholder="Scrie sau selectează orașe..."
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-semibold transition-all outline-none focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black uppercase tracking-wider text-orange-600 mb-2">
                            Zonă / Cartier
                        </label>
                        <MultiSearchableSelect
                            values={area ? area.split(',').map(a => a.trim()).filter(Boolean) : []}
                            options={filteredAreasList}
                            onChange={(vals) => setArea(vals.join(', '))}
                            placeholder={filteredAreasList.length ? "Scrie sau selectează zone..." : "Selectează mai întâi orașul..."}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-semibold transition-all outline-none focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-orange-600 mb-2">
                        Desenează pe hartă zona exactă
                    </label>
                    <button
                        type="button"
                        onClick={() => setShowMap(true)}
                        className={`w-full flex items-center justify-center gap-1.5 px-4 py-3 border rounded-xl text-xs font-black transition-all active:scale-95 ${polygon?.length ? 'border-violet-500 bg-violet-50 text-violet-700 font-extrabold' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'}`}
                    >
                        <MapPin className="w-4 h-4" />
                        {polygon?.length ? 'Editează zona pe hartă' : 'Desenează zona pe hartă'}
                    </button>
                </div>
                {polygon?.length && (
                    <div className="text-[10px] text-green-600 font-black flex items-center gap-1 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
                        ✓ Zone specifice desenate pe hartă
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

            {/* Moving Target Date */}
            <div>
                <label className="block text-xs font-black uppercase tracking-wider text-orange-600 mb-2 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    De când doriți să vă mutați?
                </label>
                <input
                    type="date"
                    value={moveInDate}
                    onChange={(e) => setMoveInDate(e.target.value)}
                    onClick={(e) => {
                        try {
                            (e.currentTarget as any).showPicker?.();
                        } catch {}
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-semibold transition-all outline-none focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 cursor-pointer"
                />
            </div>

            {/* Conditional Rent-Only Fields */}
            {listingType === 'For Rent' && (
                <div className="p-4 bg-orange-50/40 rounded-2xl border border-orange-100 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div>
                        <label className="block text-xs font-black uppercase tracking-wider text-orange-700 mb-2 flex items-center gap-1.5">
                            <Users className="w-4 h-4" />
                            Cine va locui în apartament?
                        </label>
                        <input
                            type="text"
                            value={occupantsInfo}
                            onChange={(e) => setOccupantsInfo(e.target.value)}
                            placeholder="ex. Eu și soția, 2 studenți, 3 studente, cuplu, o persoană, etc..."
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-semibold transition-all outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer select-none transition-all ${hasSmallKids ? 'border-orange-500 bg-orange-50 text-orange-900 shadow-sm font-extrabold' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>
                            <input
                                type="checkbox"
                                checked={hasSmallKids}
                                onChange={(e) => setHasSmallKids(e.target.checked)}
                                className="rounded border-slate-300 text-orange-600 focus:ring-orange-500/20 w-4 h-4 cursor-pointer shrink-0"
                            />
                            <div className="flex items-center gap-2">
                                <Baby className="w-4 h-4 text-orange-600 shrink-0" />
                                <span className="text-xs">Am copii mici</span>
                            </div>
                        </label>

                        <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer select-none transition-all ${hasPets ? 'border-orange-500 bg-orange-50 text-orange-900 shadow-sm font-extrabold' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>
                            <input
                                type="checkbox"
                                checked={hasPets}
                                onChange={(e) => setHasPets(e.target.checked)}
                                className="rounded border-slate-300 text-orange-600 focus:ring-orange-500/20 w-4 h-4 cursor-pointer shrink-0"
                            />
                            <div className="flex items-center gap-2">
                                <Dog className="w-4 h-4 text-orange-600 shrink-0" />
                                <span className="text-xs">Am animal de companie</span>
                            </div>
                        </label>
                    </div>
                </div>
            )}

            {/* Liked Listing Links */}
            <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-orange-600 mb-1 flex items-center gap-1.5">
                    <LinkIcon className="w-4 h-4" />
                    Lasă mai jos Link cu ce ai văzut și ți-a plăcut:
                </label>

                {likedListingsLinks.map((link, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                        <input
                            type="text"
                            value={link}
                            onChange={(e) => handleLinkChange(idx, e.target.value)}
                            placeholder="Link de pe Facebook, TikTok, sau alte site-uri..."
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-semibold transition-all outline-none focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500"
                        />
                        {likedListingsLinks.length > 1 && (
                            <button
                                type="button"
                                onClick={() => handleRemoveLink(idx)}
                                className="p-3 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl border border-slate-200 transition-colors shrink-0"
                                title="Șterge link"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                ))}

                <button
                    type="button"
                    onClick={handleAddLink}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors mt-1"
                >
                    <Plus className="w-3.5 h-3.5" /> Adaugă alt link
                </button>
            </div>

            {/* What interests you */}
            <div>
                <label className="block text-xs font-black uppercase tracking-wider text-orange-600 mb-2">
                    Ce te interesează?
                </label>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="ex. Prețul e negociabil?, Zonă exactă, Balcon spațios, etaj intermediar, parcare, etc..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-semibold transition-all outline-none focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500"
                />
            </div>

            {/* Nickname / Name */}
            <div>
                <label className="block text-xs font-black uppercase tracking-wider text-orange-600 mb-2">
                    NICKNAME / NUME <span className="text-rose-500">*</span>
                </label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ex. Popescu Ion sau Ion123"
                    className={`w-full px-4 py-3 rounded-xl border bg-slate-50 text-slate-900 text-sm font-semibold transition-all outline-none focus:bg-white focus:ring-4 focus:ring-orange-500/10 ${errors.name ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-orange-500'}`}
                />
                {errors.name && <p className="text-xs text-rose-500 mt-1 font-bold">{errors.name}</p>}
            </div>

            {/* Phone Number */}
            <div>
                <label className="block text-xs font-black uppercase tracking-wider text-orange-600 mb-1">
                    NUMĂR DE TELEFON <span className="text-rose-500">*</span>
                </label>
                <span className="text-slate-400 font-medium text-[10px] md:text-xs block mb-2">
                    (unde vei primi linkul cu proprietățile potrivite)
                </span>
                <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="ex. 0722 000 000"
                    className={`w-full px-4 py-3 rounded-xl border bg-slate-50 text-slate-900 text-sm font-semibold transition-all outline-none focus:bg-white focus:ring-4 focus:ring-orange-500/10 ${errors.phone ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-orange-500'}`}
                />
                {errors.phone && <p className="text-xs text-rose-500 mt-1 font-bold">{errors.phone}</p>}
            </div>

            {/* Property Source / Checkboxes - Hidden on crm_invite flow */}
            {mode !== 'crm_invite' && (
                <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-orange-600 mb-2">
                        GĂSEȘTE PROPRIETĂȚI DE LA
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
                                <span className="text-xs font-extrabold">Vreau ajutor de la un Agent / Broker Imobiliar</span>
                                <span className="text-[10px] text-slate-400 font-medium">Proprietăți listate de agenții și brokeri</span>
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
                                <span className="text-xs font-extrabold">Găsește singur de la Proprietari</span>
                                <span className="text-[10px] text-slate-400 font-medium">Direct de la proprietari, fără intermediari</span>
                            </div>
                        </label>
                    </div>
                </div>
            )}

            {/* Submit Button */}
            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all shadow-md shadow-orange-500/10 active:scale-98 disabled:opacity-50 disabled:pointer-events-none"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Se procesează...
                    </>
                ) : (
                    mode === 'client_no_agency' ? 'Caută cu AI' : 'Trimite'
                )}
            </button>
        </form>
    );
}
