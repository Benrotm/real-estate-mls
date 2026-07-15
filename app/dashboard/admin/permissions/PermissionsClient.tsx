'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Shield, 
    Users, 
    Key, 
    Check, 
    X, 
    Search, 
    Filter, 
    ChevronRight, 
    Info, 
    CheckCircle2, 
    RefreshCw, 
    Database, 
    Lock,
    UserCheck,
    Settings,
    Layers
} from 'lucide-react';
import { updatePlanFeature, updateUserRoleAndPlan, syncPlanFeatures, saveUserPropertyRestrictions } from '@/app/lib/admin';

// Feature key descriptions and user-friendly labels
const FEATURE_INFO: Record<string, { label: string; desc: string }> = {
    view_owner_contact: { label: 'Vizualizare Date Proprietar', desc: 'Permite vizualizarea datelor de contact (telefon, email) ale proprietarilor imobilelor.' },
    leads_access: { label: 'Acces Leads & CRM', desc: 'Permite accesarea modulului de Leads, istoric activități și gestionarea clienților.' },
    direct_message: { label: 'Mesagerie Directă', desc: 'Permite trimiterea de mesaje directe în timp real între utilizatori.' },
    calendar_events: { label: 'Calendar Activități', desc: 'Permite programarea vizionărilor și setarea de evenimente în calendar.' },
    valuation_reports: { label: 'Rapoarte de Evaluare', desc: 'Permite generarea rapoartelor de evaluare comparativă a proprietăților.' },
    market_insights: { label: 'Statistici & Analiză Piață', desc: 'Permite accesul la analize de piață și prețuri medii din MLS.' },
    make_an_offer: { label: 'Trimitere Ofertă Directă', desc: 'Permite trimiterea de oferte de cumpărare/închiriere direct către proprietari.' },
    virtual_tour: { label: 'Vizualizare Tururi Virtuale', desc: 'Permite explorarea tururilor virtuale 3D atașate imobilelor.' },
    property_insights: { label: 'Statistici Proprietăți', desc: 'Permite accesul la istoricul de preț și evoluția anunțului în piață.' },
    property_price_calculator: { label: 'Calculator Comisioane & Rate', desc: 'Permite utilizarea calculatorului de finanțare și comisioane.' },
    target_marketing: { label: 'Promovare Listings (Featured)', desc: 'Permite promovarea proprietăților pe primele poziții în platformă.' },
    agency_team: { label: 'Grup Agency & Team Leader', desc: 'Permite administrarea membrilor echipei, sharing lead-uri și supervizare contracte.' },
    ai_studio: { label: 'AI Copywriter Studio', desc: 'Permite utilizarea AI-ului pentru generare descrieri sau matching inteligent.' }
};

const getFeatureInfo = (key: string, fallbackLabel?: string) => {
    return FEATURE_INFO[key] || { label: fallbackLabel || key, desc: 'Capabilitate definită în baza de date.' };
};

const ROLE_ORDER = ['client', 'owner', 'agent', 'developer'];

const getRoleColor = (role: string) => {
    switch (role) {
        case 'super_admin': return 'bg-red-500/10 text-red-400 border-red-500/20';
        case 'admin': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
        case 'agent': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
        case 'developer': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
        case 'owner': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
};

interface PermissionsClientProps {
    plans: any[];
    features: any[];
    users: any[];
    currentUser: any;
    cities: string[];
    initialRestrictions: any[];
}

export default function PermissionsClient({ plans, features, users, currentUser, cities, initialRestrictions }: PermissionsClientProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'matrix' | 'users' | 'restrictions'>('matrix');
    
    // Matrix States
    const [localFeatures, setLocalFeatures] = useState(features);
    const [updatingFeatureIds, setUpdatingFeatureIds] = useState<string[]>([]);
    const [syncing, setSyncing] = useState(false);

    // User Manager States
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [updatingUsers, setUpdatingUsers] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [usersPerPage, setUsersPerPage] = useState(10);

    const PROPERTY_TYPES = ['Apartment', 'House', 'Commercial', 'Industrial', 'Land', 'Business', 'Other'] as const;
    const TRANSACTION_TYPES = ['For Sale', 'For Rent', 'Hotel Regime'] as const;

    // Restrictions Matrix state
    const [restrictionsList, setRestrictionsList] = useState<any[]>(initialRestrictions);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [allowedTypes, setAllowedTypes] = useState<string[]>([]);
    const [allowedTransactions, setAllowedTransactions] = useState<string[]>([]);
    const [allowedCities, setAllowedCities] = useState<string[]>([]);
    const [isSavingRestrictions, setIsSavingRestrictions] = useState(false);
    const [restrictionsSearch, setRestrictionsSearch] = useState('');
    const [restrictionsSaveStatus, setRestrictionsSaveStatus] = useState<{ text: string; type: 'success' | 'error' | '' }>({ text: '', type: '' });

    // Filter users list to exclude admins
    const nonAdminUsers = useMemo(() => {
        return users.filter(u => u.role !== 'admin' && u.role !== 'super_admin');
    }, [users]);

    const filteredNonAdminUsers = useMemo(() => {
        return nonAdminUsers.filter(u => 
            u.full_name?.toLowerCase().includes(restrictionsSearch.toLowerCase()) ||
            u.email?.toLowerCase().includes(restrictionsSearch.toLowerCase())
        );
    }, [nonAdminUsers, restrictionsSearch]);

    // Handle selecting a user
    const handleSelectUser = (userId: string) => {
        setSelectedUserId(userId);
        setRestrictionsSaveStatus({ text: '', type: '' });
        
        const userRest = restrictionsList.find(r => r.user_id === userId);
        if (userRest) {
            setAllowedTypes(userRest.allowed_types || []);
            setAllowedTransactions(userRest.allowed_transactions || []);
            setAllowedCities(userRest.allowed_cities || []);
        } else {
            setAllowedTypes([]);
            setAllowedTransactions([]);
            setAllowedCities([]);
        }
    };

    // Handle toggling allowed item
    const toggleAllowedItem = (item: string, type: 'property' | 'transaction' | 'city') => {
        if (type === 'property') {
            setAllowedTypes(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
        } else if (type === 'transaction') {
            setAllowedTransactions(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
        } else {
            setAllowedCities(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
        }
    };

    // Save restrictions
    const handleSaveRestrictions = async () => {
        if (!selectedUserId) return;
        setIsSavingRestrictions(true);
        setRestrictionsSaveStatus({ text: '', type: '' });

        try {
            await saveUserPropertyRestrictions(selectedUserId, allowedTypes, allowedTransactions, allowedCities);
            
            // Update local state list
            const updated = [...restrictionsList];
            const idx = updated.findIndex(r => r.user_id === selectedUserId);
            const entry = {
                user_id: selectedUserId,
                allowed_types: allowedTypes,
                allowed_transactions: allowedTransactions,
                allowed_cities: allowedCities,
                updated_at: new Date().toISOString()
            };

            if (idx >= 0) {
                updated[idx] = entry;
            } else {
                updated.push(entry);
            }
            setRestrictionsList(updated);
            setRestrictionsSaveStatus({ text: 'Opțiunile de filtrare au fost salvate cu succes!', type: 'success' });
            setTimeout(() => setRestrictionsSaveStatus({ text: '', type: '' }), 4000);
        } catch (err: any) {
            setRestrictionsSaveStatus({ text: 'Eroare la salvare: ' + err.message, type: 'error' });
        } finally {
            setIsSavingRestrictions(false);
        }
    };

    // Build plan columns dynamically based on DB data
    const planColumns = useMemo(() => {
        const cols = plans.map(p => ({
            role: p.role,
            planName: p.name,
            label: `${p.role.toUpperCase()} - ${p.name}`,
            price: p.price || 0,
            isSystem: false
        })).sort((a, b) => {
            const roleDiff = ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role);
            if (roleDiff !== 0) return roleDiff;
            return a.price - b.price;
        });

        // Append system roles that bypass standard plan checks
        return [
            ...cols,
            { role: 'admin', planName: 'All Access', label: 'ADMIN (System)', price: 0, isSystem: true },
            { role: 'super_admin', planName: 'Root Access', label: 'SUPER ADMIN', price: 0, isSystem: true }
        ];
    }, [plans]);

    // Extract unique feature keys from DB features list
    const uniqueFeatureKeys = useMemo(() => {
        return Array.from(new Set(localFeatures.map(f => f.feature_key)));
    }, [localFeatures]);

    // Toggle a feature in the DB
    const handleFeatureToggle = async (featureId: string, currentVal: boolean) => {
        setUpdatingFeatureIds(prev => [...prev, featureId]);
        
        // Optimistic UI update
        setLocalFeatures(prev => prev.map(f => f.id === featureId ? { ...f, is_included: !currentVal } : f));
        
        try {
            await updatePlanFeature(featureId, !currentVal);
        } catch (err: any) {
            // Rollback on error
            setLocalFeatures(prev => prev.map(f => f.id === featureId ? { ...f, is_included: currentVal } : f));
            alert('Failed to update capability: ' + err.message);
        } finally {
            setUpdatingFeatureIds(prev => prev.filter(id => id !== featureId));
        }
    };

    // Database Sync Action
    const handleSyncFeatures = async () => {
        setSyncing(true);
        try {
            await syncPlanFeatures();
            alert('Baza de date a permisiunilor a fost sincronizată cu succes!');
            router.refresh();
            window.location.reload();
        } catch (err: any) {
            alert('Eroare la sincronizare: ' + err.message);
        } finally {
            setSyncing(false);
        }
    };

    // User management plans dropdown resolver
    const getPlansForRole = (role: string) => {
        if (role === 'admin' || role === 'super_admin') return ['Free'];
        const rolePlans = plans.filter(p => p.role === role).map(p => p.name);
        return rolePlans.length > 0 ? rolePlans : ['Free'];
    };

    // Handle user role and plan re-assignment
    const handleUserRolePlanChange = async (userId: string, newRole: string, currentPlan: string) => {
        setUpdatingUsers(prev => [...prev, userId]);
        
        // Check if current plan is valid for the new role, otherwise fall back to first available plan
        const validPlans = getPlansForRole(newRole);
        const resolvedPlan = validPlans.includes(currentPlan) ? currentPlan : validPlans[0];

        try {
            await updateUserRoleAndPlan(userId, newRole, resolvedPlan);
            router.refresh();
        } catch (err: any) {
            alert('Failed to update user access: ' + err.message);
        } finally {
            setUpdatingUsers(prev => prev.filter(id => id !== userId));
        }
    };

    const handleUserPlanChange = async (userId: string, currentRole: string, newPlan: string) => {
        setUpdatingUsers(prev => [...prev, userId]);
        try {
            await updateUserRoleAndPlan(userId, currentRole, newPlan);
            router.refresh();
        } catch (err: any) {
            alert('Failed to update user plan: ' + err.message);
        } finally {
            setUpdatingUsers(prev => prev.filter(id => id !== userId));
        }
    };

    // Filtering users
    const filteredUsers = useMemo(() => {
        return users.filter(u => {
            const matchesSearch = 
                u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.id?.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesRole = roleFilter === 'all' || u.role === roleFilter;

            return matchesSearch && matchesRole;
        });
    }, [users, searchQuery, roleFilter]);

    // Paginated users
    const paginatedUsers = useMemo(() => {
        const startIndex = (currentPage - 1) * usersPerPage;
        return filteredUsers.slice(startIndex, startIndex + usersPerPage);
    }, [filteredUsers, currentPage, usersPerPage]);

    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8">
            <div className="max-w-7xl mx-auto">
                
                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-slate-800 pb-6 gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
                                <Users className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-extrabold tracking-tight">User Permission Matrix</h1>
                                <p className="text-slate-400 text-sm mt-1">Configurare securitate Super Admin. Gestionare permisiuni și asociere roluri.</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleSyncFeatures}
                            disabled={syncing}
                            className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white px-4 py-2.5 rounded-xl transition-all font-medium text-sm disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                            {syncing ? 'Sincronizare...' : 'Sync Database Matrix'}
                        </button>
                    </div>
                </header>

                {/* Info Box */}
                <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-4 mb-8 flex gap-3 text-sm text-indigo-300">
                    <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                        <span className="font-bold text-white">Cum funcționează sistemul de roluri:</span> Utilizatorii primesc capabilități automat pe baza combinării dintre <strong className="text-white">Rol</strong> și <strong className="text-white">Plan</strong>. Rolurile administrative (<strong className="text-red-400">Super Admin</strong> și <strong className="text-orange-400">Admin</strong>) ocolesc automat matricea de caracteristici și primesc acces complet la toate modulele, cu excepția funcțiilor exclusive Super Admin (ex: Impersonare sau accesul la această pagină de securitate).
                    </div>
                </div>

                {/* Tabs Switcher */}
                <div className="flex border-b border-slate-800 mb-8">
                    <button
                        onClick={() => setActiveTab('matrix')}
                        className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-sm transition-all ${
                            activeTab === 'matrix' 
                            ? 'border-indigo-500 text-indigo-400' 
                            : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <Layers className="w-4 h-4" />
                        Matricea de Capabilități
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-sm transition-all ${
                            activeTab === 'users' 
                            ? 'border-indigo-500 text-indigo-400' 
                            : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <Users className="w-4 h-4" />
                        Management Roluri Utilizatori
                    </button>
                    <button
                        onClick={() => setActiveTab('restrictions')}
                        className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-sm transition-all ${
                            activeTab === 'restrictions' 
                            ? 'border-indigo-500 text-indigo-400' 
                            : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <Shield className="w-4 h-4" />
                        Matrice Filtrare Acces Proprietăți
                    </button>
                </div>

                {/* Tab content */}
                {activeTab === 'matrix' ? (
                    <div className="space-y-12">
                        
                        {/* Dynamic Grid Matrix Card */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                            <div className="p-6 border-b border-slate-800">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Database className="text-indigo-400 w-5 h-5" />
                                    Plan Capabilități MLS Matrix
                                </h3>
                                <p className="text-slate-400 text-xs mt-1">Activați sau dezactivați capabilitățile sistemului pentru fiecare rol și plan în parte.</p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[900px]">
                                    <thead>
                                        <tr className="bg-slate-950 border-b border-slate-800 text-slate-300">
                                            <th className="p-4 text-xs uppercase tracking-wider font-bold w-1/4">Capabilitate Sistem</th>
                                            {planColumns.map((col, idx) => (
                                                <th key={idx} className="p-4 text-[10px] uppercase tracking-tighter text-center font-bold border-l border-slate-800/50">
                                                    <div>{col.role.toUpperCase()}</div>
                                                    <div className={`mt-0.5 text-[9px] font-semibold opacity-60 ${col.isSystem ? 'text-indigo-400' : 'text-slate-400'}`}>
                                                        {col.planName}
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60">
                                        {uniqueFeatureKeys.map((key) => {
                                            const firstMatch = localFeatures.find(f => f.feature_key === key);
                                            const info = getFeatureInfo(key, firstMatch?.feature_label);

                                            return (
                                                <tr key={key} className="hover:bg-slate-800/10 transition-colors">
                                                    <td className="p-4">
                                                        <div className="font-bold text-sm text-white">{info.label}</div>
                                                        <div className="text-slate-500 text-xs mt-0.5 leading-relaxed">{info.desc}</div>
                                                        <div className="text-[10px] text-indigo-500/70 font-mono mt-1 select-all">{key}</div>
                                                    </td>

                                                    {planColumns.map((col, idx) => {
                                                        if (col.isSystem) {
                                                            return (
                                                                <td key={idx} className="p-4 text-center border-l border-slate-800/30">
                                                                    <div className="flex items-center justify-center">
                                                                        <span className="inline-flex items-center gap-1 bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full text-[9px] font-bold">
                                                                            <Check className="w-2.5 h-2.5" />
                                                                            BYPASS
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                            );
                                                        }

                                                        const match = localFeatures.find(f => 
                                                            f.role === col.role && 
                                                            f.plan_name === col.planName && 
                                                            f.feature_key === key
                                                        );

                                                        if (!match) {
                                                            return (
                                                                <td key={idx} className="p-4 text-center text-slate-600 text-xs border-l border-slate-800/30 font-medium">
                                                                    -
                                                                </td>
                                                            );
                                                        }

                                                        const isUpdating = updatingFeatureIds.includes(match.id);

                                                        return (
                                                            <td key={idx} className="p-4 text-center border-l border-slate-800/30">
                                                                <div className="flex items-center justify-center">
                                                                    <button
                                                                        onClick={() => handleFeatureToggle(match.id, match.is_included)}
                                                                        disabled={isUpdating}
                                                                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                                            match.is_included ? 'bg-indigo-600' : 'bg-slate-800'
                                                                        } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                    >
                                                                        <span
                                                                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                                                match.is_included ? 'translate-x-4' : 'translate-x-0'
                                                                            }`}
                                                                        />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Baseline Policies definition */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                                <h4 className="font-bold flex items-center gap-2 text-indigo-400 mb-2">
                                    <Shield className="w-5 h-5" />
                                    Super Admin Policy
                                </h4>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Acces total la baza de date și setări globale. Capabil de impersonare a oricărui cont pentru testare. Acest rol este rezervat exclusiv fondatorilor/dezvoltatorilor platformei.
                                </p>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                                <h4 className="font-bold flex items-center gap-2 text-orange-400 mb-2">
                                    <UserCheck className="w-5 h-5" />
                                    Admin (System) Policy
                                </h4>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Acces la consolele de analiză, managementul utilizatorilor, verificarea tranzacțiilor și soluționarea tichetelor de asistență. Nu pot impersona alți utilizatori sau edita planurile de bază.
                                </p>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                                <h4 className="font-bold flex items-center gap-2 text-blue-400 mb-2">
                                    <Key className="w-5 h-5" />
                                    Agent & Developer Policies
                                </h4>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Determinați de planul de subscripție. Brokerii și Dezvoltatorii au limite setate dinamic pentru adăugarea imobilelor și generarea de rapoarte inteligente.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    
                    /* Users List & Role Changer panel */
                    <div className="space-y-6">
                        
                        {/* Filters and Search */}
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center">
                            <div className="relative flex-1 group w-full">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors">
                                    <Search size={18} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Caută utilizatori după nume, email sau ID..."
                                    value={searchQuery}
                                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-10 py-2.5 text-white focus:border-indigo-500 outline-none transition-all text-sm"
                                />
                            </div>

                            <div className="flex gap-4 w-full md:w-auto">
                                <div className="relative flex-1 md:w-48">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                                        <Filter size={16} />
                                    </div>
                                    <select
                                        value={roleFilter}
                                        onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-white focus:border-indigo-500 outline-none appearance-none transition-all cursor-pointer text-sm"
                                    >
                                        <option value="all">Toate Rolurile</option>
                                        <option value="client">Client</option>
                                        <option value="owner">Owner</option>
                                        <option value="agent">Agent</option>
                                        <option value="developer">Developer</option>
                                        <option value="admin">Admin</option>
                                        <option value="super_admin">Super Admin</option>
                                    </select>
                                </div>

                                <div className="relative flex-1 md:w-36">
                                    <select
                                        value={usersPerPage}
                                        onChange={(e) => { setUsersPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-white focus:border-indigo-500 outline-none transition-all cursor-pointer text-sm"
                                    >
                                        <option value={10}>10 / pagină</option>
                                        <option value={50}>50 / pagină</option>
                                        <option value={100}>100 / pagină</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Users Table */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-950 border-b border-slate-800 text-xs uppercase text-slate-400 tracking-wider">
                                            <th className="p-4 font-bold">Utilizator</th>
                                            <th className="p-4 font-bold">Email / Contact</th>
                                            <th className="p-4 font-bold">Rol Atribuit</th>
                                            <th className="p-4 font-bold">Plan Tiers</th>
                                            <th className="p-4 font-bold text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {paginatedUsers.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="p-12 text-center text-slate-500">
                                                    <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                                    <p className="text-lg font-medium">Nu s-au găsit utilizatori.</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedUsers.map((user) => {
                                                const isUpdating = updatingUsers.includes(user.id);
                                                const availablePlans = getPlansForRole(user.role);

                                                return (
                                                    <tr key={user.id} className="hover:bg-slate-800/20 transition-colors group">
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-full bg-slate-850 flex items-center justify-center text-slate-400 font-bold border border-slate-700 overflow-hidden">
                                                                    {user.avatar_url ? (
                                                                        <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        user.full_name ? user.full_name[0].toUpperCase() : 'U'
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <div className="font-bold text-white group-hover:text-indigo-400 transition-colors">
                                                                        {user.full_name || 'Nume Necunoscut'}
                                                                    </div>
                                                                    <div className="text-[10px] text-slate-500 font-mono">
                                                                        ID: {user.id}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        <td className="p-4 text-sm text-slate-300">
                                                            <div>{user.email || 'Fără Email'}</div>
                                                            <div className="text-slate-500 text-xs mt-0.5">{user.phone || 'Fără Telefon'}</div>
                                                        </td>

                                                        <td className="p-4">
                                                            <div className="flex items-center gap-2">
                                                                <select
                                                                    value={user.role}
                                                                    disabled={isUpdating || user.id === currentUser.id}
                                                                    onChange={(e) => handleUserRolePlanChange(user.id, e.target.value, user.plan_tier || 'Free')}
                                                                    className={`bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:border-indigo-500 outline-none cursor-pointer ${getRoleColor(user.role)}`}
                                                                >
                                                                    <option value="client">Client</option>
                                                                    <option value="owner">Owner</option>
                                                                    <option value="agent">Agent</option>
                                                                    <option value="developer">Developer</option>
                                                                    <option value="admin">Admin</option>
                                                                    <option value="super_admin">Super Admin</option>
                                                                </select>
                                                                {user.id === currentUser.id && (
                                                                    <span className="text-[9px] text-slate-500 font-semibold uppercase flex items-center gap-0.5"><Lock className="w-2.5 h-2.5" /> Self</span>
                                                                )}
                                                            </div>
                                                        </td>

                                                        <td className="p-4">
                                                            {user.role === 'admin' || user.role === 'super_admin' ? (
                                                                <span className="text-slate-500 text-xs font-semibold px-3">N/A (Sistem)</span>
                                                            ) : (
                                                                <select
                                                                    value={user.plan_tier || 'Free'}
                                                                    disabled={isUpdating}
                                                                    onChange={(e) => handleUserPlanChange(user.id, user.role, e.target.value)}
                                                                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:border-indigo-500 outline-none cursor-pointer"
                                                                >
                                                                    {availablePlans.map((planName) => (
                                                                        <option key={planName} value={planName}>{planName}</option>
                                                                    ))}
                                                                </select>
                                                            )}
                                                        </td>

                                                        <td className="p-4 text-center">
                                                            {isUpdating ? (
                                                                <span className="inline-flex items-center gap-1.5 text-xs text-indigo-400">
                                                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                                    Se salvează...
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 text-green-400 text-xs font-semibold">
                                                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                                    Salvat
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Controls */}
                            {filteredUsers.length > 0 && (
                                <div className="p-4 border-t border-slate-850 flex justify-between items-center bg-slate-950 text-sm">
                                    <div className="text-slate-400 text-xs">
                                        Se afișează utilizatorii <span className="text-white font-bold">{filteredUsers.length === 0 ? 0 : (currentPage - 1) * usersPerPage + 1}</span> - <span className="text-white font-bold">{Math.min(currentPage * usersPerPage, filteredUsers.length)}</span> din <span className="text-white font-bold">{filteredUsers.length}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                            className="px-3 py-1 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-lg text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            Înapoi
                                        </button>
                                        <span className="px-3 py-1 flex items-center text-xs font-semibold text-slate-400">
                                            Pagina {currentPage} din {Math.max(1, totalPages)}
                                        </span>
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                            disabled={currentPage === totalPages || totalPages <= 1}
                                            className="px-3 py-1 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-lg text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            Înainte
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'restrictions' && (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8">
                        <div className="flex flex-col lg:flex-row gap-8">
                            {/* Left Side: Searchable User List */}
                            <div className="w-full lg:w-1/3 border-r border-slate-800 pr-0 lg:pr-8 flex flex-col space-y-4">
                                <h3 className="text-md font-bold text-white mb-2">Utilizatori</h3>
                                <div className="relative group w-full">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                                        <Search size={16} />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Caută utilizator..."
                                        value={restrictionsSearch}
                                        onChange={(e) => setRestrictionsSearch(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-indigo-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="overflow-y-auto max-h-[500px] border border-slate-850 rounded-xl divide-y divide-slate-855 bg-slate-950/40">
                                    {filteredNonAdminUsers.length === 0 ? (
                                        <div className="p-8 text-center text-slate-500 text-xs">
                                            Niciun utilizator găsit.
                                        </div>
                                    ) : (
                                        filteredNonAdminUsers.map((u) => {
                                            const isSelected = selectedUserId === u.id;
                                            const hasActiveFilter = restrictionsList.some(r => r.user_id === u.id && 
                                                ((r.allowed_types && r.allowed_types.length > 0) || 
                                                 (r.allowed_transactions && r.allowed_transactions.length > 0) || 
                                                 (r.allowed_cities && r.allowed_cities.length > 0))
                                            );
                                            return (
                                                <button
                                                    key={u.id}
                                                    type="button"
                                                    onClick={() => handleSelectUser(u.id)}
                                                    className={`w-full text-left p-3 text-sm flex items-center justify-between transition-colors ${
                                                        isSelected ? 'bg-indigo-600/10 text-indigo-400 font-bold' : 'hover:bg-slate-800/40 text-slate-300'
                                                    }`}
                                                >
                                                    <div className="truncate pr-2">
                                                        <div className="truncate font-semibold text-white">{u.full_name || 'Nume Necunoscut'}</div>
                                                        <div className="text-[10px] text-slate-500 truncate mt-0.5">{u.email}</div>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        <span className="text-[9px] uppercase font-bold tracking-tighter px-1.5 py-0.5 rounded bg-slate-850 text-slate-400">
                                                            {u.role}
                                                        </span>
                                                        {hasActiveFilter && (
                                                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" title="Are filtre active" />
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Right Side: Matrix Checklist Panel */}
                            <div className="w-full lg:w-2/3 flex flex-col space-y-6">
                                {selectedUserId ? (
                                    (() => {
                                        const selUser = users.find(u => u.id === selectedUserId);
                                        return (
                                            <>
                                                <div className="border-b border-slate-800 pb-4">
                                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                                        <UserCheck className="w-5 h-5 text-indigo-400" />
                                                        Filtre Acces Proprietăți: <span className="text-indigo-400">{selUser?.full_name || 'Nume Necunoscut'}</span>
                                                    </h3>
                                                    <p className="text-slate-400 text-xs mt-1">
                                                        Selectează categoriile de proprietăți pe care le poate accesa acest utilizator. Lăsând o secțiune goală (nicio opțiune selectată), utilizatorul are acces implicit la toate opțiunile din acea categorie.
                                                    </p>
                                                </div>

                                                {restrictionsSaveStatus.text && (
                                                    <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
                                                        restrictionsSaveStatus.type === 'success' 
                                                        ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                                                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                                                    }`}>
                                                        <Info className="w-4 h-4 shrink-0" />
                                                        {restrictionsSaveStatus.text}
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    {/* Property Types */}
                                                    <div className="space-y-3">
                                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-1.5">Tipuri Proprietate</h4>
                                                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                                            {PROPERTY_TYPES.map(type => (
                                                                <label key={type} className="flex items-center gap-2.5 text-xs text-slate-300 hover:text-white cursor-pointer select-none">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={allowedTypes.includes(type)}
                                                                        onChange={() => toggleAllowedItem(type, 'property')}
                                                                        className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 w-4 h-4"
                                                                    />
                                                                    <span>{type}</span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Transaction Types */}
                                                    <div className="space-y-3">
                                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-1.5">Tipuri Tranzacție</h4>
                                                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                                            {TRANSACTION_TYPES.map(tx => (
                                                                <label key={tx} className="flex items-center gap-2.5 text-xs text-slate-300 hover:text-white cursor-pointer select-none">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={allowedTransactions.includes(tx)}
                                                                        onChange={() => toggleAllowedItem(tx, 'transaction')}
                                                                        className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 w-4 h-4"
                                                                    />
                                                                    <span>{tx}</span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Cities */}
                                                    <div className="space-y-3">
                                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-1.5">Orașe Permise</h4>
                                                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                                            {cities.length === 0 ? (
                                                                <div className="text-slate-500 text-xs italic">Niciun oraș în baza de date.</div>
                                                            ) : (
                                                                cities.map(city => (
                                                                    <label key={city} className="flex items-center gap-2.5 text-xs text-slate-300 hover:text-white cursor-pointer select-none">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={allowedCities.includes(city)}
                                                                            onChange={() => toggleAllowedItem(city, 'city')}
                                                                            className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 w-4 h-4"
                                                                        />
                                                                        <span>{city}</span>
                                                                    </label>
                                                                ))
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="border-t border-slate-800 pt-6 flex justify-end">
                                                    <button
                                                        type="button"
                                                        onClick={handleSaveRestrictions}
                                                        disabled={isSavingRestrictions}
                                                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg transition-colors cursor-pointer"
                                                    >
                                                        {isSavingRestrictions ? (
                                                            <RefreshCw className="w-4 h-4 animate-spin text-white" />
                                                        ) : (
                                                            <Check className="w-4 h-4 text-white" />
                                                        )}
                                                        Salvează Restricții
                                                    </button>
                                                </div>
                                            </>
                                        );
                                    })()
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800 min-h-[350px]">
                                        <Users className="w-12 h-12 text-slate-700 mb-4 opacity-40" />
                                        <h4 className="text-white font-bold text-sm mb-1">Niciun utilizator selectat</h4>
                                        <p className="text-xs text-slate-500 max-w-xs">
                                            Alege un utilizator din lista din stânga pentru a-i configura restricțiile specifice de vizualizare a proprietăților.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
