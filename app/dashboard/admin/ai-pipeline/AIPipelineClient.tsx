'use client';

import React, { useState } from 'react';
import { 
    Zap, Users, UserCheck, ShieldAlert, Activity, Search, Filter, 
    CheckCircle2, XCircle, Eye, Settings, Clock, Coins, MousePointer, 
    ArrowUpRight, AlertCircle, RefreshCw, Layers, Check, X, Shield, BedDouble, Ruler, MapPin, Sparkles
} from 'lucide-react';
import { toggleUserApproval, saveUserPropertyRestrictions } from '@/app/lib/admin';
import { 
    saveAIPipelineRecommendationSetting, 
    getUserActivityDetails 
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

    // Filtering users
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
        return true;
    });

    // Categorized Columns for Board View
    const pendingAccessUsers = filteredUsers.filter(u => u.is_approved === false && u.role !== 'client_no_agency');
    const clientNoAgencyUsers = filteredUsers.filter(u => u.role === 'client_no_agency');
    const activeMarketClients = filteredUsers.filter(u => u.is_approved !== false && u.role !== 'client_no_agency' && (u.role === 'client' || u.role === 'owner'));
    const activeAgentsAndDevs = filteredUsers.filter(u => u.is_approved !== false && u.role !== 'client_no_agency' && (u.role === 'agent' || u.role === 'developer' || u.role === 'admin' || u.role === 'super_admin'));
    const suspendedUsers = filteredUsers.filter(u => u.is_approved === false && u.role !== 'client_no_agency');

    const STAGES = [
        { id: 'pending', title: 'Solicitări Acces Client (În Așteptare)', count: pendingAccessUsers.length, color: 'bg-amber-500', users: pendingAccessUsers },
        { id: 'client_no_agency', title: 'Clienți Fără Agenție (Self-Service Market)', count: clientNoAgencyUsers.length, color: 'bg-orange-500', users: clientNoAgencyUsers },
        { id: 'clients', title: 'Clienți Activi (Market)', count: activeMarketClients.length, color: 'bg-blue-500', users: activeMarketClients },
        { id: 'agents', title: 'Agenți, Devoltatori & Admini', count: activeAgentsAndDevs.length, color: 'bg-purple-500', users: activeAgentsAndDevs },
        { id: 'suspended', title: 'Acces Suspendat (Comportament Fraudulos)', count: suspendedUsers.length, color: 'bg-rose-500', users: suspendedUsers }
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

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
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

            {/* Column Board View - Same design & column style as Sales Pipeline (Poza 1) */}
            <div className="flex-1 min-h-[500px] overflow-hidden relative group border-b-4 border-slate-200 rounded-b-xl">
                <div className="flex-1 overflow-x-auto snap-x snap-mandatory h-full">
                    <div className="flex gap-4 px-2 min-w-max h-full pb-4">
                        {STAGES.map(stage => (
                            <div key={stage.id} className="w-[85vw] md:w-80 flex-shrink-0 snap-center flex flex-col bg-slate-50/70 rounded-2xl border border-slate-200 h-full max-h-full">
                                {/* Column Header */}
                                <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white rounded-t-2xl sticky top-0 z-10 shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${stage.color}`}></div>
                                        <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">{stage.title}</h3>
                                    </div>
                                    <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full text-xs font-black">
                                        {stage.count}
                                    </span>
                                </div>

                                {/* Cards List */}
                                <div className="p-3 space-y-3 flex-1 overflow-y-auto min-h-[100px]">
                                    {stage.users.length > 0 ? (
                                        stage.users.map(user => (
                                            <div key={user.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all group flex flex-col justify-between">
                                                <div>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 font-black text-xs flex items-center justify-center border border-orange-200 shrink-0">
                                                                {(user.full_name || user.email || '?').charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{user.full_name || 'Utilizator Fără Nume'}</h4>
                                                                <span className="text-[11px] text-slate-400 block line-clamp-1">{user.email}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-100 text-[11px]">
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                                                            {user.role === 'client_no_agency' ? 'Client fără agenție' : user.role}
                                                        </span>
                                                        <span className="flex items-center gap-1 font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded border border-yellow-200">
                                                            <Coins className="w-3 h-3 text-yellow-500" /> {user.credits || 0} credite
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
                                                                <Check className="w-3 h-3 shrink-0 text-indigo-600" /> Solicită și ajutor Agent / Broker Imobiliar
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="space-y-1.5 mt-4 pt-3 border-t border-slate-100">
                                                    {user.is_approved === false && (
                                                        <button
                                                            onClick={() => handleOpenRestrictionsModal(user)}
                                                            className="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                                                        >
                                                            <UserCheck className="w-3.5 h-3.5" /> Aprobă Acces & Filtre
                                                        </button>
                                                    )}

                                                    {user.is_approved !== false && (
                                                        <button
                                                            onClick={() => handleOpenRestrictionsModal(user)}
                                                            className="w-full py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors border border-slate-200"
                                                        >
                                                            <Shield className="w-3.5 h-3.5 text-slate-500" /> Modifică Filtre Acces
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => setPreviewUser(user)}
                                                        className="w-full py-1.5 px-2 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors border border-orange-200"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" /> Vezi Dashboard Client
                                                    </button>

                                                    <button
                                                        onClick={() => handleOpenActivityMonitor(user)}
                                                        className="w-full py-1.5 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors border border-indigo-200"
                                                    >
                                                        <Activity className="w-3.5 h-3.5" /> Monitorizează Activitatea
                                                    </button>

                                                    <button
                                                        onClick={() => handleApproveUser(user.id, user.is_approved)}
                                                        className={`w-full py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors border ${
                                                            user.is_approved === false
                                                                ? 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200'
                                                                : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                                                        }`}
                                                    >
                                                        <ShieldAlert className="w-3.5 h-3.5" />
                                                        {user.is_approved === false ? 'Restabilește Accesul' : 'Suspendă Accesul'}
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-10 opacity-50">
                                            <div className="text-xs font-medium text-slate-400 border-2 border-dashed border-slate-200 rounded-xl p-4">
                                                Niciun utilizator în această coloană
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
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
