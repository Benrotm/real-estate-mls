'use client';

import React, { useState } from 'react';
import { 
    saveMarketingPage 
} from '@/app/lib/actions/marketing-pages';
import { 
    Settings, Plus, Trash2, ArrowUp, ArrowDown, Edit3, X, Check, Save 
} from 'lucide-react';

interface Section {
    id: string;
    title: string;
    desc: string;
    icon: string;
    bg_gradient: string;
    items: string[];
    cta_text?: string;
    cta_link?: string;
    secondary_cta_text?: string;
    secondary_cta_link?: string;
}

interface PageData {
    page_key: string;
    title: string;
    subtitle: string;
    sections: Section[];
}

interface MarketingPagesCMSProps {
    initialPages: {
        clients: PageData;
        owners: PageData;
        brokers: PageData;
    };
}

const GRADIENT_OPTIONS = [
    { label: 'Purple (Default)', value: 'from-violet-800 via-purple-800 to-indigo-950' },
    { label: 'Blue Indigo', value: 'from-blue-800 via-indigo-800 to-slate-950' },
    { label: 'Emerald Teal', value: 'from-emerald-800 via-teal-800 to-cyan-950' },
    { label: 'Orange Amber', value: 'from-orange-800 via-amber-800 to-stone-950' }
];

const ICON_OPTIONS = ['Video', 'Users', 'TrendingUp', 'Calculator', 'Target', 'Shield'];

export default function MarketingPagesCMS({ initialPages }: MarketingPagesCMSProps) {
    const [pages, setPages] = useState(initialPages);
    const [activeTab, setActiveTab] = useState<'clients' | 'owners' | 'brokers'>('clients');
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    // Modal state for editing/adding card sections
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
    const [modalTitle, setModalTitle] = useState('');
    const [modalDesc, setModalDesc] = useState('');
    const [modalIcon, setModalIcon] = useState('Target');
    const [modalGradient, setModalGradient] = useState('from-violet-800 via-purple-800 to-indigo-950');
    const [modalItems, setModalItems] = useState<string[]>([]);
    const [newItemText, setNewItemText] = useState('');
    const [modalCtaText, setModalCtaText] = useState('');
    const [modalCtaLink, setModalCtaLink] = useState('');
    const [modalSecCtaText, setModalSecCtaText] = useState('');
    const [modalSecCtaLink, setModalSecCtaLink] = useState('');

    const currentPage = pages[activeTab];

    const handleFieldChange = (field: 'title' | 'subtitle', value: string) => {
        setPages(prev => ({
            ...prev,
            [activeTab]: {
                ...prev[activeTab],
                [field]: value
            }
        }));
    };

    // Reorder sections
    const handleMoveSection = (index: number, direction: 'up' | 'down') => {
        const sectionsCopy = [...currentPage.sections];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        if (targetIndex < 0 || targetIndex >= sectionsCopy.length) return;

        // Swap
        const temp = sectionsCopy[index];
        sectionsCopy[index] = sectionsCopy[targetIndex];
        sectionsCopy[targetIndex] = temp;

        setPages(prev => ({
            ...prev,
            [activeTab]: {
                ...prev[activeTab],
                sections: sectionsCopy
            }
        }));
    };

    // Delete section
    const handleDeleteSection = (sectionId: string) => {
        if (!confirm('Sigur doriți să ștergeți această secțiune?')) return;

        setPages(prev => ({
            ...prev,
            [activeTab]: {
                ...prev[activeTab],
                sections: prev[activeTab].sections.filter(s => s.id !== sectionId)
            }
        }));
    };

    // Open Modal for Add/Edit
    const handleOpenModal = (section?: Section) => {
        if (section) {
            // Edit mode
            setEditingSectionId(section.id);
            setModalTitle(section.title);
            setModalDesc(section.desc);
            setModalIcon(section.icon);
            setModalGradient(section.bg_gradient);
            setModalItems(section.items || []);
            setModalCtaText(section.cta_text || '');
            setModalCtaLink(section.cta_link || '');
            setModalSecCtaText(section.secondary_cta_text || '');
            setModalSecCtaLink(section.secondary_cta_link || '');
        } else {
            // Add mode
            setEditingSectionId(null);
            setModalTitle('');
            setModalDesc('');
            setModalIcon('Target');
            setModalGradient('from-violet-800 via-purple-800 to-indigo-950');
            setModalItems([]);
            setModalCtaText('');
            setModalCtaLink('');
            setModalSecCtaText('');
            setModalSecCtaLink('');
        }
        setNewItemText('');
        setIsModalOpen(true);
    };

    // Add list item in modal
    const handleAddModalItem = () => {
        if (!newItemText.trim()) return;
        setModalItems(prev => [...prev, newItemText.trim()]);
        setNewItemText('');
    };

    // Remove list item in modal
    const handleRemoveModalItem = (index: number) => {
        setModalItems(prev => prev.filter((_, i) => i !== index));
    };

    // Save Section Modal Settings
    const handleSaveSectionModal = () => {
        if (!modalTitle.trim()) {
            alert('Titlul cardului este obligatoriu.');
            return;
        }

        const newSectionData: Section = {
            id: editingSectionId || 'sec_' + Date.now(),
            title: modalTitle,
            desc: modalDesc,
            icon: modalIcon,
            bg_gradient: modalGradient,
            items: modalItems,
            cta_text: modalCtaText.trim() || undefined,
            cta_link: modalCtaLink.trim() || undefined,
            secondary_cta_text: modalSecCtaText.trim() || undefined,
            secondary_cta_link: modalSecCtaLink.trim() || undefined
        };

        let updatedSections = [...currentPage.sections];
        if (editingSectionId) {
            // edit
            updatedSections = updatedSections.map(s => s.id === editingSectionId ? newSectionData : s);
        } else {
            // add
            updatedSections.push(newSectionData);
        }

        setPages(prev => ({
            ...prev,
            [activeTab]: {
                ...prev[activeTab],
                sections: updatedSections
            }
        }));

        setIsModalOpen(false);
    };

    // Save changes to database
    const handleSaveChanges = async () => {
        setSaving(true);
        setSuccessMessage('');
        setErrorMessage('');

        try {
            const res = await saveMarketingPage(
                currentPage.page_key,
                currentPage.title,
                currentPage.subtitle,
                currentPage.sections
            );

            if (res.success) {
                setSuccessMessage('Configurația paginii a fost salvată cu succes!');
                // Auto dismiss
                setTimeout(() => setSuccessMessage(''), 4000);
            } else {
                setErrorMessage(res.error || 'Eroare la salvare.');
            }
        } catch (e: any) {
            setErrorMessage(e.message || 'Eroare tehnică la salvare.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Page selection tabs */}
            <div className="flex border-b border-slate-800 overflow-x-auto gap-2">
                <button
                    onClick={() => setActiveTab('clients')}
                    className={`px-4 py-2.5 font-bold text-xs uppercase tracking-wider border-b-2 transition-all shrink-0 ${
                        activeTab === 'clients' ? 'border-orange-500 text-white' : 'border-transparent text-slate-400 hover:text-white'
                    }`}
                >
                    For Clients
                </button>
                <button
                    onClick={() => setActiveTab('owners')}
                    className={`px-4 py-2.5 font-bold text-xs uppercase tracking-wider border-b-2 transition-all shrink-0 ${
                        activeTab === 'owners' ? 'border-orange-500 text-white' : 'border-transparent text-slate-400 hover:text-white'
                    }`}
                >
                    For Owners
                </button>
                <button
                    onClick={() => setActiveTab('brokers')}
                    className={`px-4 py-2.5 font-bold text-xs uppercase tracking-wider border-b-2 transition-all shrink-0 ${
                        activeTab === 'brokers' ? 'border-orange-500 text-white' : 'border-transparent text-slate-400 hover:text-white'
                    }`}
                >
                    For Brokers &amp; Developers
                </button>
            </div>

            {/* Title & Subtitle Settings */}
            <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 space-y-4 text-left">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Settings className="w-4 h-4 text-orange-500" />
                    Setări Principale Pagină
                </h3>
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Titlu Principal Pagină</label>
                        <input
                            type="text"
                            value={currentPage.title}
                            onChange={(e) => handleFieldChange('title', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-4 py-2.5 text-xs text-white outline-none transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Subtitlu/Descriere Pagină</label>
                        <textarea
                            value={currentPage.subtitle}
                            onChange={(e) => handleFieldChange('subtitle', e.target.value)}
                            rows={3}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-4 py-2.5 text-xs text-white outline-none transition-colors resize-none"
                        />
                    </div>
                </div>
            </div>

            {/* Card Sections List */}
            <div className="space-y-4 text-left">
                <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        Elemente / Carduri Secțiuni ({currentPage.sections.length})
                    </h3>
                    <button
                        onClick={() => handleOpenModal()}
                        className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold rounded-xl text-[10px] uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5"
                    >
                        <Plus className="w-3.5 h-3.5" /> Adaugă Card
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentPage.sections.map((section, idx) => (
                        <div key={section.id} className="bg-slate-900/60 border border-slate-850 p-5 rounded-2xl flex flex-col justify-between hover:border-slate-700 transition-colors">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                                        Card {idx + 1}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleMoveSection(idx, 'up')}
                                            disabled={idx === 0}
                                            className="p-1.5 hover:bg-slate-850 rounded text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                            title="Mută Sus"
                                        >
                                            <ArrowUp className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => handleMoveSection(idx, 'down')}
                                            disabled={idx === currentPage.sections.length - 1}
                                            className="p-1.5 hover:bg-slate-850 rounded text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                            title="Mută Jos"
                                        >
                                            <ArrowDown className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                                <h4 className="font-bold text-white text-sm">{section.title}</h4>
                                <p className="text-xs text-slate-450 line-clamp-2 leading-relaxed">{section.desc}</p>
                                {section.items && section.items.length > 0 && (
                                    <div className="text-[10px] text-slate-500 mt-2">
                                        Beneficii: {section.items.length} puncte listate
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between border-t border-slate-850 mt-4 pt-3">
                                <button
                                    onClick={() => handleOpenModal(section)}
                                    className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-colors"
                                >
                                    <Edit3 className="w-3.5 h-3.5" /> Editează Card
                                </button>
                                <button
                                    onClick={() => handleDeleteSection(section.id)}
                                    className="text-xs text-rose-500 hover:text-rose-400 font-semibold flex items-center gap-1 transition-colors"
                                >
                                    <Trash2 className="w-3.5 h-3.5" /> Șterge
                                </button>
                            </div>
                        </div>
                    ))}
                    {currentPage.sections.length === 0 && (
                        <div className="col-span-full py-12 text-center text-slate-500 bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl">
                            Nu există carduri adăugate pe această pagină.
                        </div>
                    )}
                </div>
            </div>

            {/* Alerts & Save Actions */}
            <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                    {successMessage && (
                        <div className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20 flex items-center gap-1.5">
                            <Check className="w-4 h-4" />
                            {successMessage}
                        </div>
                    )}
                    {errorMessage && (
                        <div className="text-xs text-rose-450 font-bold bg-rose-500/10 px-4 py-2 rounded-xl border border-rose-500/20">
                            {errorMessage}
                        </div>
                    )}
                </div>
                <button
                    onClick={handleSaveChanges}
                    disabled={saving}
                    className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                >
                    {saving ? (
                        <>
                            <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-white rounded-full animate-spin"></div>
                            <span>Se salvează...</span>
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            <span>Salvează Pagina {activeTab.toUpperCase()}</span>
                        </>
                    )}
                </button>
            </div>

            {/* ADD/EDIT SECTION DIALOG MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-left relative">
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
                            <h3 className="text-base font-bold text-white">
                                {editingSectionId ? 'Editează Card Secțiune' : 'Adaugă Card Secțiune Nouă'}
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-1 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-4 flex-1">
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Titlu Card *</label>
                                <input
                                    type="text"
                                    value={modalTitle}
                                    onChange={(e) => setModalTitle(e.target.value)}
                                    placeholder="ex. Tururi Virtuale 3D"
                                    className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-3 py-2 text-xs text-white outline-none transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Descriere Card</label>
                                <textarea
                                    value={modalDesc}
                                    onChange={(e) => setModalDesc(e.target.value)}
                                    placeholder="Descrie pe scurt acest serviciu sau beneficiu..."
                                    rows={2}
                                    className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-3 py-2 text-xs text-white outline-none transition-colors resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Iconiță Card</label>
                                    <select
                                        value={modalIcon}
                                        onChange={(e) => setModalIcon(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-3 py-2 text-xs text-white outline-none transition-colors"
                                    >
                                        {ICON_OPTIONS.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Gradiant Fundal Card</label>
                                    <select
                                        value={modalGradient}
                                        onChange={(e) => setModalGradient(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-3 py-2 text-xs text-white outline-none transition-colors"
                                    >
                                        {GRADIENT_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Bullet Points Management */}
                            <div className="space-y-2">
                                <label className="block text-[10px] uppercase font-bold text-slate-400">Puncte Listate / Beneficii</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newItemText}
                                        onChange={(e) => setNewItemText(e.target.value)}
                                        placeholder="Adaugă un beneficiu sau detaliu..."
                                        className="flex-1 bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-3 py-2 text-xs text-white outline-none transition-colors"
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddModalItem())}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddModalItem}
                                        className="px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
                                    >
                                        Adaugă
                                    </button>
                                </div>
                                <ul className="space-y-1.5 pt-1">
                                    {modalItems.map((item, index) => (
                                        <li key={index} className="flex justify-between items-center bg-slate-950/40 px-3 py-1.5 rounded-lg border border-slate-850 text-xs text-slate-300">
                                            <span className="line-clamp-2">{item}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveModalItem(index)}
                                                className="text-rose-500 hover:text-rose-450 p-1 rounded"
                                            >
                                                ✕
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Action Buttons customization */}
                            <div className="grid grid-cols-2 gap-4 border-t border-slate-800/60 pt-3">
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Text Buton Principal</label>
                                    <input
                                        type="text"
                                        value={modalCtaText}
                                        onChange={(e) => setModalCtaText(e.target.value)}
                                        placeholder="ex. Înregistrează-te"
                                        className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-3 py-2 text-xs text-white outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Link Buton Principal</label>
                                    <input
                                        type="text"
                                        value={modalCtaLink}
                                        onChange={(e) => setModalCtaLink(e.target.value)}
                                        placeholder="ex. /auth/signup"
                                        className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-3 py-2 text-xs text-white outline-none transition-colors"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Text Buton Secundar</label>
                                    <input
                                        type="text"
                                        value={modalSecCtaText}
                                        onChange={(e) => setModalSecCtaText(e.target.value)}
                                        placeholder="ex. Vezi Detalii"
                                        className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-3 py-2 text-xs text-white outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Link Buton Secundar</label>
                                    <input
                                        type="text"
                                        value={modalSecCtaLink}
                                        onChange={(e) => setModalSecCtaLink(e.target.value)}
                                        placeholder="ex. /calculator-comisioane"
                                        className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-3 py-2 text-xs text-white outline-none transition-colors"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-800 bg-slate-950/30 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-350 font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
                            >
                                Anulează
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveSectionModal}
                                className="px-5 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
                            >
                                Salvează Card
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
