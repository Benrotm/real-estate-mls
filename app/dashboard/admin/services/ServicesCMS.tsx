'use client';

import React, { useState } from 'react';
import { 
    createServiceCategory, 
    deleteServiceCategory, 
    updateProviderStatus,
    updateServiceCategoryOrder
} from '@/app/lib/actions/services-marketplace';
import { 
    Plus, Trash2, ShieldCheck, Clock, X, Check, FileText, ExternalLink, Mail, Phone, MapPin, Eye,
    ArrowUp, ArrowDown
} from 'lucide-react';

interface Category {
    id: string;
    title: string;
    slug: string;
    description: string;
    icon: string;
}

interface Provider {
    id: string;
    user_id: string;
    brand_name: string;
    cui_cif: string;
    phone: string;
    email: string;
    category_slug: string;
    document_url?: string;
    city: string;
    radius_km: number;
    description: string;
    orientative_prices?: string;
    selected_plan: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
}

interface ServicesCMSProps {
    initialCategories: Category[];
    initialPending: Provider[];
    initialAll: Provider[];
}

const ICON_OPTIONS = ['FileText', 'Calculator', 'Shield', 'Compass', 'TrendingUp', 'Truck', 'Sparkles', 'Hammer', 'Palette', 'Armchair', 'Video', 'Users', 'Zap'];

export default function ServicesCMS({ 
    initialCategories, 
    initialPending, 
    initialAll 
}: ServicesCMSProps) {
    const [activeTab, setActiveTab] = useState<'pending' | 'categories' | 'all'>('pending');
    
    // Categories states
    const [categories, setCategories] = useState(initialCategories);
    const [newTitle, setNewTitle] = useState('');
    const [newSlug, setNewSlug] = useState('');
    const [newIcon, setNewIcon] = useState('Target');
    const [newDesc, setNewDesc] = useState('');
    const [addingCat, setAddingCat] = useState(false);

    // Providers states
    const [pendingProviders, setPendingProviders] = useState(initialPending);
    const [allProviders, setAllProviders] = useState(initialAll);
    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

    // Modal state for provider review
    const [reviewProvider, setReviewProvider] = useState<Provider | null>(null);

    // Auto-generate slug from title
    const handleTitleChange = (val: string) => {
        setNewTitle(val);
        setNewSlug(val.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '')
        );
    };

    // Add new Category
    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim() || !newSlug.trim()) return;

        setAddingCat(true);
        try {
            const res = await createServiceCategory(newTitle, newSlug, newDesc, newIcon);
            if (res.success && res.category) {
                setCategories(prev => [...prev, res.category]);
                setNewTitle('');
                setNewSlug('');
                setNewDesc('');
                setNewIcon('Target');
                alert('Categorie adăugată cu succes!');
            } else {
                alert('Eroare: ' + res.error);
            }
        } catch (e: any) {
            alert('Eroare tehnică: ' + e.message);
        } finally {
            setAddingCat(false);
        }
    };

    // Delete Category
    const handleDeleteCategory = async (id: string) => {
        if (!confirm('Sigur doriți să ștergeți această categorie? Aceasta va șterge și furnizorii asociați.')) return;

        try {
            const res = await deleteServiceCategory(id);
            if (res.success) {
                setCategories(prev => prev.filter(c => c.id !== id));
                alert('Categorie ștearsă.');
            } else {
                alert('Eroare: ' + res.error);
            }
        } catch (e: any) {
            alert('Eroare tehnică: ' + e.message);
        }
    };

    // Move Category Up/Down
    const handleMoveCategory = async (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= categories.length) return;

        const updatedCategories = [...categories];
        const temp = updatedCategories[index];
        updatedCategories[index] = updatedCategories[newIndex];
        updatedCategories[newIndex] = temp;

        setCategories(updatedCategories);

        const listToUpdate = updatedCategories.map((cat, idx) => ({
            id: cat.id,
            sort_order: idx + 1
        }));

        try {
            const res = await updateServiceCategoryOrder(listToUpdate);
            if (!res.success) {
                alert('Eroare la salvarea ordinii în baza de date: ' + res.error);
            }
        } catch (e: any) {
            alert('Eroare tehnică la reordonare: ' + e.message);
        }
    };

    // Approve/Reject Provider status
    const handleStatusUpdate = async (id: string, status: 'approved' | 'rejected') => {
        setUpdatingStatusId(id);
        try {
            const res = await updateProviderStatus(id, status);
            if (res.success && res.provider) {
                // Update states
                setPendingProviders(prev => prev.filter(p => p.id !== id));
                setAllProviders(prev => prev.map(p => p.id === id ? { ...p, status } : p));
                alert(`Solicitarea a fost ${status === 'approved' ? 'aprobată' : 'respinsă'} cu succes!`);
                setReviewProvider(null);
            } else {
                alert('Eroare: ' + res.error);
            }
        } catch (e: any) {
            alert('Eroare tehnică: ' + e.message);
        } finally {
            setUpdatingStatusId(null);
        }
    };

    const getPlanBadgeColor = (plan: string) => {
        switch (plan) {
            case 'exclusivity': return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/25';
            case 'standard': return 'bg-blue-500/10 text-blue-400 border border-blue-500/25';
            default: return 'bg-slate-500/10 text-slate-400 border border-slate-500/25';
        }
    };

    const getPlanLabel = (plan: string) => {
        switch (plan) {
            case 'exclusivity': return 'Exclusivitate Zonă';
            case 'standard': return 'Standard (199)';
            default: return 'Trial 30 Zile';
        }
    };

    return (
        <div className="space-y-6">
            
            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-800 overflow-x-auto gap-2">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`px-4 py-2.5 font-bold text-xs uppercase tracking-wider border-b-2 transition-all shrink-0 ${
                        activeTab === 'pending' ? 'border-orange-500 text-white' : 'border-transparent text-slate-400 hover:text-white'
                    }`}
                >
                    Solicitări Parteneri ({pendingProviders.length})
                </button>
                <button
                    onClick={() => setActiveTab('categories')}
                    className={`px-4 py-2.5 font-bold text-xs uppercase tracking-wider border-b-2 transition-all shrink-0 ${
                        activeTab === 'categories' ? 'border-orange-500 text-white' : 'border-transparent text-slate-400 hover:text-white'
                    }`}
                >
                    Administrare Categorii
                </button>
                <button
                    onClick={() => setActiveTab('all')}
                    className={`px-4 py-2.5 font-bold text-xs uppercase tracking-wider border-b-2 transition-all shrink-0 ${
                        activeTab === 'all' ? 'border-orange-500 text-white' : 'border-transparent text-slate-400 hover:text-white'
                    }`}
                >
                    Toți Furnizorii ({allProviders.length})
                </button>
            </div>

            {/* TAB 1: SOLICITĂRI PENDING */}
            {activeTab === 'pending' && (
                <div className="space-y-4 text-left">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        Solicitări în Așteptare Aprobare
                    </h3>
                    
                    <div className="bg-slate-900/40 rounded-3xl border border-slate-850 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-850">
                                    <tr>
                                        <th className="p-4">Brand / Nume Firmă</th>
                                        <th className="p-4">Categorie</th>
                                        <th className="p-4">Oraș Principal</th>
                                        <th className="p-4">Plan Selectat</th>
                                        <th className="p-4">Data Cererii</th>
                                        <th className="p-4 text-right">Acțiuni</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-850">
                                    {pendingProviders.map((prov) => (
                                        <tr key={prov.id} className="hover:bg-white/5 transition-colors">
                                            <td className="p-4 font-bold text-white">{prov.brand_name}</td>
                                            <td className="p-4 text-slate-400 font-medium capitalize">{prov.category_slug}</td>
                                            <td className="p-4 text-slate-350">{prov.city}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getPlanBadgeColor(prov.selected_plan)}`}>
                                                    {getPlanLabel(prov.selected_plan)}
                                                </span>
                                            </td>
                                            <td className="p-4 text-slate-500">
                                                {new Date(prov.created_at).toLocaleDateString('ro-RO')}
                                            </td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => setReviewProvider(prov)}
                                                    className="px-3 py-1.5 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white font-bold rounded-lg transition-all text-[10px] uppercase tracking-wider flex items-center gap-1 ml-auto"
                                                >
                                                    <Eye className="w-3.5 h-3.5" /> Analizează
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {pendingProviders.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="p-12 text-center text-slate-500">
                                                Nu există solicitări în așteptare.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: INREGISTRARE / ADMINISTRARE CATEGORII */}
            {activeTab === 'categories' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
                    {/* Add Category Form */}
                    <form onSubmit={handleAddCategory} className="lg:col-span-4 bg-slate-900/40 border border-slate-850 p-6 rounded-3xl space-y-4 h-fit">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-850 pb-3">
                            <Plus className="w-4 h-4 text-orange-500" /> Adaugă Categorie
                        </h3>
                        
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-450 mb-1">Nume Categorie</label>
                            <input
                                type="text"
                                value={newTitle}
                                onChange={(e) => handleTitleChange(e.target.value)}
                                placeholder="Notar public"
                                className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-4 py-2.5 text-xs text-white outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-450 mb-1">Slug Categorie</label>
                            <input
                                type="text"
                                value={newSlug}
                                onChange={(e) => setNewSlug(e.target.value)}
                                placeholder="notar-public"
                                className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-4 py-2.5 text-xs text-white outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-450 mb-1">Iconiță Categorie</label>
                            <select
                                value={newIcon}
                                onChange={(e) => setNewIcon(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-4 py-2.5 text-xs text-white outline-none"
                            >
                                {ICON_OPTIONS.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-450 mb-1">Descriere Categorie</label>
                            <textarea
                                value={newDesc}
                                onChange={(e) => setNewDesc(e.target.value)}
                                placeholder="Descrie rolul acestei categorii..."
                                rows={3}
                                className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-4 py-2.5 text-xs text-white outline-none resize-none"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={addingCat}
                            className="w-full py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold rounded-xl text-[10px] uppercase tracking-wider transition-all disabled:opacity-50"
                        >
                            {addingCat ? 'Se adaugă...' : 'Creează Categorie'}
                        </button>
                    </form>

                    {/* Categories list */}
                    <div className="lg:col-span-8 space-y-4">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                            Categorii Existente ({categories.length})
                        </h3>

                        <div className="bg-slate-900/20 border border-slate-850 rounded-3xl overflow-hidden">
                            <div className="divide-y divide-slate-850">
                                {categories.map((cat, idx) => (
                                    <div key={cat.id} className="p-4 flex items-center justify-between gap-4 hover:bg-white/5 transition-colors">
                                        <div className="flex items-center gap-4">
                                            {/* Order buttons */}
                                            <div className="flex flex-col gap-1 mr-2">
                                                <button
                                                    onClick={() => handleMoveCategory(idx, 'up')}
                                                    disabled={idx === 0}
                                                    className="p-1 hover:bg-slate-800 text-slate-500 hover:text-white rounded disabled:opacity-30 disabled:hover:bg-transparent"
                                                    title="Mută mai sus"
                                                >
                                                    <ArrowUp className="w-3 h-3" />
                                                </button>
                                                <button
                                                    onClick={() => handleMoveCategory(idx, 'down')}
                                                    disabled={idx === categories.length - 1}
                                                    className="p-1 hover:bg-slate-800 text-slate-500 hover:text-white rounded disabled:opacity-30 disabled:hover:bg-transparent"
                                                    title="Mută mai jos"
                                                >
                                                    <ArrowDown className="w-3 h-3" />
                                                </button>
                                            </div>

                                            <div className="space-y-1">
                                                <h4 className="font-bold text-white text-xs uppercase flex items-center gap-1.5">
                                                    <span className="text-slate-500">{cat.icon}</span>
                                                    {cat.title}
                                                </h4>
                                                <p className="text-[10px] text-slate-500 truncate max-w-[400px]">
                                                    {cat.description || 'Fără descriere.'} • Slug: <code className="text-indigo-400">{cat.slug}</code>
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteCategory(cat.id)}
                                            className="p-2 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-lg transition-all"
                                            title="Șterge"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 3: TOȚI FURNIZORII */}
            {activeTab === 'all' && (
                <div className="space-y-4 text-left">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        Toți Furnizorii Înregistrați
                    </h3>

                    <div className="bg-slate-900/40 rounded-3xl border border-slate-850 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-850">
                                    <tr>
                                        <th className="p-4">Brand / Nume Firmă</th>
                                        <th className="p-4">Categorie</th>
                                        <th className="p-4">Oraș</th>
                                        <th className="p-4">CUI/CIF</th>
                                        <th className="p-4">Plan</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-right">Revocare / Acțiuni</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-850">
                                    {allProviders.map((prov) => (
                                        <tr key={prov.id} className="hover:bg-white/5 transition-colors">
                                            <td className="p-4 font-bold text-white">{prov.brand_name}</td>
                                            <td className="p-4 text-slate-400 font-medium capitalize">{prov.category_slug}</td>
                                            <td className="p-4 text-slate-350">{prov.city}</td>
                                            <td className="p-4 text-slate-500">{prov.cui_cif}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getPlanBadgeColor(prov.selected_plan)}`}>
                                                    {getPlanLabel(prov.selected_plan)}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                    prov.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' :
                                                    prov.status === 'rejected' ? 'bg-rose-500/10 text-rose-450 border border-rose-500/25' :
                                                    'bg-yellow-500/10 text-yellow-400 border border-yellow-500/25'
                                                }`}>
                                                    {prov.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex gap-2 justify-end">
                                                    <button
                                                        onClick={() => setReviewProvider(prov)}
                                                        className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                                                        title="Vizualizează detalii"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                    </button>
                                                    {prov.status === 'approved' ? (
                                                        <button
                                                            onClick={() => handleStatusUpdate(prov.id, 'rejected')}
                                                            disabled={updatingStatusId === prov.id}
                                                            className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white text-[10px] font-bold rounded uppercase tracking-wider transition-colors disabled:opacity-50"
                                                        >
                                                            Revocă
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleStatusUpdate(prov.id, 'approved')}
                                                            disabled={updatingStatusId === prov.id}
                                                            className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white text-[10px] font-bold rounded uppercase tracking-wider transition-colors disabled:opacity-50"
                                                        >
                                                            Aprobă
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {allProviders.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="p-12 text-center text-slate-500">
                                                Nu există furnizori înregistrați.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* DETAILED PROVIDER REVIEW MODAL */}
            {reviewProvider && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-left">
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
                            <h3 className="text-base font-bold text-white">
                                Analizează solicitare parteneriat
                            </h3>
                            <button
                                onClick={() => setReviewProvider(null)}
                                className="p-1 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
                            {/* Brand & Categorie */}
                            <div>
                                <h4 className="text-lg font-bold text-white">{reviewProvider.brand_name}</h4>
                                <p className="text-slate-400 capitalize">Categorie: {reviewProvider.category_slug}</p>
                            </div>

                            {/* Info grid */}
                            <div className="grid grid-cols-2 gap-4 bg-slate-950/40 p-4 rounded-2xl border border-slate-850">
                                <div>
                                    <span className="block text-[9px] uppercase font-bold text-slate-500 mb-0.5">CUI / CIF</span>
                                    <span className="font-semibold text-white">{reviewProvider.cui_cif}</span>
                                </div>
                                <div>
                                    <span className="block text-[9px] uppercase font-bold text-slate-500 mb-0.5">Oraș Principal</span>
                                    <span className="font-semibold text-white">{reviewProvider.city}</span>
                                </div>
                                <div>
                                    <span className="block text-[9px] uppercase font-bold text-slate-500 mb-0.5">Rază Deplasare</span>
                                    <span className="font-semibold text-white">{reviewProvider.radius_km} KM</span>
                                </div>
                                <div>
                                    <span className="block text-[9px] uppercase font-bold text-slate-500 mb-0.5">Plan Solicitat</span>
                                    <span className="font-semibold text-white uppercase">{getPlanLabel(reviewProvider.selected_plan)}</span>
                                </div>
                            </div>

                            {/* Contact info */}
                            <div className="space-y-2">
                                <h5 className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Date de contact</h5>
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-slate-500" />
                                        <a href={`tel:${reviewProvider.phone}`} className="text-cyan-400 hover:underline">{reviewProvider.phone}</a>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-slate-500" />
                                        <a href={`mailto:${reviewProvider.email}`} className="text-cyan-400 hover:underline">{reviewProvider.email}</a>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-1">
                                <h5 className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Descriere Servicii</h5>
                                <p className="text-slate-300 leading-relaxed bg-slate-950/20 p-3 rounded-xl border border-slate-850 font-normal">
                                    {reviewProvider.description}
                                </p>
                            </div>

                            {/* Prices */}
                            {reviewProvider.orientative_prices && (
                                <div className="space-y-1">
                                    <h5 className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Tarife Orientative</h5>
                                    <p className="font-semibold text-white">{reviewProvider.orientative_prices}</p>
                                </div>
                            )}

                            {/* Document upload check */}
                            <div className="space-y-2">
                                <h5 className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Documente atașate (Autorizație/CUI)</h5>
                                {reviewProvider.document_url ? (
                                    <a 
                                        href={reviewProvider.document_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-750 text-white rounded-xl font-bold transition-all border border-slate-700"
                                    >
                                        <FileText className="w-4 h-4 text-orange-400" />
                                        <span>Vezi Document Înregistrare</span>
                                        <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                                    </a>
                                ) : (
                                    <p className="text-slate-500 italic">Niciun document încărcat.</p>
                                )}
                            </div>
                        </div>

                        {/* Modal footer actions */}
                        <div className="p-4 border-t border-slate-800 bg-slate-950/30 flex justify-between gap-3">
                            <button
                                type="button"
                                onClick={() => handleStatusUpdate(reviewProvider.id, 'rejected')}
                                disabled={updatingStatusId === reviewProvider.id}
                                className="px-5 py-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
                            >
                                Respinge
                            </button>
                            
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setReviewProvider(null)}
                                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-350 font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
                                >
                                    Închide
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleStatusUpdate(reviewProvider.id, 'approved')}
                                    disabled={updatingStatusId === reviewProvider.id}
                                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md"
                                >
                                    Aprobă Partener
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
