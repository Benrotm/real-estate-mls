'use client';

import React, { useState } from 'react';
import { 
    Zap, Users, UserCheck, ShieldAlert, Activity, Search, Filter, 
    CheckCircle2, XCircle, Eye, Settings, Clock, Coins, MousePointer, 
    ArrowUpRight, AlertCircle, RefreshCw, Layers, Check, X, Shield, BedDouble, Ruler, MapPin, Sparkles, Phone, Trash2
} from 'lucide-react';
import { toggleUserApproval, saveUserPropertyRestrictions } from '@/app/lib/admin';
import { 
    saveAIPipelineRecommendationSetting, 
    getUserActivityDetails,
    deleteAIPipelineUserOrLead
} from '@/app/lib/actions/user-activity';
import Link from 'next/link';

interface User {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
    role: string;
    is_approved?: boolean;
    credits?: number;
    created_at: string;
    source?: string;
    find_self_from_owner?: boolean;
    wants_agent_help?: boolean;
    restrictions?: {
        allowed_types?: string[];
        allowed_transactions?: string[];
        allowed_cities?: string[];
    };
}

interface Props {
    initialUsers: User[];
    initialRecommendation: { text: string; points: number };
}

const PROPERTY_TYPES = ['Apartment', 'House', 'Commercial', 'Industrial', 'Land', 'Business', 'Other'];
const TRANSACTION_TYPES = ['For Sale', 'For Rent', 'Hotel Regime'];
const SAMPLE_CITIES = [
    'Albina', 'Alios', 'Altringen', 'Anunțuri', 'B Bucuresti', 'Babsa', 'Bacova', 
    'Balint', 'Banloc', 'Bara', 'Batesti', 'Bazos', 'Bazosu Nou', 'Bega', 'Biled', 
    'Birda', 'Bogda', 'Botoșani', 'Brezon', 'București', 'Buziaș', 'Caransebeș', 
    'Cluj-Napoca', 'Constanța', 'Craiova', 'Gătaia', 'Iași', 'Lugoj', 'Oradea', 
    'Pitești', 'Ploiești', 'Resița', 'Sibiu', 'Timișoara'
];

export default function AIPipelineClient({ initialUsers, initialRecommendation }: Props) {
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Selected user for Approval & Restrictions Modal (Poza 3)
    const [selectedUserForRestrictions, setSelectedUserForRestrictions] = useState<User | null>(null);
    const [allowedTypes, setAllowedTypes] = useState<string[]>([]);
    const [allowedTransactions, setAllowedTransactions] = useState<string[]>([]);
    const [allowedCities, setAllowedCities] = useState<string[]>([]);
    const [isSavingRestrictions, setIsSavingRestrictions] = useState(false);
    const [restrictionsStatusMsg, setRestrictionsStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Activity Monitor Modal state
    const [monitoredUser, setMonitoredUser] = useState<User | null>(null);
    const [activityData, setActivityData] = useState<any>(null);
    const [isLoadingActivity, setIsLoadingActivity] = useState(false);
    const [activityTab, setActivityTab] = useState<'sessions' | 'actions' | 'credits'>('sessions');

    // Client Dashboard Preview Modal state
    const [previewUser, setPreviewUser] = useState<User | null>(null);

    // Recommendation Modal State
    const [isRecModalOpen, setIsRecModalOpen] = useState(false);
    const [recText, setRecText] = useState(initialRecommendation.text || '');
    const [recPoints, setRecPoints] = useState(initialRecommendation.points || 50);
    const [isSavingRec, setIsSavingRec] = useState(false);

    // Handle user approval toggle
    const handleApproveUser = async (userId: string, currentStatus: boolean | undefined) => {
        try {
            await toggleUserApproval(userId, !currentStatus);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_approved: !currentStatus } : u));
            if (selectedUserForRestrictions?.id === userId) {
                setSelectedUserForRestrictions(prev => prev ? { ...prev, is_approved: !currentStatus } : null);
            }
        } catch (err: any) {
            alert('Eroare la schimbarea stării de aprobare: ' + err.message);
        }
    };

    // Handle user/lead card deletion
    const handleDeleteUserCard = async (userId: string, userName?: string) => {
        if (!confirm(`Sigur doriți să ștergeți definitiv cererea / utilizatorul "${userName || 'Fără Nume'}"? Această acțiune va elimina contul / lead-ul și toate datele asociate.`)) {
            return;
        }
        try {
            const res = await deleteAIPipelineUserOrLead(userId);
            if (res.error) {
                alert('Eroare la ștergerea cererii: ' + res.error);
            } else {
                setUsers(prev => prev.filter(u => u.id !== userId));
            }
        } catch (err: any) {
            alert('Eroare la ștergere: ' + err.message);
        }
    };

    // Open Access & Restrictions Modal (Poza 3)
    const handleOpenRestrictionsModal = (user: User) => {
        setSelectedUserForRestrictions(user);
        setAllowedTypes(user.restrictions?.allowed_types || []);
        setAllowedTransactions(user.restrictions?.allowed_transactions || []);
        setAllowedCities(user.restrictions?.allowed_cities || []);
        setRestrictionsStatusMsg(null);
    };

    // Save Restrictions
    const handleSaveRestrictions = async () => {
        if (!selectedUserForRestrictions) return;
        setIsSavingRestrictions(true);
        setRestrictionsStatusMsg(null);
        try {
            await saveUserPropertyRestrictions(
                selectedUserForRestrictions.id,
                allowedTypes,
                allowedTransactions,
                allowedCities
            );
            setUsers(prev => prev.map(u => u.id === selectedUserForRestrictions.id ? {
                ...u,
                restrictions: { allowed_types: allowedTypes, allowed_transactions: allowedTransactions, allowed_cities: allowedCities }
            } : u));
            setRestrictionsStatusMsg({ type: 'success', text: 'Restricțiile au fost salvate cu succes!' });
        } catch (err: any) {
            setRestrictionsStatusMsg({ type: 'error', text: 'Eroare la salvare: ' + err.message });
        } finally {
            setIsSavingRestrictions(false);
        }
    };

    // Toggle restriction item
    const toggleRestrictionItem = (item: string, category: 'type' | 'transaction' | 'city') => {
        if (category === 'type') {
            setAllowedTypes(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
        } else if (category === 'transaction') {
            setAllowedTransactions(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
        } else {
            setAllowedCities(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
        }
    };

    // Open User Activity Monitor Modal
    const handleOpenActivityMonitor = async (user: User) => {
        setMonitoredUser(user);
        setIsLoadingActivity(true);
        setActivityData(null);
        setActivityTab('sessions');
        try {
            const res = await getUserActivityDetails(user.id);
            if (res.error) {
                alert('Eroare la preluarea activității: ' + res.error);
            } else {
                setActivityData(res);
            }
        } catch (err: any) {
            alert('Eroare la încărcarea jurnalului de activitate.');
        } finally {
            setIsLoadingActivity(false);
        }
    };

    // Save Recommendation settings
    const handleSaveRecommendation = async () => {
        setIsSavingRec(true);
        try {
            const res = await saveAIPipelineRecommendationSetting(recText, recPoints);
            if (res.error) {
                alert('Eroare la salvarea recomandărilor: ' + res.error);
            } else {
                alert('Setările pentru recomandări au fost salvate cu succes!');
                setIsRecModalOpen(false);
            }
        } catch (err: any) {
            alert('Eroare la salvare.');
        } finally {
            setIsSavingRec(false);
        }
    };

    const [categoryFilter, setCategoryFilter] = useState<string>('all');

    // Helper classifier for the 4 Categories requested by admin
    const classifyUserCategory = (u: User) => {
        const source = (u.source || '').toLowerCase();
        const role = (u.role || '').toLowerCase();
        
        // 2. Both Options: If user checked BOTH wants_agent_help AND find_self_from_owner
        if (u.wants_agent_help === true && u.find_self_from_owner !== false) {
            return 'both_options';
        }

        // 1. Direct Owner Only (Clienți Doar de la Proprietar)
        if (
            role === 'client_no_agency' || 
            source.includes('client_no_agency') || 
            source.includes('invite') ||
            source.includes('self-service') ||
            source.includes('referral') ||
            u.wants_agent_help === false
        ) {
            return 'direct_owner_only';
        }

        // 3. Property Page Signup (Poza 1 - modal/button on /properties page)
        if (source.includes('property') || source.includes('proprietati') || source.includes('modal')) {
            return 'property_page';
        }

        // 4. CRM Invite Lead (Invite new lead button from Leads & CRM page)
        if (source.includes('shared link') || source.includes('crm') || source.includes('crm_invite')) {
            return 'crm_invite';
        }
        
        // Default: Both Options
        return 'both_options';
    };

    // Filtering users by search, role, status & category
    const filteredUsers = users.filter(u => {
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            const name = (u.full_name || '').toLowerCase();
            const email = (u.email || '').toLowerCase();
            const phone = (u.phone || '').toLowerCase();
            if (!name.includes(q) && !email.includes(q) && !phone.includes(q)) {
                return false;
            }
        }
        if (roleFilter !== 'all' && u.role !== roleFilter) return false;
        if (statusFilter === 'pending' && u.is_approved !== false) return false;
        if (statusFilter === 'active' && u.is_approved === false) return false;
        if (categoryFilter !== 'all' && classifyUserCategory(u) !== categoryFilter) return false;
        return true;
    });

    // Categorized Board Groups & Paired Columns (Cereri Ne-aprobate & Acceptați)
    const cat1Users = filteredUsers.filter(u => classifyUserCategory(u) === 'direct_owner_only');
    const cat2Users = filteredUsers.filter(u => classifyUserCategory(u) === 'both_options');
    const cat3Users = filteredUsers.filter(u => classifyUserCategory(u) === 'property_page');
    const cat4Users = filteredUsers.filter(u => classifyUserCategory(u) === 'crm_invite');

    const CATEGORIES = [
        {
            id: 'direct_owner_only',
            name: '1. Clienți Doar de la Proprietar',
            desc: 'Fără agenție (Doar căutare direct de la proprietari)',
            color: 'text-orange-600 border-orange-200 bg-orange-50',
            pending: cat1Users.filter(u => u.is_approved === false),
            approved: cat1Users.filter(u => u.is_approved !== false)
        },
        {
            id: 'both_options',
            name: '2. Clienți cu Ambele Opțiuni',
            desc: 'Și direct de la proprietar și cu ajutor Broker/Agent',
            color: 'text-blue-600 border-blue-200 bg-blue-50',
            pending: cat2Users.filter(u => u.is_approved === false),
            approved: cat2Users.filter(u => u.is_approved !== false)
        },
        {
            id: 'property_page',
            name: '3. Pagina Proprietăților (Poza 1)',
            desc: 'Clienți înregistrați / autentificați din modalul paginii de proprietăți',
            color: 'text-purple-600 border-purple-200 bg-purple-50',
            pending: cat3Users.filter(u => u.is_approved === false),
            approved: cat3Users.filter(u => u.is_approved !== false)
        },
        {
            id: 'crm_invite',
            name: '4. Formular CRM (Invite New Lead)',
            desc: 'Lead-uri venite prin link-ul de invitare din pagina Leads & CRM',
            color: 'text-emerald-600 border-emerald-200 bg-emerald-50',
            pending: cat4Users.filter(u => u.is_approved === false),
            approved: cat4Users.filter(u => u.is_approved !== false)
        }
    ];

    return (
        <div className="flex flex-col h-full space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm shrink-0">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-orange-600 rounded-xl text-white shadow-lg shadow-orange-600/20">
                            <Zap className="w-6 h-6 fill-current" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                AI Pipeline <span className="text-xs bg-slate-900 text-white px-2 py-0.5 rounded-full font-bold uppercase">Superadmin / Admin</span>
                            </h1>
                            <p className="text-slate-500 text-xs font-semibold">
                                Monitorizare activitate utilizatori, gestionare acces clienți fără agenți & configurare recomandări.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <button
                        onClick={() => setIsRecModalOpen(true)}
                        className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md"
                    >
                        <Settings className="w-4 h-4 text-orange-400" />
                        Setări Recomandări Client
                    </button>
                </div>
            </div>

            {/* Filter Bar with Category Tabs */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col space-y-4 shrink-0">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-80">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Caută utilizator după nume, email sau telefon..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500 text-slate-900"
                            />
                        </div>
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl outline-none"
                        >
                            <option value="all">Toate rolurile</option>
                            <option value="client">Client</option>
                            <option value="client_no_agency">Client fără agenție</option>
                            <option value="agent">Agent</option>
                            <option value="owner">Proprietar</option>
                            <option value="developer">Dezvoltator</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <div className="text-xs text-slate-500 font-semibold">
                        Afișare <span className="font-extrabold text-slate-900">{filteredUsers.length}</span> utilizatori din baza de date
                    </div>
                </div>

                {/* Category Quick Filter Buttons */}
                <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100">
                    <button
                        onClick={() => setCategoryFilter('all')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${categoryFilter === 'all' ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                    >
                        Toate Categoriile (4 Categorii)
                    </button>
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setCategoryFilter(cat.id)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${categoryFilter === cat.id ? 'bg-orange-600 text-white shadow-md' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                        >
                            <span>{cat.name}</span>
                            <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-black">
                                {cat.pending.length + cat.approved.length}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Category Groups View - Paired Pending & Approved Columns */}
            <div className="flex-1 space-y-8 overflow-y-auto pr-1">
                {CATEGORIES.filter(cat => categoryFilter === 'all' || categoryFilter === cat.id).map(cat => (
                    <div key={cat.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                        {/* Category Section Header */}
                        <div className={`p-4 rounded-xl border ${cat.color} flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
                            <div>
                                <h3 className="text-base font-black tracking-tight">{cat.name}</h3>
                                <p className="text-xs opacity-80 font-medium">{cat.desc}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                {cat.id === 'direct_owner_only' ? (
                                    <>
                                        <span className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-black shadow-sm flex items-center gap-1">
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Activi: {cat.approved.length}
                                        </span>
                                        <span className="px-3 py-1 bg-slate-700 text-white rounded-lg text-xs font-black shadow-sm flex items-center gap-1">
                                            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> Arhivați: {cat.pending.length}
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <span className="px-3 py-1 bg-amber-500 text-slate-950 rounded-lg text-xs font-black shadow-sm flex items-center gap-1">
                                            <Clock className="w-3.5 h-3.5" /> Cereri: {cat.pending.length}
                                        </span>
                                        <span className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-black shadow-sm flex items-center gap-1">
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Acceptați: {cat.approved.length}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Side-by-side Sub-Columns Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            {/* Sub-Column 1 */}
                            {cat.id === 'direct_owner_only' ? (
                                /* Section 1: Sub-Column 1 = Clienți Activi (Aprobați) */
                                <div className="bg-emerald-50/40 rounded-xl border border-emerald-200/80 p-4 space-y-3">
                                    <div className="flex items-center justify-between pb-3 border-b border-emerald-200/60">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-emerald-600"></div>
                                            <h4 className="font-black text-xs text-emerald-900 uppercase tracking-wider">
                                                Clienți Activi (Aprobați)
                                            </h4>
                                        </div>
                                        <span className="bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full text-xs font-black">
                                            {cat.approved.length}
                                        </span>
                                    </div>

                                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                                        {cat.approved.length > 0 ? (
                                            cat.approved.map(user => (
                                                <div key={user.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col justify-between space-y-3">
                                                    <div>
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center border border-emerald-200 shrink-0">
                                                                    {(user.full_name || user.email || '?').charAt(0).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{user.full_name || 'Utilizator Fără Nume'}</h4>
                                                                    <span className="text-[11px] text-slate-400 block line-clamp-1">{user.email}</span>
                                                                    {user.phone ? (
                                                                        <span className="text-[11px] text-slate-700 font-bold flex items-center gap-1 mt-0.5">
                                                                            <Phone className="w-3 h-3 text-orange-600 shrink-0" />
                                                                            {user.phone}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-[11px] text-slate-400 italic block mt-0.5">Fără telefon</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-100 text-[11px]">
                                                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                                                                {user.role === 'client_no_agency' ? 'Client fără agenție' : user.role}
                                                            </span>
                                                            <span className="flex items-center gap-1 font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded border border-yellow-200">
                                                                <Coins className="w-3 h-3 text-yellow-500" /> {user.credits || 0} CR
                                                            </span>
                                                        </div>

                                                        <div className="flex flex-col gap-1 mt-2">
                                                            {user.find_self_from_owner && (
                                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/80">
                                                                    <Check className="w-3 h-3 shrink-0 text-emerald-600" /> Găsește singur de la proprietar
                                                                </div>
                                                            )}
                                                            {user.wants_agent_help !== false && (
                                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/80">
                                                                    <Check className="w-3 h-3 shrink-0 text-indigo-600" /> Solicită ajutor Broker / Agent
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1.5 pt-3 border-t border-slate-100">
                                                        <button
                                                            onClick={() => handleOpenRestrictionsModal(user)}
                                                            className="w-full py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 border border-slate-200 cursor-pointer"
                                                        >
                                                            <Shield className="w-3.5 h-3.5 text-slate-500" /> Modifică Filtre Acces
                                                        </button>
                                                        <button
                                                            onClick={() => setPreviewUser(user)}
                                                            className="w-full py-1.5 px-2 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 border border-orange-200 cursor-pointer"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" /> Vezi Dashboard Client
                                                        </button>
                                                        <button
                                                            onClick={() => handleOpenActivityMonitor(user)}
                                                            className="w-full py-1.5 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 border border-indigo-200 cursor-pointer"
                                                        >
                                                            <Activity className="w-3.5 h-3.5" /> Monitorizează Activitatea
                                                        </button>
                                                        <button
                                                            onClick={() => handleApproveUser(user.id, user.is_approved)}
                                                            className="w-full py-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 border border-amber-200 cursor-pointer"
                                                        >
                                                            <ShieldAlert className="w-3.5 h-3.5" /> Suspendă Acces / Arhivează
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteUserCard(user.id, user.full_name)}
                                                            className="w-full py-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 border border-rose-200 cursor-pointer transition-colors"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" /> Șterge Cerere / Card
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="py-8 text-center text-slate-400 text-xs font-semibold">
                                                Niciun client activ în această categorie.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                /* Sections 2-4: Sub-Column 1 = Cereri În Așteptare (Ne-aprobați) */
                                <div className="bg-amber-50/50 rounded-xl border border-amber-200/80 p-4 space-y-3">
                                    <div className="flex items-center justify-between pb-3 border-b border-amber-200/60">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse"></div>
                                            <h4 className="font-black text-xs text-amber-900 uppercase tracking-wider">
                                                Cereri În Așteptare (Ne-aprobați)
                                            </h4>
                                        </div>
                                        <span className="bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full text-xs font-black">
                                            {cat.pending.length}
                                        </span>
                                    </div>

                                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                                        {cat.pending.length > 0 ? (
                                            cat.pending.map(user => (
                                                <div key={user.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col justify-between space-y-3">
                                                    <div>
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 font-black text-xs flex items-center justify-center border border-amber-200 shrink-0">
                                                                    {(user.full_name || user.email || '?').charAt(0).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{user.full_name || 'Utilizator Fără Nume'}</h4>
                                                                    <span className="text-[11px] text-slate-400 block line-clamp-1">{user.email}</span>
                                                                    {user.phone ? (
                                                                        <span className="text-[11px] text-slate-700 font-bold flex items-center gap-1 mt-0.5">
                                                                            <Phone className="w-3 h-3 text-orange-600 shrink-0" />
                                                                            {user.phone}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-[11px] text-slate-400 italic block mt-0.5">Fără telefon</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-100 text-[11px]">
                                                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                                                                {user.role === 'client_no_agency' ? 'Client fără agenție' : user.role}
                                                            </span>
                                                            <span className="flex items-center gap-1 font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded border border-yellow-200">
                                                                <Coins className="w-3 h-3 text-yellow-500" /> {user.credits || 0} CR
                                                            </span>
                                                        </div>

                                                        <div className="flex flex-col gap-1 mt-2">
                                                            {user.find_self_from_owner && (
                                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/80">
                                                                    <Check className="w-3 h-3 shrink-0 text-emerald-600" /> Găsește singur de la proprietar
                                                                </div>
                                                            )}
                                                            {user.wants_agent_help !== false && (
                                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/80">
                                                                    <Check className="w-3 h-3 shrink-0 text-indigo-600" /> Solicită ajutor Broker / Agent
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1.5 pt-3 border-t border-slate-100">
                                                        <button
                                                            onClick={() => handleOpenRestrictionsModal(user)}
                                                            className="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                                                        >
                                                            <UserCheck className="w-3.5 h-3.5" /> Aprobă Acces & Filtre
                                                        </button>
                                                        <button
                                                            onClick={() => setPreviewUser(user)}
                                                            className="w-full py-1.5 px-2 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 border border-orange-200 cursor-pointer"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" /> Vezi Dashboard Client
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteUserCard(user.id, user.full_name)}
                                                            className="w-full py-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 border border-rose-200 cursor-pointer transition-colors"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" /> Șterge Cerere / Card
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="py-8 text-center text-slate-400 text-xs font-semibold">
                                                Nicio cerere în așteptare în această categorie.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Sub-Column 2 */}
                            {cat.id === 'direct_owner_only' ? (
                                /* Section 1: Sub-Column 2 = Clienți Arhivați (Acces Suspendat) */
                                <div className="bg-slate-100/80 rounded-xl border border-slate-300 p-4 space-y-3">
                                    <div className="flex items-center justify-between pb-3 border-b border-slate-300">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-slate-600"></div>
                                            <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider">
                                                Clienți Arhivați (Acces Suspendat)
                                            </h4>
                                        </div>
                                        <span className="bg-slate-300 text-slate-900 px-2 py-0.5 rounded-full text-xs font-black">
                                            {cat.pending.length}
                                        </span>
                                    </div>

                                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                                        {cat.pending.length > 0 ? (
                                            cat.pending.map(user => (
                                                <div key={user.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col justify-between space-y-3 opacity-80">
                                                    <div>
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 font-black text-xs flex items-center justify-center border border-slate-300 shrink-0">
                                                                    {(user.full_name || user.email || '?').charAt(0).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{user.full_name || 'Utilizator Fără Nume'}</h4>
                                                                    <span className="text-[11px] text-slate-400 block line-clamp-1">{user.email}</span>
                                                                    {user.phone ? (
                                                                        <span className="text-[11px] text-slate-700 font-bold flex items-center gap-1 mt-0.5">
                                                                            <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                                                                            {user.phone}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-[11px] text-slate-400 italic block mt-0.5">Fără telefon</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-100 text-[11px]">
                                                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                                                                {user.role === 'client_no_agency' ? 'Client fără agenție' : user.role}
                                                            </span>
                                                            <span className="flex items-center gap-1 font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                                                <Coins className="w-3 h-3 text-slate-500" /> {user.credits || 0} CR
                                                            </span>
                                                        </div>

                                                        <div className="flex flex-col gap-1 mt-2">
                                                            {user.find_self_from_owner && (
                                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                                                    <Check className="w-3 h-3 shrink-0 text-slate-500" /> Găsește singur de la proprietar
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1.5 pt-3 border-t border-slate-100">
                                                        <button
                                                            onClick={() => handleApproveUser(user.id, user.is_approved)}
                                                            className="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                                                        >
                                                            <UserCheck className="w-3.5 h-3.5" /> Restabilește Acces / Reactivează
                                                        </button>
                                                        <button
                                                            onClick={() => setPreviewUser(user)}
                                                            className="w-full py-1.5 px-2 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 border border-orange-200 cursor-pointer"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" /> Vezi Dashboard Client
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteUserCard(user.id, user.full_name)}
                                                            className="w-full py-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 border border-rose-200 cursor-pointer transition-colors"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" /> Șterge Cerere / Card
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="py-8 text-center text-slate-400 text-xs font-semibold">
                                                Niciun client arhivat / suspendat în această categorie.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                /* Sections 2-4: Sub-Column 2 = Acceptați & Activi (Aprobați) */
                                <div className="bg-emerald-50/40 rounded-xl border border-emerald-200/80 p-4 space-y-3">
                                    <div className="flex items-center justify-between pb-3 border-b border-emerald-200/60">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-emerald-600"></div>
                                            <h4 className="font-black text-xs text-emerald-900 uppercase tracking-wider">
                                                Acceptați & Activi (Aprobați)
                                            </h4>
                                        </div>
                                        <span className="bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full text-xs font-black">
                                            {cat.approved.length}
                                        </span>
                                    </div>

                                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                                        {cat.approved.length > 0 ? (
                                            cat.approved.map(user => (
                                                <div key={user.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col justify-between space-y-3">
                                                    <div>
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center border border-emerald-200 shrink-0">
                                                                    {(user.full_name || user.email || '?').charAt(0).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{user.full_name || 'Utilizator Fără Nume'}</h4>
                                                                    <span className="text-[11px] text-slate-400 block line-clamp-1">{user.email}</span>
                                                                    {user.phone ? (
                                                                        <span className="text-[11px] text-slate-700 font-bold flex items-center gap-1 mt-0.5">
                                                                            <Phone className="w-3 h-3 text-orange-600 shrink-0" />
                                                                            {user.phone}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-[11px] text-slate-400 italic block mt-0.5">Fără telefon</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-100 text-[11px]">
                                                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                                                                {user.role === 'client_no_agency' ? 'Client fără agenție' : user.role}
                                                            </span>
                                                            <span className="flex items-center gap-1 font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded border border-yellow-200">
                                                                <Coins className="w-3 h-3 text-yellow-500" /> {user.credits || 0} CR
                                                            </span>
                                                        </div>

                                                        <div className="flex flex-col gap-1 mt-2">
                                                            {user.find_self_from_owner && (
                                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/80">
                                                                    <Check className="w-3 h-3 shrink-0 text-emerald-600" /> Găsește singur de la proprietar
                                                                </div>
                                                            )}
                                                            {user.wants_agent_help !== false && (
                                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/80">
                                                                    <Check className="w-3 h-3 shrink-0 text-indigo-600" /> Solicită ajutor Broker / Agent
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1.5 pt-3 border-t border-slate-100">
                                                        <button
                                                            onClick={() => handleOpenRestrictionsModal(user)}
                                                            className="w-full py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 border border-slate-200 cursor-pointer"
                                                        >
                                                            <Shield className="w-3.5 h-3.5 text-slate-500" /> Modifică Filtre Acces
                                                        </button>
                                                        <button
                                                            onClick={() => setPreviewUser(user)}
                                                            className="w-full py-1.5 px-2 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 border border-orange-200 cursor-pointer"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" /> Vezi Dashboard Client
                                                        </button>
                                                        <button
                                                            onClick={() => handleOpenActivityMonitor(user)}
                                                            className="w-full py-1.5 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 border border-indigo-200 cursor-pointer"
                                                        >
                                                            <Activity className="w-3.5 h-3.5" /> Monitorizează Activitatea
                                                        </button>
                                                        <button
                                                            onClick={() => handleApproveUser(user.id, user.is_approved)}
                                                            className="w-full py-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 border border-amber-200 cursor-pointer"
                                                        >
                                                            <ShieldAlert className="w-3.5 h-3.5" /> Suspendă Acces
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteUserCard(user.id, user.full_name)}
                                                            className="w-full py-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 border border-rose-200 cursor-pointer transition-colors"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" /> Șterge Cerere / Card
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="py-8 text-center text-slate-400 text-xs font-semibold">
                                                Niciun utilizator acceptat în această categorie.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* MODAL 1: ACCESS APPROVAL & PROPERTY FILTERS RESTRICTIONS (Matching Poza 3) */}
            {selectedUserForRestrictions && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
                    <div className="bg-slate-900 text-white border border-slate-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                            <div className="flex items-center gap-3">
                                <UserCheck className="w-6 h-6 text-indigo-400" />
                                <div>
                                    <h3 className="text-lg font-extrabold text-white">
                                        Filtre Acces Proprietăți: <span className="text-indigo-400">{selectedUserForRestrictions.full_name || selectedUserForRestrictions.email}</span>
                                    </h3>
                                    <p className="text-slate-400 text-xs mt-0.5">
                                        Selectează categoriile de proprietăți pe care le poate accesa acest utilizator. Lăsând o secțiune goală (nicio opțiune selectată), utilizatorul are acces implicit la toate opțiunile din acea categorie.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedUserForRestrictions(null)}
                                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {restrictionsStatusMsg && (
                            <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
                                restrictionsStatusMsg.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}>
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                {restrictionsStatusMsg.text}
                            </div>
                        )}

                        {/* Banner Aprobare Cont (Exact ca în Poza 3) */}
                        {selectedUserForRestrictions.is_approved === false && (
                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="text-xs font-bold text-amber-500 uppercase tracking-wider">APROBARE CONT CLIENT</div>
                                    <div className="text-sm font-bold text-white">Acest cont de {selectedUserForRestrictions.role} înregistrat nu este încă aprobat.</div>
                                    <p className="text-slate-400 text-xs">Aprobă contul pentru a-i acorda acces la interfață.</p>
                                </div>
                                <button
                                    onClick={() => handleApproveUser(selectedUserForRestrictions.id, false)}
                                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                                >
                                    <CheckCircle2 className="w-4 h-4" /> Aprobă Contul
                                </button>
                            </div>
                        )}

                        {/* Restriction Checkboxes Matrix (Exact ca în Poza 3) */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                            {/* TIPURI PROPRIETATE */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">TIPURI PROPRIETATE</h4>
                                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                    {PROPERTY_TYPES.map(type => (
                                        <label key={type} className="flex items-center gap-3 text-xs text-slate-300 hover:text-white cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={allowedTypes.includes(type)}
                                                onChange={() => toggleRestrictionItem(type, 'type')}
                                                className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 w-4 h-4"
                                            />
                                            <span>{type}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* TIPURI TRANZACTIE */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">TIPURI TRANZACȚIE</h4>
                                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                    {TRANSACTION_TYPES.map(tx => (
                                        <label key={tx} className="flex items-center gap-3 text-xs text-slate-300 hover:text-white cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={allowedTransactions.includes(tx)}
                                                onChange={() => toggleRestrictionItem(tx, 'transaction')}
                                                className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 w-4 h-4"
                                            />
                                            <span>{tx}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* ORASE PERMISE */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">ORAȘE PERMISE</h4>
                                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                    {SAMPLE_CITIES.map(city => (
                                        <label key={city} className="flex items-center gap-3 text-xs text-slate-300 hover:text-white cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={allowedCities.includes(city)}
                                                onChange={() => toggleRestrictionItem(city, 'city')}
                                                className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 w-4 h-4"
                                            />
                                            <span>{city}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
                            <button
                                onClick={() => setSelectedUserForRestrictions(null)}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
                            >
                                Închide
                            </button>
                            <button
                                onClick={handleSaveRestrictions}
                                disabled={isSavingRestrictions}
                                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20"
                            >
                                <Check className="w-4 h-4" />
                                {isSavingRestrictions ? 'Se salvează...' : 'SALVEAZĂ RESTRICȚII'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 2: USER ACTIVITY MONITOR */}
            {monitoredUser && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
                    <div className="bg-slate-900 text-white border border-slate-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                            <div className="flex items-center gap-3">
                                <Activity className="w-6 h-6 text-indigo-400" />
                                <div>
                                    <h3 className="text-lg font-extrabold text-white">
                                        Monitorizare Activitate: <span className="text-orange-400">{monitoredUser.full_name || monitoredUser.email}</span>
                                    </h3>
                                    <p className="text-slate-400 text-xs mt-0.5">
                                        Sesiuni autentificare, istoric acțiuni, clicuri butoane & consum de credite.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setMonitoredUser(null)}
                                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Tabs inside activity monitor */}
                        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1">
                            <button
                                onClick={() => setActivityTab('sessions')}
                                className={`flex-1 py-2 rounded-lg text-xs font-extrabold uppercase transition-all flex items-center justify-center gap-2 ${
                                    activityTab === 'sessions' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <Clock className="w-3.5 h-3.5" /> Sesiuni Logare
                            </button>
                            <button
                                onClick={() => setActivityTab('actions')}
                                className={`flex-1 py-2 rounded-lg text-xs font-extrabold uppercase transition-all flex items-center justify-center gap-2 ${
                                    activityTab === 'actions' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <MousePointer className="w-3.5 h-3.5" /> Acțiuni & Clicuri Butoane
                            </button>
                            <button
                                onClick={() => setActivityTab('credits')}
                                className={`flex-1 py-2 rounded-lg text-xs font-extrabold uppercase transition-all flex items-center justify-center gap-2 ${
                                    activityTab === 'credits' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <Coins className="w-3.5 h-3.5" /> Consum Credite
                            </button>
                        </div>

                        {isLoadingActivity ? (
                            <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                                <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
                                <span>Se încarcă datele de activitate...</span>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {activityTab === 'sessions' && (
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Istoric Logări & Durată Sesiuni</h4>
                                        {activityData?.sessions && activityData.sessions.length > 0 ? (
                                            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                                                {activityData.sessions.map((sess: any) => (
                                                    <div key={sess.id} className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                                                        <div>
                                                            <div className="font-bold text-white flex items-center gap-2">
                                                                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                                                Logat la: {new Date(sess.login_at).toLocaleString()}
                                                            </div>
                                                            <div className="text-slate-400 text-[11px] mt-0.5">
                                                                Ultima activitate: {new Date(sess.last_active_at).toLocaleString()}
                                                            </div>
                                                        </div>
                                                        <span className="bg-slate-900 text-slate-300 font-mono text-[10px] px-2 py-1 rounded border border-slate-800">
                                                            {sess.ip_address || 'IP Înregistrat'}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-8 text-center text-slate-500 text-xs bg-slate-950/40 rounded-xl border border-slate-800">
                                                Nu au fost găsite sesiuni anterioare înregistrate.
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activityTab === 'actions' && (
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Acțiuni Înregistrate pe Pagini & Interacțiuni</h4>
                                        {activityData?.logs && activityData.logs.length > 0 ? (
                                            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                                                {activityData.logs.map((log: any) => (
                                                    <div key={log.id} className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex justify-between items-start text-xs">
                                                        <div className="space-y-1">
                                                            <div className="font-bold text-white flex items-center gap-2">
                                                                <span className="text-orange-400">[{log.event_type}]</span>
                                                                {log.description}
                                                            </div>
                                                            {log.page_path && (
                                                                <span className="text-[10px] text-slate-400 font-mono block">
                                                                    Pagina: {log.page_path}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] text-slate-500 shrink-0">
                                                            {new Date(log.created_at).toLocaleString()}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-8 text-center text-slate-500 text-xs bg-slate-950/40 rounded-xl border border-slate-800">
                                                Nu există încă acțiuni detaliate înregistrate pentru acest utilizator.
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activityTab === 'credits' && (
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Consum Credite pe Feature-uri & Detalii Proprietate</h4>
                                        {activityData?.creditTxns && activityData.creditTxns.length > 0 ? (
                                            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                                                {activityData.creditTxns.map((tx: any) => (
                                                    <div key={tx.id} className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                                                        <div>
                                                            <div className="font-bold text-white">{tx.description}</div>
                                                            <div className="text-[10px] text-slate-400">
                                                                {new Date(tx.created_at).toLocaleString()}
                                                            </div>
                                                        </div>
                                                        <span className={`font-black text-sm px-2.5 py-1 rounded-lg ${
                                                            tx.amount < 0 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                        }`}>
                                                            {tx.amount > 0 ? `+${tx.amount}` : tx.amount} credite
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-8 text-center text-slate-500 text-xs bg-slate-950/40 rounded-xl border border-slate-800">
                                                Nu a fost înregistrat consum de credite pentru acest utilizator.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL 3: SETĂRI RECOMANDĂRI CLIENT (SUPERADMIN) */}
            {isRecModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
                    <div className="bg-slate-900 text-white border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                            <div className="flex items-center gap-3">
                                <Sparkles className="w-6 h-6 text-orange-400" />
                                <div>
                                    <h3 className="text-lg font-extrabold text-white">
                                        Configurare Recomandări Client (AI Pipeline)
                                    </h3>
                                    <p className="text-slate-400 text-xs mt-0.5">
                                        Modifică textul explicativ și punctele afișate în secțiunea Recomandări a clientului.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsRecModalOpen(false)}
                                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Text Recomandare Initial Client</label>
                                <textarea
                                    rows={8}
                                    value={recText}
                                    onChange={(e) => setRecText(e.target.value)}
                                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white leading-relaxed focus:outline-none focus:border-orange-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Puncte Recomandare (Rating/Punctaj)</label>
                                <input
                                    type="number"
                                    value={recPoints}
                                    onChange={(e) => setRecPoints(Number(e.target.value))}
                                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
                            <button
                                onClick={() => setIsRecModalOpen(false)}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
                            >
                                Anulează
                            </button>
                            <button
                                onClick={handleSaveRecommendation}
                                disabled={isSavingRec}
                                className="px-6 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-orange-600/20"
                            >
                                {isSavingRec ? 'Se salvează...' : 'Salvează Recomandări'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 4: PREVIEW DASHBOARD CLIENT */}
            {previewUser && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
                    <div className="bg-white text-slate-900 border border-slate-200 rounded-2xl max-w-5xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                            <div className="flex items-center gap-3">
                                <Eye className="w-6 h-6 text-orange-600" />
                                <div>
                                    <h3 className="text-lg font-black text-slate-900">
                                        Vizualizare Dashboard Client: {previewUser.full_name || previewUser.email}
                                    </h3>
                                    <p className="text-slate-500 text-xs font-bold">
                                        Exact așa vede clientul interfata sa self-service cu taburile de AI Matching.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setPreviewUser(null)}
                                className="p-2 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                            <Link
                                href={`/dashboard/client/ai-matching`}
                                target="_blank"
                                className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-md"
                            >
                                Deschide Pagina Client Live <ArrowUpRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
