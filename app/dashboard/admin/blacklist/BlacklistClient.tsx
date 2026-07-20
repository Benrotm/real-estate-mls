'use client';

import React, { useState, useTransition } from 'react';
import { ShieldAlert, Building, Search, Plus, Trash2, RefreshCw, AlertTriangle, PhoneCall, MapPin, User, Calendar, ExternalLink, CheckCircle2, Filter } from 'lucide-react';
import {
    BlacklistedPhone,
    BlacklistedProperty,
    addPhoneToBlacklist,
    removePhoneFromBlacklist,
    restorePropertyFromBlacklist,
    deleteBlacklistedProperty
} from '@/app/lib/actions/blacklist';
import Link from 'next/link';

interface BlacklistClientProps {
    initialPhones: BlacklistedPhone[];
    initialProperties: BlacklistedProperty[];
}

export default function BlacklistClient({ initialPhones, initialProperties }: BlacklistClientProps) {
    const [activeTab, setActiveTab] = useState<'phones' | 'properties'>('phones');
    const [phones, setPhones] = useState<BlacklistedPhone[]>(initialPhones);
    const [properties, setProperties] = useState<BlacklistedProperty[]>(initialProperties);

    // Form state for adding phone
    const [newPhone, setNewPhone] = useState('');
    const [newReason, setNewReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Filter state
    const [phoneSearch, setPhoneSearch] = useState('');
    const [propSearch, setPropSearch] = useState('');
    const [selectedCity, setSelectedCity] = useState('all');
    const [filterByPhone, setFilterByPhone] = useState<string | null>(null);

    const [isPending, startTransition] = useTransition();

    // Available cities from properties
    const cities = Array.from(new Set(properties.map(p => p.city).filter(Boolean)));

    // Handle adding phone to blacklist
    const handleAddPhone = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPhone.trim()) return;

        setIsSubmitting(true);
        setMessage(null);

        const res = await addPhoneToBlacklist(newPhone, newReason);
        setIsSubmitting(false);

        if (res.success) {
            setMessage({
                type: 'success',
                text: `Numărul ${newPhone} a fost adăugat în blacklist! ${res.countUpdated ? `${res.countUpdated} proprietăți au fost trecute în status Blacklist.` : ''}`
            });
            setNewPhone('');
            setNewReason('');
            
            // Refresh list dynamically
            startTransition(() => {
                window.location.reload();
            });
        } else {
            setMessage({
                type: 'error',
                text: res.error || 'Eroare la adăugarea numărului în blacklist.'
            });
        }
    };

    // Handle removing phone from blacklist
    const handleRemovePhone = async (id: string, phoneNum: string) => {
        if (!confirm(`Sigur dorești să elimini numărul ${phoneNum} din blacklist?`)) return;

        const res = await removePhoneFromBlacklist(id);
        if (res.success) {
            setPhones(prev => prev.filter(p => p.id !== id));
            setMessage({ type: 'success', text: `Numărul ${phoneNum} a fost eliminat din blacklist.` });
        } else {
            setMessage({ type: 'error', text: res.error || 'Eroare la ștergerea numărului.' });
        }
    };

    // Handle restoring property from blacklist
    const handleRestoreProperty = async (propertyId: string, title: string) => {
        if (!confirm(`Dorești să reactivezi proprietatea "${title}"?`)) return;

        const res = await restorePropertyFromBlacklist(propertyId, 'active');
        if (res.success) {
            setProperties(prev => prev.filter(p => p.id !== propertyId));
            setMessage({ type: 'success', text: `Proprietatea "${title}" a fost reactivată cu succes.` });
        } else {
            setMessage({ type: 'error', text: res.error || 'Eroare la reactivarea proprietății.' });
        }
    };

    // Handle deleting property permanently
    const handleDeleteProperty = async (propertyId: string, title: string) => {
        if (!confirm(`ATENȚIE: Sigur dorești să ștergi DEFINITIV proprietatea "${title}"? Această acțiune nu poate fi anulată.`)) return;

        const res = await deleteBlacklistedProperty(propertyId);
        if (res.success) {
            setProperties(prev => prev.filter(p => p.id !== propertyId));
            setMessage({ type: 'success', text: `Proprietatea "${title}" a fost ștearsă definitiv.` });
        } else {
            setMessage({ type: 'error', text: res.error || 'Eroare la ștergerea proprietății.' });
        }
    };

    // Filtered phones
    const filteredPhones = phones.filter(p =>
        p.phone_number.includes(phoneSearch) ||
        (p.reason && p.reason.toLowerCase().includes(phoneSearch.toLowerCase()))
    );

    // Filtered properties
    const filteredProperties = properties.filter(p => {
        const matchesQuery = propSearch === '' || (
            p.title.toLowerCase().includes(propSearch.toLowerCase()) ||
            (p.owner_phone && p.owner_phone.includes(propSearch)) ||
            (p.owner_name && p.owner_name.toLowerCase().includes(propSearch.toLowerCase())) ||
            p.city.toLowerCase().includes(propSearch.toLowerCase())
        );

        const matchesCity = selectedCity === 'all' || p.city === selectedCity;

        const matchesPhone = !filterByPhone || (
            p.owner_phone && (p.owner_phone.includes(filterByPhone) || filterByPhone.includes(p.owner_phone.replace(/\D/g, '')))
        );

        return matchesQuery && matchesCity && matchesPhone;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                        <div className="w-10 h-10 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-center text-rose-400">
                            <ShieldAlert className="w-5 h-5" />
                        </div>
                        Blacklist Telefonic & Proprietăți Excluse
                    </h1>
                    <p className="text-xs text-slate-400 mt-1.5">
                        Gestionează numerele de telefon blocate și proprietățile scoase automat din stadiul de publicat.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-center">
                        <span className="text-xs text-slate-400 block font-medium">Numere Blocate</span>
                        <span className="text-lg font-bold text-rose-400">{phones.length}</span>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-center">
                        <span className="text-xs text-slate-400 block font-medium">Proprietăți Blacklist</span>
                        <span className="text-lg font-bold text-amber-400">{properties.length}</span>
                    </div>
                </div>
            </div>

            {/* Status Message */}
            {message && (
                <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between border ${
                    message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                }`}>
                    <div className="flex items-center gap-2">
                        {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                        <span>{message.text}</span>
                    </div>
                    <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
                </div>
            )}

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-px">
                <button
                    onClick={() => setActiveTab('phones')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-t-xl text-xs font-bold transition-all border-b-2 ${
                        activeTab === 'phones'
                            ? 'border-orange-500 bg-slate-900/80 text-orange-400'
                            : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                    }`}
                >
                    <ShieldAlert className="w-4 h-4" />
                    <span>Numere în Blacklist</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-semibold">{phones.length}</span>
                </button>

                <button
                    onClick={() => setActiveTab('properties')}
                    className={`flex items-center gap-2 px-5 py-3 rounded-t-xl text-xs font-bold transition-all border-b-2 ${
                        activeTab === 'properties'
                            ? 'border-orange-500 bg-slate-900/80 text-orange-400'
                            : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                    }`}
                >
                    <Building className="w-4 h-4" />
                    <span>Proprietăți Excluse (Blacklist)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-semibold">{properties.length}</span>
                </button>
            </div>

            {/* TAB 1: NUMERE IN BLACKLIST */}
            {activeTab === 'phones' && (
                <div className="space-y-6">
                    {/* Form: Add Phone */}
                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl">
                        <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                            <Plus className="w-4 h-4 text-orange-400" />
                            Adaugă Număr de Telefon în Blacklist
                        </h2>
                        <form onSubmit={handleAddPhone} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                            <div className="md:col-span-4">
                                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">
                                    Număr de Telefon *
                                </label>
                                <div className="relative">
                                    <PhoneCall className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="tel"
                                        placeholder="ex. 0722 000 000 sau +40722000000"
                                        value={newPhone}
                                        onChange={(e) => setNewPhone(e.target.value)}
                                        required
                                        className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-5">
                                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">
                                    Motiv / Notă (Opțional)
                                </label>
                                <input
                                    type="text"
                                    placeholder="ex. Agenție neserioasă, Spam, Telefon invalid"
                                    value={newReason}
                                    onChange={(e) => setNewReason(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-colors"
                                />
                            </div>

                            <div className="md:col-span-3">
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !newPhone.trim()}
                                    className="w-full bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 border border-rose-500/30 text-xs disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-white rounded-full animate-spin" />
                                            <span>Se adaugă...</span>
                                        </>
                                    ) : (
                                        <>
                                            <ShieldAlert className="w-4 h-4" />
                                            <span>Blochează Numărul</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Table: Blacklisted Phones */}
                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                        <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950/40">
                            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                <ShieldAlert className="w-4 h-4 text-rose-400" />
                                Listă Numere Blocate ({filteredPhones.length})
                            </h3>

                            <div className="relative w-full md:w-64">
                                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Caută număr sau motiv..."
                                    value={phoneSearch}
                                    onChange={(e) => setPhoneSearch(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-600 outline-none focus:border-orange-500 transition-colors"
                                />
                            </div>
                        </div>

                        {filteredPhones.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-800 bg-slate-950/60 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                            <th className="py-3 px-4">Număr Telefon</th>
                                            <th className="py-3 px-4">Motiv / Notă</th>
                                            <th className="py-3 px-4">Adăugat De</th>
                                            <th className="py-3 px-4">Data Adăugării</th>
                                            <th className="py-3 px-4 text-center">Proprietăți Afectate</th>
                                            <th className="py-3 px-4 text-right">Acțiuni</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60 text-xs">
                                        {filteredPhones.map((p) => (
                                            <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                                                <td className="py-3.5 px-4 font-bold text-rose-400 flex items-center gap-2">
                                                    <PhoneCall className="w-3.5 h-3.5 text-slate-500" />
                                                    <span>{p.phone_number}</span>
                                                </td>
                                                <td className="py-3.5 px-4 text-slate-300">
                                                    {p.reason ? (
                                                        <span className="bg-slate-950 px-2 py-1 rounded-md border border-slate-800 text-[11px]">
                                                            {p.reason}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-600 italic">Fără notă</span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                                                    {p.added_by_name || 'Admin'}
                                                </td>
                                                <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                                                    {new Date(p.created_at).toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    <button
                                                        onClick={() => {
                                                            setFilterByPhone(p.normalized_phone);
                                                            setActiveTab('properties');
                                                        }}
                                                        className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-all inline-flex items-center gap-1"
                                                    >
                                                        <Building className="w-3 h-3" />
                                                        <span>{p.affected_properties_count || 0} proprietăți</span>
                                                    </button>
                                                </td>
                                                <td className="py-3.5 px-4 text-right">
                                                    <button
                                                        onClick={() => handleRemovePhone(p.id, p.phone_number)}
                                                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                                                        title="Șterge din Blacklist"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-8 text-center text-slate-500 text-xs">
                                Nu s-au găsit numere în blacklist conform căutării.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 2: PROPRIETATI EXCLUSE IN BLACKLIST */}
            {activeTab === 'properties' && (
                <div className="space-y-6">
                    {/* Search & Filters */}
                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xl">
                        <div className="relative w-full md:w-80">
                            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Caută titlu, telefon, proprietar sau oraș..."
                                value={propSearch}
                                onChange={(e) => setPropSearch(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 outline-none transition-colors"
                            />
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            {/* City Filter */}
                            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
                                <Filter className="w-3.5 h-3.5 text-slate-500" />
                                <span className="text-[10px] font-bold uppercase text-slate-500">Oraș:</span>
                                <select
                                    value={selectedCity}
                                    onChange={(e) => setSelectedCity(e.target.value)}
                                    className="bg-transparent text-xs text-white outline-none font-semibold cursor-pointer"
                                >
                                    <option value="all" className="bg-slate-900">Toate ({properties.length})</option>
                                    {cities.map(c => (
                                        <option key={c} value={c} className="bg-slate-900">{c}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Active Phone Filter Badge */}
                            {filterByPhone && (
                                <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-3 py-1.5 rounded-xl text-xs font-semibold">
                                    <span>Filtru Tel: {filterByPhone}</span>
                                    <button onClick={() => setFilterByPhone(null)} className="hover:text-white">✕</button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Properties List Grid */}
                    {filteredProperties.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredProperties.map((p) => (
                                <div key={p.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all flex flex-col justify-between group">
                                    <div>
                                        {/* Image header */}
                                        <div className="relative h-44 bg-slate-950 overflow-hidden">
                                            {p.images && p.images.length > 0 ? (
                                                <img
                                                    src={p.images[0]}
                                                    alt={p.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-700">
                                                    <Building className="w-12 h-12" />
                                                </div>
                                            )}

                                            <div className="absolute top-3 left-3 bg-rose-600/90 text-white font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md backdrop-blur-sm border border-rose-400/30 flex items-center gap-1 shadow-lg">
                                                <ShieldAlert className="w-3 h-3" /> Blacklist
                                            </div>

                                            <div className="absolute bottom-3 right-3 bg-slate-950/90 text-amber-400 font-extrabold text-sm px-2.5 py-1 rounded-lg backdrop-blur-sm border border-slate-800">
                                                €{p.price ? p.price.toLocaleString('ro-RO') : '0'}
                                            </div>
                                        </div>

                                        {/* Details */}
                                        <div className="p-4 space-y-2.5">
                                            <h3 className="text-sm font-bold text-white line-clamp-2 group-hover:text-orange-400 transition-colors">
                                                {p.title}
                                            </h3>

                                            <div className="space-y-1.5 text-xs text-slate-400">
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                                    <span>{p.city}, {p.county}</span>
                                                </div>

                                                <div className="flex items-center gap-1.5 font-semibold text-rose-400">
                                                    <PhoneCall className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                                    <span>{p.owner_phone || 'Telefon nespecificat'}</span>
                                                </div>

                                                {p.owner_name && (
                                                    <div className="flex items-center gap-1.5 text-slate-400">
                                                        <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                                        <span>{p.owner_name}</span>
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                                                    <Calendar className="w-3 h-3 text-slate-600" />
                                                    <span>Scoatere din stadiu publicat: {new Date(p.updated_at).toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="p-4 pt-0 grid grid-cols-2 gap-2 mt-2">
                                        <button
                                            onClick={() => handleRestoreProperty(p.id, p.title)}
                                            className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold py-2 px-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                                        >
                                            <RefreshCw className="w-3.5 h-3.5" />
                                            <span>Reactivează</span>
                                        </button>

                                        <button
                                            onClick={() => handleDeleteProperty(p.id, p.title)}
                                            className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold py-2 px-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            <span>Șterge Definitiv</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
                            <Building className="w-12 h-12 text-slate-700 mx-auto" />
                            <h3 className="text-sm font-bold text-white">Nu există proprietăți în blacklist</h3>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto">
                                Toate proprietățile sunt curate sau nu s-au găsit proprietăți conform filtrului curent.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
