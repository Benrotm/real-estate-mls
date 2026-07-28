'use client';

import React, { useState } from 'react';
import { 
    Zap, Users, UserCheck, ShieldAlert, Activity, Search, Filter, 
    CheckCircle2, XCircle, Eye, Settings, Clock, Coins, MousePointer, 
    ArrowUpRight, AlertCircle, RefreshCw, Layers, Check, X, Shield, BedDouble, Ruler, MapPin, Sparkles, Phone, Trash2, Archive, ArchiveRestore, FolderArchive, SlidersHorizontal, PlusCircle, Calendar
} from 'lucide-react';
import { toggleUserApproval, saveUserPropertyRestrictions, toggleUserArchived } from '@/app/lib/admin';
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
    is_archived?: boolean;
    is_crm_only_lead?: boolean;
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

    // Credit Grant Modal State
    const [selectedUserForCredits, setSelectedUserForCredits] = useState<User | null>(null);
    const [grantAmount, setGrantAmount] = useState<number>(15);
    const [grantReason, setGrantReason] = useState<string>('');
    const [isGrantingCredits, setIsGrantingCredits] = useState(false);
    const [grantStatusMsg, setGrantStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleGrantCreditsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isGrantingCredits || !selectedUserForCredits) return;
        if (!grantAmount || isNaN(grantAmount)) {
            setGrantStatusMsg({ type: 'error', text: 'Te rugăm să introduci o sumă de credite validă.' });
            return;
        }

        setIsGrantingCredits(true);
        setGrantStatusMsg(null);
        try {
            const { grantUserCredits } = await import('@/app/lib/actions/credits');
            const res = await grantUserCredits(selectedUserForCredits.id, Number(grantAmount), grantReason.trim() || undefined);
            
            if (res.error) {
                setGrantStatusMsg({ type: 'error', text: res.error });
            } else {
                const newBalance = res.newBalance;
                setUsers(prev => prev.map(u => u.id === selectedUserForCredits.id ? { ...u, credits: newBalance } : u));
                setGrantStatusMsg({ type: 'success', text: `Credite alocate cu succes! Noul sold este de ${newBalance} CR.` });
                setTimeout(() => {
                    setSelectedUserForCredits(null);
                    setGrantStatusMsg(null);
                    setGrantReason('');
                }, 1500);
            }
        } catch (err: any) {
            setGrantStatusMsg({ type: 'error', text: err.message || 'Eroare la alocarea creditelor' });
        } finally {
            setIsGrantingCredits(false);
        }
    };

    // Activity Monitor Modal state
    const [monitoredUser, setMonitoredUser] = useState<User | null>(null);
    const [activityData, setActivityData] = useState<any>(null);
    const [isLoadingActivity, setIsLoadingActivity] = useState(false);
    const [activityTab, setActivityTab] = useState<'sessions' | 'actions' | 'credits'>('sessions');

    // Client Dashboard Preview Modal state
    const [previewUser, setPreviewUser] = useState<User | null>(null);

    // Selected user for Criteria & Preferences Modal
    const [selectedUserForCriteria, setSelectedUserForCriteria] = useState<User | null>(null);

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

    // Handle user archiving toggle
    const handleArchiveUser = async (userId: string, currentArchived: boolean | undefined) => {
        try {
            await toggleUserArchived(userId, !currentArchived);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_archived: !currentArchived } : u));
        } catch (err: any) {
            alert('Eroare la schimbarea stării de arhivare: ' + err.message);
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
        
        // 4. Formular CRM (Invite New Lead from Leads & CRM, no user profile account)
        if ((u as any).is_crm_only_lead || role === 'crm_lead' || source.includes('crm_invite') || source.includes('formular crm')) {
            return 'crm_invite';
        }

        const findOwner = u.find_self_from_owner === true;
        const wantAgent = u.wants_agent_help === true;

        // 2. Both Options: Client with BOTH find_self_from_owner === true AND wants_agent_help === true
        if (findOwner && wantAgent) {
            return 'both_options';
        }

        // 3. Agent Only: "Vreau ajutor de la un Agent / Broker Imobiliar" checked, "Găsește singur de la proprietari" unchecked
        if (!findOwner && wantAgent) {
            return 'agent_only';
        }

        // 1. Direct Owner Only: Client with find_self_from_owner === true AND wants_agent_help !== true
        return 'direct_owner_only';
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
        if (categoryFilter !== 'all' && classifyUserCategory(u) !== categoryFilter) return false;
        return true;
    });

    // Categorized Board Groups & Paired Columns (Activi, Suspendați & Arhivați)
    const cat1Users = filteredUsers.filter(u => classifyUserCategory(u) === 'direct_owner_only');
    const cat2Users = filteredUsers.filter(u => classifyUserCategory(u) === 'both_options');
    const cat3Users = filteredUsers.filter(u => classifyUserCategory(u) === 'agent_only');
    const cat4Users = filteredUsers.filter(u => classifyUserCategory(u) === 'crm_invite');
    const cat5ArchivedUsers = filteredUsers.filter(u => u.is_archived === true);

    const CATEGORIES = [
        {
            id: 'direct_owner_only',
            name: '1. Clienți Doar de la Proprietar',
            desc: 'Fără agenție (Doar căutare direct de la proprietari)',
            color: 'text-orange-600 border-orange-200 bg-orange-50',
            colCount: 3,
            col1Title: 'Clienți Activi (Aprobați)',
            col2Title: 'Clienți cu Acces Suspendat',
            col3Title: 'Clienți Arhivați',
            active: cat1Users.filter(u => u.is_approved !== false && u.is_archived !== true),
            suspended: cat1Users.filter(u => u.is_approved === false && u.is_archived !== true),
            archived: cat1Users.filter(u => u.is_archived === true)
        },
        {
            id: 'both_options',
            name: '2. Clienți cu Ambele Opțiuni',
            desc: 'Și direct de la proprietar și cu ajutor Broker/Agent',
            color: 'text-blue-600 border-blue-200 bg-blue-50',
            colCount: 3,
            col1Title: 'Acceptați & Activi (Aprobați)',
            col2Title: 'Cereri În Așteptare / Suspendate',
            col3Title: 'Clienți Arhivați',
            active: cat2Users.filter(u => u.is_approved !== false && u.is_archived !== true),
            suspended: cat2Users.filter(u => u.is_approved === false && u.is_archived !== true),
            archived: cat2Users.filter(u => u.is_archived === true)
        },
        {
            id: 'agent_only',
            name: '3. Clienți Doar cu Ajutor Agent / Broker',
            desc: 'Clienți care au bifat doar opțiunea Vreau ajutor de la un Agent/Broker (Intră direct în CRM)',
            color: 'text-purple-600 border-purple-200 bg-purple-50',
            colCount: 2,
            col1Title: 'Clienți Activi (În CRM)',
            col2Title: 'Clienți Arhivați',
            col3Title: '',
            active: cat3Users.filter(u => u.is_archived !== true),
            suspended: [],
            archived: cat3Users.filter(u => u.is_archived === true)
        },
        {
            id: 'crm_invite',
            name: '4. Formular CRM (Invite New Lead)',
            desc: 'Lead-uri venite prin link-ul de invitare din pagina Leads & CRM (Fără proces de aprobare/suspendare)',
            color: 'text-emerald-600 border-emerald-200 bg-emerald-50',
            colCount: 2,
            col1Title: 'Clienți Activi',
            col2Title: 'Clienți Arhivați',
            col3Title: '',
            active: cat4Users.filter(u => u.is_archived !== true),
            suspended: [],
            archived: cat4Users.filter(u => u.is_archived === true)
        },
        {
            id: 'archived_all',
            name: '5. Clienți Arhivați (Toate Categoriile)',
            desc: 'Toți clienții arhivați / inactivi pentru a menține secțiunile active curate',
            color: 'text-slate-700 border-slate-300 bg-slate-100',
            colCount: 1,
            col1Title: 'Toți Clienții Arhivați',
            col2Title: '',
            col3Title: '',
            active: cat5ArchivedUsers,
            suspended: [],
            archived: []
        }
    ];

    const renderCard = (user: User, colType: 'active' | 'suspended' | 'archived') => (
        <div key={user.id} className={`bg-white p-4 rounded-xl shadow-sm border ${colType === 'suspended' ? 'border-amber-200 bg-amber-50/20' : colType === 'archived' ? 'border-slate-300 bg-slate-50/50 opacity-90' : 'border-slate-200'} hover:shadow-md transition-all flex flex-col justify-between space-y-3`}>
            <div>
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg ${colType === 'suspended' ? 'bg-amber-100 text-amber-800 border-amber-200' : colType === 'archived' ? 'bg-slate-200 text-slate-700 border-slate-300' : 'bg-emerald-100 text-emerald-800 border-emerald-200'} font-black text-xs flex items-center justify-center border shrink-0`}>
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
                            {user.created_at && (
                                <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1 mt-1 bg-slate-100/80 px-2 py-0.5 rounded border border-slate-200/60 w-fit">
                                    <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                                    Înregistrat: {new Date(user.created_at).toLocaleString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-100 text-[11px]">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                        {user.role === 'client_no_agency' ? 'Client fără agenție' : user.role === 'crm_lead' ? 'Lead CRM' : user.role}
                    </span>
                    <button
                        type="button"
                        onClick={() => {
                            setSelectedUserForCredits(user);
                            setGrantAmount(15);
                            setGrantReason('');
                            setGrantStatusMsg(null);
                        }}
                        title="Click pentru a aloca credite acestui utilizator"
                        className="flex items-center gap-1 font-extrabold text-amber-900 bg-amber-100 hover:bg-amber-200 px-2.5 py-0.5 rounded-lg border border-amber-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                    >
                        <Coins className="w-3.5 h-3.5 text-amber-600" /> {user.credits || 0} CR <PlusCircle className="w-3 h-3 text-amber-700" />
                    </button>
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

            {/* Universal Card Action Buttons */}
            <div className="space-y-1.5 pt-3 border-t border-slate-100">
                <button
                    onClick={() => {
                        setSelectedUserForCredits(user);
                        setGrantAmount(15);
                        setGrantReason('');
                        setGrantStatusMsg(null);
                    }}
                    className="w-full py-1.5 px-2 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-slate-950 rounded-lg text-[11px] font-extrabold flex items-center justify-center gap-1.5 border border-amber-500/30 cursor-pointer shadow-2xs transition-all active:scale-95"
                >
                    <Coins className="w-3.5 h-3.5 text-slate-950" /> Alocă Credite CR
                </button>
                <button
                    onClick={() => setSelectedUserForCriteria(user)}
                    className="w-full py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 border border-emerald-200 cursor-pointer transition-colors"
                >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" /> Criterii & Preferințe
                </button>
                <button
                    onClick={() => handleOpenRestrictionsModal(user)}
                    className="w-full py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 border border-slate-200 cursor-pointer"
                >
                    <Shield className="w-3.5 h-3.5 text-slate-500" /> Modifică Filtre Acces
                </button>
                <div className="grid grid-cols-2 gap-1.5">
                    <button
                        onClick={() => setPreviewUser(user)}
                        className="py-1.5 px-2 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 border border-orange-200 cursor-pointer"
                    >
                        <Eye className="w-3.5 h-3.5" /> Dashboard
                    </button>
                    <button
                        onClick={() => handleOpenActivityMonitor(user)}
                        className="py-1.5 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 border border-indigo-200 cursor-pointer"
                    >
                        <Activity className="w-3.5 h-3.5" /> Monitorizare
                    </button>
                </div>

                {colType === 'active' && (
                    <>
                        <div className="grid grid-cols-2 gap-1.5">
                            <button
                                onClick={() => handleApproveUser(user.id, user.is_approved)}
                                className="py-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 border border-amber-200 cursor-pointer"
                            >
                                <ShieldAlert className="w-3.5 h-3.5" /> Suspendă
                            </button>
                            <button
                                onClick={() => handleArchiveUser(user.id, user.is_archived)}
                                className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 border border-slate-300 cursor-pointer"
                            >
                                <Archive className="w-3.5 h-3.5 text-slate-600" /> Arhivează
                            </button>
                        </div>
                        <button
                            onClick={() => handleDeleteUserCard(user.id, user.full_name)}
                            className="w-full py-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 border border-rose-200 cursor-pointer transition-colors"
                        >
                            <Trash2 className="w-3.5 h-3.5" /> Șterge Cerere / Card
                        </button>
                    </>
                )}

                {colType === 'suspended' && (
                    <>
                        <div className="grid grid-cols-2 gap-1.5">
                            <button
                                onClick={() => handleApproveUser(user.id, user.is_approved)}
                                className="py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                            >
                                <UserCheck className="w-3.5 h-3.5" /> Reactivează
                            </button>
                            <button
                                onClick={() => handleArchiveUser(user.id, user.is_archived)}
                                className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 border border-slate-300 cursor-pointer"
                            >
                                <Archive className="w-3.5 h-3.5 text-slate-600" /> Arhivează
                            </button>
                        </div>
                        <button
                            onClick={() => handleDeleteUserCard(user.id, user.full_name)}
                            className="w-full py-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 border border-rose-200 cursor-pointer transition-colors"
                        >
                            <Trash2 className="w-3.5 h-3.5" /> Șterge Cerere / Card
                        </button>
                    </>
                )}

                {colType === 'archived' && (
                    <>
                        <button
                            onClick={() => handleArchiveUser(user.id, true)}
                            className="w-full py-2 px-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-black flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                        >
                            <ArchiveRestore className="w-3.5 h-3.5 text-emerald-400" /> Dezarhivează / Restabilește
                        </button>
                        <button
                            onClick={() => handleDeleteUserCard(user.id, user.full_name)}
                            className="w-full py-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 border border-rose-200 cursor-pointer transition-colors"
                        >
                            <Trash2 className="w-3.5 h-3.5" /> Șterge Definitiv Card
                        </button>
                    </>
                )}
            </div>
        </div>
    );

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
                        Toate Categoriile (4 Secțiuni)
                    </button>
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setCategoryFilter(cat.id)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${categoryFilter === cat.id ? 'bg-orange-600 text-white shadow-md' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                        >
                            <span>{cat.name}</span>
                            <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-black">
                                {cat.active.length + cat.suspended.length + cat.archived.length}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Category Groups View */}
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
                                <span className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-black shadow-sm flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Activi: {cat.active.length}
                                </span>
                                {cat.colCount === 3 && (
                                    <span className="px-3 py-1 bg-amber-500 text-slate-950 rounded-lg text-xs font-black shadow-sm flex items-center gap-1">
                                        <ShieldAlert className="w-3.5 h-3.5" /> Suspendați: {cat.suspended.length}
                                    </span>
                                )}
                                <span className="px-3 py-1 bg-slate-700 text-white rounded-lg text-xs font-black shadow-sm flex items-center gap-1">
                                    <Archive className="w-3.5 h-3.5 text-slate-300" /> Arhivați: {cat.archived.length}
                                </span>
                            </div>
                        </div>

                        {/* Dynamic Sub-Columns Grid (3 Columns vs 2 Columns vs 1 Column) */}
                        {cat.colCount === 3 && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                                {/* Column 1: Activi */}
                                <div className="bg-emerald-50/40 rounded-xl border border-emerald-200/80 p-4 space-y-3">
                                    <div className="flex items-center justify-between pb-3 border-b border-emerald-200/60">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-emerald-600"></div>
                                            <h4 className="font-black text-xs text-emerald-900 uppercase tracking-wider">{cat.col1Title}</h4>
                                        </div>
                                        <span className="bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full text-xs font-black">{cat.active.length}</span>
                                    </div>
                                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                                        {cat.active.length > 0 ? cat.active.map(u => renderCard(u, 'active')) : (
                                            <div className="py-8 text-center text-slate-400 text-xs font-semibold italic">Niciun client activ în această secțiune.</div>
                                        )}
                                    </div>
                                </div>

                                {/* Column 2: Suspendați */}
                                <div className="bg-amber-50/50 rounded-xl border border-amber-200/80 p-4 space-y-3">
                                    <div className="flex items-center justify-between pb-3 border-b border-amber-200/60">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                            <h4 className="font-black text-xs text-amber-900 uppercase tracking-wider">{cat.col2Title}</h4>
                                        </div>
                                        <span className="bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full text-xs font-black">{cat.suspended.length}</span>
                                    </div>
                                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                                        {cat.suspended.length > 0 ? cat.suspended.map(u => renderCard(u, 'suspended')) : (
                                            <div className="py-8 text-center text-slate-400 text-xs font-semibold italic">Niciun client suspendat în această secțiune.</div>
                                        )}
                                    </div>
                                </div>

                                {/* Column 3: Arhivați */}
                                <div className="bg-slate-100/70 rounded-xl border border-slate-300/80 p-4 space-y-3">
                                    <div className="flex items-center justify-between pb-3 border-b border-slate-300/60">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-slate-600"></div>
                                            <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider">{cat.col3Title}</h4>
                                        </div>
                                        <span className="bg-slate-300 text-slate-900 px-2 py-0.5 rounded-full text-xs font-black">{cat.archived.length}</span>
                                    </div>
                                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                                        {cat.archived.length > 0 ? cat.archived.map(u => renderCard(u, 'archived')) : (
                                            <div className="py-8 text-center text-slate-400 text-xs font-semibold italic">Niciun client arhivat în această secțiune.</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {cat.colCount === 2 && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                {/* Column 1: Activi (fără proces de suspendare) */}
                                <div className="bg-emerald-50/40 rounded-xl border border-emerald-200/80 p-4 space-y-3">
                                    <div className="flex items-center justify-between pb-3 border-b border-emerald-200/60">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-emerald-600"></div>
                                            <h4 className="font-black text-xs text-emerald-900 uppercase tracking-wider">{cat.col1Title}</h4>
                                        </div>
                                        <span className="bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full text-xs font-black">{cat.active.length}</span>
                                    </div>
                                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                                        {cat.active.length > 0 ? cat.active.map(u => renderCard(u, 'active')) : (
                                            <div className="py-8 text-center text-slate-400 text-xs font-semibold italic">Niciun lead activ.</div>
                                        )}
                                    </div>
                                </div>

                                {/* Column 2: Arhivați */}
                                <div className="bg-slate-100/70 rounded-xl border border-slate-300/80 p-4 space-y-3">
                                    <div className="flex items-center justify-between pb-3 border-b border-slate-300/60">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-slate-600"></div>
                                            <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider">{cat.col2Title}</h4>
                                        </div>
                                        <span className="bg-slate-300 text-slate-900 px-2 py-0.5 rounded-full text-xs font-black">{cat.archived.length}</span>
                                    </div>
                                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                                        {cat.archived.length > 0 ? cat.archived.map(u => renderCard(u, 'archived')) : (
                                            <div className="py-8 text-center text-slate-400 text-xs font-semibold italic">Niciun lead arhivat.</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {cat.colCount === 1 && (
                            <div className="bg-slate-100/70 rounded-xl border border-slate-300/80 p-4 space-y-3">
                                <div className="flex items-center justify-between pb-3 border-b border-slate-300/60">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-slate-600"></div>
                                        <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider">{cat.col1Title}</h4>
                                    </div>
                                    <span className="bg-slate-300 text-slate-900 px-2 py-0.5 rounded-full text-xs font-black">{cat.active.length}</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[700px] overflow-y-auto pr-1">
                                    {cat.active.length > 0 ? cat.active.map(u => renderCard(u, 'archived')) : (
                                        <div className="col-span-full py-8 text-center text-slate-400 text-xs font-semibold italic">Niciun client arhivat în baza de date.</div>
                                    )}
                                </div>
                            </div>
                        )}
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

            {/* MODAL 5: CRITERII & PREFERINȚE CLIENT */}
            {selectedUserForCriteria && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
                    <div className="bg-slate-900 text-white border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                                    <SlidersHorizontal className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                                        Preferințe & Criterii Căutare: <span className="text-emerald-400">{selectedUserForCriteria.full_name || selectedUserForCriteria.email}</span>
                                    </h3>
                                    <p className="text-slate-400 text-xs mt-0.5">
                                        Date din formularul completat de client la înregistrare / generare lead CRM.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedUserForCriteria(null)}
                                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* User Contact & Source Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Date de Contact Client</span>
                                <div className="text-sm font-bold text-white">{selectedUserForCriteria.full_name || 'Fără nume'}</div>
                                <div className="text-xs text-slate-300 font-medium">{selectedUserForCriteria.email}</div>
                                {selectedUserForCriteria.phone && (
                                    <div className="text-xs text-orange-400 font-bold flex items-center gap-1.5 mt-1">
                                        <Phone className="w-3.5 h-3.5" /> {selectedUserForCriteria.phone}
                                    </div>
                                )}
                            </div>

                            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Origine Sursă & Data Înregistrării</span>
                                <div className="text-xs font-bold text-slate-200">{selectedUserForCriteria.source || 'Direct Signup'}</div>
                                <div className="text-[11px] text-slate-400">Dată creare: {new Date(selectedUserForCriteria.created_at).toLocaleDateString('ro-RO')}</div>
                            </div>
                        </div>

                        {/* GĂSEȘTE PROPRIETĂȚI DE LA */}
                        <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
                            <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider">Secțiunea „GĂSEȘTE PROPRIETĂȚI DE LA”</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className={`p-3 rounded-lg border flex items-center gap-2.5 text-xs font-extrabold ${selectedUserForCriteria.find_self_from_owner ? 'bg-emerald-950/50 border-emerald-700/60 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                                    {selectedUserForCriteria.find_self_from_owner ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-slate-600" />}
                                    <span>Găsește singur de la proprietar</span>
                                </div>
                                <div className={`p-3 rounded-lg border flex items-center gap-2.5 text-xs font-extrabold ${selectedUserForCriteria.wants_agent_help !== false ? 'bg-indigo-950/50 border-indigo-700/60 text-indigo-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                                    {selectedUserForCriteria.wants_agent_help !== false ? <Check className="w-4 h-4 text-indigo-400" /> : <X className="w-4 h-4 text-slate-600" />}
                                    <span>Vreau ajutor de la un Agent / Broker imobiliar</span>
                                </div>
                            </div>
                        </div>

                        {/* Criterii Principale de Căutare */}
                        <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-4">
                            <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider">Criterii Principale de Căutare & Filtre</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800/80">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Tip Proprietate</span>
                                    <span className="text-xs font-extrabold text-white">{(selectedUserForCriteria as any).lead_details?.preference_type || 'Orice Tip'}</span>
                                </div>
                                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800/80">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Tip Tranzacție</span>
                                    <span className="text-xs font-extrabold text-white">{(selectedUserForCriteria as any).lead_details?.preference_listing_type || 'Orice Tranzacție'}</span>
                                </div>
                                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800/80">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Oraș / Zonă</span>
                                    <span className="text-xs font-extrabold text-white">
                                        {[(selectedUserForCriteria as any).lead_details?.preference_location_city, (selectedUserForCriteria as any).lead_details?.preference_location_area].filter(Boolean).join(' - ') || 'Toate Orașele'}
                                    </span>
                                </div>
                                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800/80">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Buget</span>
                                    <span className="text-xs font-extrabold text-orange-400">
                                        {(selectedUserForCriteria as any).lead_details?.budget_max || (selectedUserForCriteria as any).lead_details?.budget_min ? `${(selectedUserForCriteria as any).lead_details?.budget_min || 0} - ${(selectedUserForCriteria as any).lead_details?.budget_max || '∞'} ${(selectedUserForCriteria as any).lead_details?.currency || 'EUR'}` : 'Nespecificat'}
                                    </span>
                                </div>
                                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800/80">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Camere</span>
                                    <span className="text-xs font-extrabold text-white">
                                        {(selectedUserForCriteria as any).lead_details?.preference_rooms_min ? `Min. ${(selectedUserForCriteria as any).lead_details.preference_rooms_min} camere` : 'Nespecificat'}
                                    </span>
                                </div>
                                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800/80">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Suprafață</span>
                                    <span className="text-xs font-extrabold text-white">
                                        {(selectedUserForCriteria as any).lead_details?.preference_surface_min ? `Min. ${(selectedUserForCriteria as any).lead_details.preference_surface_min} mp` : 'Nespecificat'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Preferințe Suplimentare */}
                        <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
                            <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider">Preferințe Suplimentare & Notițe</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800/80">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Urgență Mutare</span>
                                    <span className="font-extrabold text-slate-200">{(selectedUserForCriteria as any).lead_details?.move_urgency || (selectedUserForCriteria as any).lead_details?.move_in_date || 'Nespecificat'}</span>
                                </div>
                                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800/80">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Metodă de Plată</span>
                                    <span className="font-extrabold text-slate-200">{(selectedUserForCriteria as any).lead_details?.payment_method || 'Nespecificat'}</span>
                                </div>
                                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800/80">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Copii Mici / Animale</span>
                                    <span className="font-extrabold text-slate-200">
                                        Copii: {(selectedUserForCriteria as any).lead_details?.has_small_kids ? 'Da' : 'Nu'} | Animale: {(selectedUserForCriteria as any).lead_details?.has_pets ? 'Da' : 'Nu'}
                                    </span>
                                </div>
                                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800/80">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Motiv Cumpărare / Ocupație</span>
                                    <span className="font-extrabold text-slate-200">
                                        {[(selectedUserForCriteria as any).lead_details?.buying_reason, (selectedUserForCriteria as any).lead_details?.occupation].filter(Boolean).join(' / ') || 'Nespecificat'}
                                    </span>
                                </div>
                            </div>
                            {((selectedUserForCriteria as any).lead_details?.notes || (selectedUserForCriteria as any).lead_details?.liked_listings_links) && (
                                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800/80 text-xs">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Notițe / Link-uri Anunțuri</span>
                                    <p className="text-slate-300 italic whitespace-pre-wrap">{(selectedUserForCriteria as any).lead_details?.notes || (selectedUserForCriteria as any).lead_details?.liked_listings_links}</p>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end border-t border-slate-800 pt-4">
                            <button
                                onClick={() => setSelectedUserForCriteria(null)}
                                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-extrabold transition-colors cursor-pointer"
                            >
                                Închide Previzualizarea
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: ADMIN CREDIT GRANT MODAL */}
            {selectedUserForCredits && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
                    <div className="bg-slate-900 text-white border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-yellow-500/20 text-yellow-400 rounded-xl border border-yellow-500/30">
                                    <Coins className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-base text-white">Alocare Credite Utilizator</h3>
                                    <p className="text-xs text-slate-400">{selectedUserForCredits.full_name || selectedUserForCredits.email}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedUserForCredits(null)}
                                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                            <span className="text-xs text-slate-400 font-semibold">Sold Actual Utilizator:</span>
                            <span className="text-lg font-black text-yellow-400 font-mono flex items-center gap-1">
                                <Coins className="w-4 h-4" /> {selectedUserForCredits.credits || 0} CR
                            </span>
                        </div>

                        {grantStatusMsg && (
                            <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${grantStatusMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}>
                                {grantStatusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" /> : <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />}
                                <span>{grantStatusMsg.text}</span>
                            </div>
                        )}

                        <form onSubmit={handleGrantCreditsSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                                    Cantitate Credite de Alocat (+ sau -)
                                </label>
                                <input
                                    type="number"
                                    value={grantAmount}
                                    onChange={(e) => setGrantAmount(Number(e.target.value))}
                                    placeholder="ex: 15 sau 50"
                                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold text-yellow-400 focus:outline-none focus:border-yellow-500"
                                />
                            </div>

                            {/* Preset Buttons */}
                            <div>
                                <label className="text-[11px] font-semibold text-slate-400 block mb-1.5">Alegere Rapidă:</label>
                                <div className="grid grid-cols-5 gap-1.5">
                                    {[10, 15, 25, 50, 100].map(amt => (
                                        <button
                                            key={amt}
                                            type="button"
                                            onClick={() => setGrantAmount(amt)}
                                            className={`py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${grantAmount === amt ? 'bg-yellow-500 text-slate-950 border-yellow-400 shadow-sm' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'}`}
                                        >
                                            +{amt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                                    Motiv / Notă Tranzacție (Opțional)
                                </label>
                                <input
                                    type="text"
                                    value={grantReason}
                                    onChange={(e) => setGrantReason(e.target.value)}
                                    placeholder="ex: Recompensă promovare, Suport client"
                                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                                />
                            </div>

                            <div className="pt-2 flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setSelectedUserForCredits(null)}
                                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                                >
                                    Anulează
                                </button>
                                <button
                                    type="submit"
                                    disabled={isGrantingCredits}
                                    className="flex-1 py-2.5 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-950 rounded-xl text-xs font-extrabold transition-all shadow-lg shadow-yellow-500/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    {isGrantingCredits ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 animate-spin" /> Se alocă...
                                        </>
                                    ) : (
                                        <>
                                            <Coins className="w-4 h-4" /> Confirmă Alocarea
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
