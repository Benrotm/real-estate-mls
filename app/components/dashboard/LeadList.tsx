'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Mail, Phone, Edit, Search, CheckCircle, Clock, Trash2, X, AlertCircle, ChevronDown, ChevronUp, Filter, ArrowUpAZ, ArrowDownZA, DollarSign, Zap, User, Wallet, MapPin, Activity, ChevronRight, Heart, Ban, Home, List, Building2, TrendingUp, ArrowUpRight, MessageSquare, Info } from 'lucide-react';
import { LeadData } from '@/app/lib/types';
import { deleteLead } from '@/app/lib/actions/leads';
import { findMatchingProperties } from '@/app/lib/actions/scoring';
import { startConversationWithUser, sendMessage } from '@/app/lib/actions/chat';
import { useRouter } from 'next/navigation';
import {
    PROPERTY_TYPES,
    TRANSACTION_TYPES,
    Property
} from '@/app/lib/properties';

const STATUS_COLORS = {
    new: 'bg-blue-100 text-blue-700 border-blue-200',
    contacted: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    viewing: 'bg-purple-100 text-purple-700 border-purple-200',
    negotiation: 'bg-orange-100 text-orange-700 border-orange-200',
    closed: 'bg-green-100 text-green-700 border-green-200',
    lost: 'bg-slate-100 text-slate-500 border-slate-200',
} as const;

const STATUS_LABELS = {
    new: 'New Lead',
    contacted: 'Contacted',
    viewing: 'Viewing Scheduled',
    negotiation: 'Negotiation',
    closed: 'Closed / Won',
    lost: 'Lost',
};

interface LeadListProps {
    leads: LeadData[];
    basePath: string; // e.g. '/dashboard/agent/leads' or '/dashboard/owner/leads'
    allowEdit?: boolean;
    currentUserId?: string;
}

export default function LeadList({ leads, basePath, allowEdit = true, currentUserId }: LeadListProps) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeStatus, setActiveStatus] = useState<string>('all');
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
    const [sortBy, setSortBy] = useState<'score' | 'budget' | 'urgency' | 'newest'>('newest');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
    const [ownershipFilter, setOwnershipFilter] = useState<'all' | 'my' | 'partner'>('all');

    // Matching State
    const [matches, setMatches] = useState<any[]>([]);
    const [isMatchingLoading, setIsMatchingLoading] = useState(false);
    const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);
    const [matchError, setMatchError] = useState<string | null>(null);
    const [hasScanned, setHasScanned] = useState(false);

    const handleLoadMatches = async (leadId: string) => {
        setIsMatchingLoading(true);
        setMatchError(null);
        setHasScanned(true);
        setSelectedPropertyIds([]);
        try {
            const results = await findMatchingProperties(leadId);
            setMatches(results);
        } catch (err) {
            setMatchError('Failed to load matching properties.');
            console.error(err);
        } finally {
            setIsMatchingLoading(false);
        }
    };

    const togglePropertySelection = (id: string) => {
        setSelectedPropertyIds(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const handleContactPartner = async (property: any, leadId: string) => {
        if (!property.owner?.id) {
            alert('Partner contact info not available.');
            return;
        }

        try {
            const { conversationId, error } = await startConversationWithUser(property.owner.id);
            if (error) throw new Error(error);

            if (conversationId) {
                const message = `Hi! I noticed a match between my lead (${leadId}) and your property (${property.id}). Let's collaborate!`;
                await sendMessage(conversationId, currentUserId!, message);
                router.push(`/dashboard/agent/chat?id=${conversationId}`);
            }
        } catch (err) {
            console.error('Error starting partner chat:', err);
            alert('Failed to start chat with partner.');
        }
    };

    const handleShareWhatsApp = (lead: LeadData) => {
        if (selectedPropertyIds.length === 0) return;
        const selectedMatches = matches.filter(m => selectedPropertyIds.includes(m.id));
        const message = `Hello ${lead.name},\n\nI found some properties that match your requirements:\n\n` +
            selectedMatches.map(m => `* ${m.title}\n  Price: ${m.price.toLocaleString()} ${m.currency}\n  Link: ${window.location.origin}/properties/${m.id}`).join('\n\n') +
            `\n\nLet me know if you are interested!`;

        const encoded = encodeURIComponent(message);
        const phone = lead.phone?.replace(/\D/g, '');
        window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
    };

    const handleShareEmail = (lead: LeadData) => {
        if (selectedPropertyIds.length === 0) return;
        const selectedMatches = matches.filter(m => selectedPropertyIds.includes(m.id));
        const subject = encodeURIComponent('Property Matches for You');
        const body = encodeURIComponent(`Hello ${lead.name},\n\nI found some properties that match your requirements:\n\n` +
            selectedMatches.map(m => `${m.title}\nPrice: ${m.price.toLocaleString()} ${m.currency}\nLink: ${window.location.origin}/properties/${m.id}`).join('\n\n') +
            `\n\nLet me know if you are interested!`);

        window.location.href = `mailto:${lead.email}?subject=${subject}&body=${body}`;
    };

    const toggleExpand = (id: string) => {
        if (expandedLeadId === id) {
            setExpandedLeadId(null);
            setMatches([]);
            setHasScanned(false);
        } else {
            setExpandedLeadId(id);
            setMatches([]);
            setHasScanned(false);
        }
    };

    // Advanced Filter State
    const [filters, setFilters] = useState({
        preference_type: 'all',
        preference_listing_type: 'all',
        city: '',
        area: '',
        budget_min: '',
        budget_max: '',
        rooms_min: '',
        surface_min: '',
        urgency: 'all',
        buying_reason: 'all',
        occupation: '',
        source: '',
        payment_method: 'all',
        interest_rating: 'all'
    });

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const resetFilters = () => {
        setFilters({
            preference_type: 'all',
            preference_listing_type: 'all',
            city: '',
            area: '',
            budget_min: '',
            budget_max: '',
            rooms_min: '',
            surface_min: '',
            urgency: 'all',
            buying_reason: 'all',
            occupation: '',
            source: '',
            payment_method: 'all',
            interest_rating: 'all'
        });
        setSearchTerm('');
        setActiveStatus('all');
    };

    const filteredAndSortedLeads = useMemo(() => {
        let result = leads.filter(lead => {
            // Ownership Filter
            if (ownershipFilter === 'my' && lead.agent_id !== currentUserId) return false;
            if (ownershipFilter === 'partner' && lead.agent_id === currentUserId) return false;

            const isOwner = lead.agent_id === currentUserId;
            const displayName = isOwner ? (lead.name || '') : 'Partner Lead';

            const matchesSearch =
                (displayName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (isOwner && lead.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (isOwner && lead.phone?.includes(searchTerm)) ||
                (lead.preference_type?.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesStatus = activeStatus === 'all' || lead.status === activeStatus;

            // Advanced Filters
            const matchesType = filters.preference_type === 'all' || lead.preference_type === filters.preference_type;
            const matchesListingType = filters.preference_listing_type === 'all' || lead.preference_listing_type === filters.preference_listing_type;
            const matchesCity = !filters.city || lead.preference_location_city?.toLowerCase().includes(filters.city.toLowerCase());
            const matchesArea = !filters.area || lead.preference_location_area?.toLowerCase().includes(filters.area.toLowerCase());
            const matchesBudgetMin = !filters.budget_min || (Number(lead.budget_max || 0) >= Number(filters.budget_min));
            const matchesBudgetMax = !filters.budget_max || (Number(lead.budget_max || 0) <= Number(filters.budget_max));
            const matchesRooms = !filters.rooms_min || (Number(lead.preference_rooms_min || 0) >= Number(filters.rooms_min));
            const matchesSurface = !filters.surface_min || (Number(lead.preference_surface_min || 0) >= Number(filters.surface_min));
            const matchesUrgency = filters.urgency === 'all' || lead.move_urgency === filters.urgency;
            const matchesBuyingReason = filters.buying_reason === 'all' || lead.buying_reason === filters.buying_reason;
            const matchesOccupation = !filters.occupation || (isOwner && lead.occupation?.toLowerCase().includes(filters.occupation.toLowerCase()));
            const matchesSource = !filters.source || (isOwner && lead.source?.toLowerCase().includes(filters.source.toLowerCase()));
            const matchesPayment = filters.payment_method === 'all' || (isOwner && lead.payment_method === filters.payment_method);
            const matchesInterest = filters.interest_rating === 'all' || (isOwner && lead.agent_interest_rating === filters.interest_rating);

            return matchesSearch && matchesStatus && matchesType && matchesListingType && matchesCity &&
                matchesArea && matchesBudgetMin && matchesBudgetMax && matchesRooms && matchesSurface &&
                matchesUrgency && matchesBuyingReason && matchesOccupation && matchesSource &&
                matchesPayment && matchesInterest;
        });

        // Sorting
        return result.sort((a, b) => {
            let comparison = 0;
            if (sortBy === 'score') {
                comparison = (a.score || 0) - (b.score || 0);
            } else if (sortBy === 'budget') {
                comparison = (Number(a.budget_max) || 0) - (Number(b.budget_max) || 0);
            } else if (sortBy === 'urgency') {
                const urgencyWeight: Record<string, number> = {
                    '< 1 month (Urgent)': 3,
                    '1-3 months (Moderate)': 2,
                    '> 3 months (Low)': 1
                };
                comparison = (urgencyWeight[a.move_urgency || ''] || 0) - (urgencyWeight[b.move_urgency || ''] || 0);
            } else {
                // Newest (ID or created_at usually works if available, otherwise just use lead.id)
                comparison = String(a.id).localeCompare(String(b.id));
            }

            return sortOrder === 'desc' ? -comparison : comparison;
        });
    }, [leads, searchTerm, activeStatus, filters, sortBy, sortOrder, ownershipFilter, currentUserId]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this lead? This action cannot be undone.')) return;

        setIsDeleting(id);
        try {
            await deleteLead(id);
            router.refresh();
        } catch (error) {
            console.error('Delete failed:', error);
            alert('Failed to delete lead. Please try again.');
        } finally {
            setIsDeleting(null);
        }
    };

    const statuses = ['all', 'new', 'contacted', 'viewing', 'negotiation', 'closed', 'lost'];

    return (
        <div className="space-y-6">
            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by name, email, or preference..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all placeholder:text-slate-400"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
                            <button
                                onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${isFiltersExpanded ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'text-slate-600 hover:bg-slate-200'}`}
                            >
                                <Filter className="w-3.5 h-3.5" />
                                More Filters
                                {isFiltersExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                        </div>

                        <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
                            <select
                                value={`${sortBy}-${sortOrder}`}
                                onChange={(e) => {
                                    const [newSort, newOrder] = e.target.value.split('-');
                                    setSortBy(newSort as any);
                                    setSortOrder(newOrder as any);
                                }}
                                className="bg-transparent text-xs font-bold text-slate-600 px-2 py-1 outline-none cursor-pointer"
                            >
                                <option value="newest-desc">Newest First</option>
                                <option value="score-desc">Highest Score</option>
                                <option value="score-asc">Lowest Score</option>
                                <option value="budget-desc">Highest Budget</option>
                                <option value="budget-asc">Lowest Budget</option>
                                <option value="urgency-desc">Most Urgent</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => setOwnershipFilter('my')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${ownershipFilter === 'my' ? 'bg-orange-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                    >
                        My Leads
                    </button>
                    <button
                        onClick={() => setOwnershipFilter('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${ownershipFilter === 'all' ? 'bg-orange-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                    >
                        All Leads
                    </button>
                    <button
                        onClick={() => setOwnershipFilter('partner')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${ownershipFilter === 'partner' ? 'bg-orange-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                    >
                        Partner Leads
                    </button>
                </div>

                <div className="h-px bg-slate-100 my-2" />

                <div className="flex items-center gap-1 overflow-x-auto pb-2 md:pb-0 scrollbar-hide no-scrollbar border-t border-slate-100 pt-4">
                    {statuses.map(status => (
                        <button
                            key={status}
                            onClick={() => setActiveStatus(status)}
                            className={`
                                px-4 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap
                                ${activeStatus === status
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'}
                            `}
                        >
                            {status === 'all' ? 'All Leads' : STATUS_LABELS[status as keyof typeof STATUS_LABELS]}
                        </button>
                    ))}
                </div>

                {/* Advanced Filters Panel */}
                {isFiltersExpanded && (
                    <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Property Type</label>
                            <select name="preference_type" value={filters.preference_type} onChange={handleFilterChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900">
                                <option value="all">Any Type</option>
                                {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Listing Type</label>
                            <select name="preference_listing_type" value={filters.preference_listing_type} onChange={handleFilterChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900">
                                <option value="all">Any Listing</option>
                                {TRANSACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">City / Area</label>
                            <div className="flex gap-2">
                                <input type="text" name="city" value={filters.city} onChange={handleFilterChange} placeholder="City" className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900" />
                                <input type="text" name="area" value={filters.area} onChange={handleFilterChange} placeholder="Area" className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Min Rooms / Surface</label>
                            <div className="flex gap-2">
                                <input type="number" name="rooms_min" value={filters.rooms_min} onChange={handleFilterChange} placeholder="Rooms" className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900" />
                                <input type="number" name="surface_min" value={filters.surface_min} onChange={handleFilterChange} placeholder="Sqm" className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Budget Range (EUR)</label>
                            <div className="flex gap-2">
                                <input type="number" name="budget_min" value={filters.budget_min} onChange={handleFilterChange} placeholder="Min" className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900" />
                                <input type="number" name="budget_max" value={filters.budget_max} onChange={handleFilterChange} placeholder="Max" className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Urgency</label>
                            <select name="urgency" value={filters.urgency} onChange={handleFilterChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900">
                                <option value="all">Any Urgency</option>
                                <option value="< 1 month (Urgent)">{'< 1 month (Urgent)'}</option>
                                <option value="1-3 months (Moderate)">1-3 months (Moderate)</option>
                                <option value="> 3 months (Low)">{'> 3 months (Low)'}</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Payment Method</label>
                            <select name="payment_method" value={filters.payment_method} onChange={handleFilterChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900">
                                <option value="all">Any Method</option>
                                <option value="Cash">Cash</option>
                                <option value="Credit">Credit</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Interest Level</label>
                            <select name="interest_rating" value={filters.interest_rating} onChange={handleFilterChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900">
                                <option value="all">Any Level</option>
                                <option value="High">High</option>
                                <option value="Moderate">Moderate</option>
                                <option value="Low">Low</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Buying Reason</label>
                            <select name="buying_reason" value={filters.buying_reason} onChange={handleFilterChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900">
                                <option value="all">Any Reason</option>
                                <option value="Locuinta Personala">Locuinta Personala</option>
                                <option value="Investitie">Investitie</option>
                                <option value="Locuinta pt copii">Locuinta pt copii</option>
                                <option value="Locuinta de vacanta">Locuinta de vacanta</option>
                                <option value="Sediu">Sediu</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Occupation</label>
                            <input type="text" name="occupation" value={filters.occupation} onChange={handleFilterChange} placeholder="Filter by job..." className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900" />
                        </div>
                        <div className="flex items-end gap-2">
                            <div className="flex-1">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Source</label>
                                <input type="text" name="source" value={filters.source} onChange={handleFilterChange} placeholder="Filter by source..." className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900" />
                            </div>
                            <button
                                onClick={resetFilters}
                                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-colors"
                                title="Reset all filters"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden min-h-[400px]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Lead Name</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Score</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Preferences</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact Info</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredAndSortedLeads.length > 0 ? (
                                filteredAndSortedLeads.map((lead: any) => (
                                    <React.Fragment key={lead.id}>
                                        <tr
                                            onClick={() => toggleExpand(lead.id)}
                                            className={`cursor-pointer transition-all border-l-4 ${expandedLeadId === lead.id ? 'bg-slate-50 border-orange-500' : 'bg-white border-transparent hover:bg-slate-50'}`}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold shrink-0">
                                                        {(lead.agent_id === currentUserId ? (lead.name || '?') : 'P').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        {lead.agent_id === currentUserId ? (
                                                            <Link href={`${basePath}/${lead.id}`} className="font-bold text-slate-900 hover:text-orange-600 transition-colors">
                                                                {lead.name || 'Unnamed Lead'}
                                                            </Link>
                                                        ) : (
                                                            <span className="font-bold text-slate-500 italic">Partner Lead</span>
                                                        )}
                                                        <div className="text-xs text-slate-500">{lead.agent_id === currentUserId ? (lead.source || 'Unknown Source') : 'Shared Lead'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${STATUS_COLORS[(lead.status || 'new') as keyof typeof STATUS_COLORS] || 'text-gray-600 bg-gray-100'}`}>
                                                    {STATUS_LABELS[(lead.status || 'new') as keyof typeof STATUS_LABELS] || lead.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    <div className={`
                                                    w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                                                    ${(lead.score || 0) >= 80 ? 'bg-green-100 text-green-700' :
                                                            (lead.score || 0) >= 50 ? 'bg-orange-100 text-orange-700' :
                                                                'bg-slate-100 text-slate-500'}
                                                `}>
                                                        {lead.score || 0}
                                                    </div>
                                                    {(lead.score || 0) >= 80 && <span className="text-xs text-green-600 font-medium tracking-tight">Hot Lead</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-900 truncate max-w-[150px]">{lead.preference_type || 'Any Property'}</div>
                                                <div className="text-sm text-slate-500">
                                                    {lead.budget_max ? `Budget: ${Number(lead.budget_max).toLocaleString()} ${lead.currency || 'EUR'}` : 'No Budget Set'}
                                                </div>
                                                <div className="text-xs text-slate-400 truncate max-w-[150px]">
                                                    {lead.preference_location_city || ''} {lead.preference_location_area && `(${lead.preference_location_area})`}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {lead.agent_id === currentUserId ? (
                                                    <div className="flex flex-col gap-2 items-start">
                                                        {lead.email && (
                                                            <div className="flex items-center gap-2 group/link">
                                                                <a
                                                                    href={`mailto:${lead.email}`}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="p-1.5 bg-slate-100 rounded-md text-slate-500 hover:bg-orange-100 hover:text-orange-600 transition-all border border-slate-200 hover:border-orange-200 shadow-sm"
                                                                    title={`Email ${lead.email}`}
                                                                >
                                                                    <Mail className="w-3.5 h-3.5" />
                                                                </a>
                                                                <span className="text-xs font-medium text-slate-600">{lead.email}</span>
                                                            </div>
                                                        )}
                                                        {lead.phone && (
                                                            <div className="flex items-center gap-2 group/link">
                                                                <a
                                                                    href={`tel:${lead.phone}`}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="p-1.5 bg-slate-100 rounded-md text-slate-500 hover:bg-orange-100 hover:text-orange-600 transition-all border border-slate-200 hover:border-orange-200 shadow-sm"
                                                                    title={`Call ${lead.phone}`}
                                                                >
                                                                    <Phone className="w-3.5 h-3.5" />
                                                                </a>
                                                                <span className="text-xs font-medium text-slate-600">{lead.phone}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact Owner</span>
                                                        <div className="text-sm font-medium text-slate-600">{lead.agent?.full_name || 'Owner Agent'}</div>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {lead.agent_id === currentUserId ? (
                                                        <>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleDelete(lead.id); }}
                                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-100"
                                                                title="Archive Lead"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                            <Link
                                                                href={`${basePath}/${lead.id}`}
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all border border-transparent hover:border-slate-200"
                                                                title="Edit Details"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </Link>
                                                        </>
                                                    ) : (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); window.location.href = `mailto:${lead.agent?.email}?subject=Collaboration for Lead: ${lead.preference_type || 'Potential Buyer'}`; }}
                                                            className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-600 border border-orange-100 rounded-lg font-bold text-xs hover:bg-orange-100 transition-colors"
                                                        >
                                                            <Mail className="w-3.5 h-3.5" /> Contact Partner
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); toggleExpand(lead.id); }}
                                                        className={`p-2 rounded-lg transition-colors border ${expandedLeadId === lead.id ? 'bg-orange-50 text-orange-600 border-orange-200' : 'text-slate-400 hover:text-slate-900 border-transparent hover:bg-slate-100 hover:border-slate-300'}`}
                                                        title={expandedLeadId === lead.id ? "Hide Details" : "Show Details"}
                                                    >
                                                        {expandedLeadId === lead.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>

                                        {/* Expanded Lead Card */}
                                        {expandedLeadId === lead.id && (
                                            <tr className="bg-slate-50/50">
                                                <td colSpan={6} className="px-6 py-6 ring-1 ring-inset ring-slate-200/50">
                                                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                                                        {/* Card Header - Premium Gradient */}
                                                        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white flex justify-between items-center">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-3xl font-black border border-white/20">
                                                                    {(lead.name || '?').charAt(0).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
                                                                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Updated {new Date(lead.updated_at).toLocaleDateString()}</span>
                                                                        <span className="w-1 h-1 rounded-full bg-slate-500"></span>
                                                                        <span className="flex items-center gap-1"><List className="w-3 h-3" /> ID: {lead.id.slice(0, 8)}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <div className="text-right">
                                                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Lead Score</div>
                                                                    <div className="flex items-center gap-2">
                                                                        <div className={`text-2xl font-black ${(lead.score || 0) >= 80 ? 'text-green-400' : (lead.score || 0) >= 50 ? 'text-orange-400' : 'text-slate-400'}`}>
                                                                            {lead.score || 0}
                                                                        </div>
                                                                        <Activity className={`w-6 h-6 ${(lead.score || 0) >= 80 ? 'text-green-400' : (lead.score || 0) >= 50 ? 'text-orange-400' : 'text-slate-400'}`} />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                                                            {/* Profile Column */}
                                                            <div className="space-y-6">
                                                                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                                                                    <User className="w-5 h-5 text-orange-500" />
                                                                    <h4 className="font-black text-slate-900 text-sm uppercase tracking-wide">Consumer Profile</h4>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                                                                    <div>
                                                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Occupation</label>
                                                                        <div className="text-sm font-bold text-slate-900 truncate">{lead.occupation || 'N/A'}</div>
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Age / Domain</label>
                                                                        <div className="text-sm font-bold text-slate-900">{lead.age ? `${lead.age} yrs` : 'N/A'} {lead.employer && `• ${lead.employer}`}</div>
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Marital Status</label>
                                                                        <div className="text-sm font-bold text-slate-900">{lead.marital_status || 'N/A'}</div>
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kids / Pets</label>
                                                                        <div className="text-sm font-bold text-slate-900">{lead.kids_count || 0} Kids {lead.has_pets ? '• Has Pets' : ''}</div>
                                                                    </div>
                                                                </div>

                                                                {/* Property Ownership Section - Moved from Column 3 */}
                                                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                                                    <div className="flex items-center gap-2 mb-3">
                                                                        <Building2 className="w-4 h-4 text-orange-500" />
                                                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Portfolio Status</span>
                                                                    </div>

                                                                    {!lead.already_owns_properties ? (
                                                                        <div className="text-xs font-bold text-slate-400 italic">No existing properties owned</div>
                                                                    ) : (
                                                                        <div className="space-y-3">
                                                                            <div className="flex items-center justify-between">
                                                                                <span className="text-xs font-bold text-slate-700">Properties Owned</span>
                                                                                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-md text-xs font-black">{lead.owned_properties_count || 0}</span>
                                                                            </div>
                                                                            <div className="flex gap-1.5 flex-wrap">
                                                                                {lead.ownership_purpose_investment && (
                                                                                    <span className="flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-600 shadow-sm">
                                                                                        <TrendingUp className="w-3 h-3 text-orange-500" /> INVESTMENT
                                                                                    </span>
                                                                                )}
                                                                                {lead.ownership_purpose_personal && (
                                                                                    <span className="flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-600 shadow-sm">
                                                                                        <User className="w-3 h-3 text-orange-500" /> PERSONAL
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Requirements Column */}
                                                            <div className="space-y-6">
                                                                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                                                                    <Home className="w-5 h-5 text-orange-500" />
                                                                    <h4 className="font-black text-slate-900 text-sm uppercase tracking-wide">Property Requirements</h4>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                                                                    <div>
                                                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Request</label>
                                                                        <div className="text-sm font-bold text-slate-900">{lead.preference_listing_type} {lead.preference_type}</div>
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Location</label>
                                                                        <div className="text-sm font-bold text-slate-900 flex items-center gap-1 capitalize"><MapPin className="w-3 h-3 text-slate-400" /> {lead.preference_location_city || 'Any City'}</div>
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Budget (Max)</label>
                                                                        <div className="text-lg font-black text-orange-600">{lead.budget_max ? `${Number(lead.budget_max).toLocaleString()} ${lead.currency || 'EUR'}` : 'Not Specified'}</div>
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rooms / Surface</label>
                                                                        <div className="text-sm font-bold text-slate-900">{lead.preference_rooms_min ? `${lead.preference_rooms_min}+ Rooms` : 'Any'} • {lead.preference_surface_min ? `${lead.preference_surface_min}+ m²` : 'Any'}</div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-wrap gap-2 pt-2">
                                                                    <span className="px-3 py-1 bg-violet-50 text-violet-700 rounded-full text-[10px] font-bold border border-violet-100 uppercase tracking-wider">Payment: {lead.payment_method || 'N/A'}</span>
                                                                    <span className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-[10px] font-bold border border-orange-100 uppercase tracking-wider">Urgency: {lead.move_urgency || 'N/A'}</span>
                                                                </div>
                                                            </div>

                                                            {/* Intent & Interests Column */}
                                                            <div className="space-y-6">
                                                                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                                                                    <Zap className="w-5 h-5 text-orange-500" />
                                                                    <h4 className="font-black text-slate-900 text-sm uppercase tracking-wide">Intent & Preferences</h4>
                                                                </div>
                                                                <div>
                                                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 leading-none">Reason for Buying</label>
                                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold shadow-sm">
                                                                        <Heart className="w-3 h-3 text-red-400 fill-red-400" />
                                                                        {lead.buying_reason || 'Personal Home'}
                                                                    </div>
                                                                </div>

                                                                {/* Preferences & Dealing Breakers Section */}
                                                                <div className="grid grid-cols-1 gap-4">
                                                                    {lead.social_notes && (
                                                                        <div className="bg-green-50 p-4 rounded-xl border border-green-200 shadow-sm transition-all hover:shadow-md animate-in fade-in slide-in-from-top-4 duration-500">
                                                                            <div className="flex items-center gap-2 mb-2">
                                                                                <div className="p-1.5 bg-green-100 rounded-lg">
                                                                                    <Zap className="w-3.5 h-3.5 text-green-600" />
                                                                                </div>
                                                                                <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Client Preferences</span>
                                                                            </div>
                                                                            <p className="text-sm text-green-900 font-bold leading-relaxed italic">
                                                                                "{lead.social_notes}"
                                                                            </p>
                                                                        </div>
                                                                    )}

                                                                    {lead.negative_preferences && (
                                                                        <div className="bg-red-50 p-4 rounded-xl border border-red-200 shadow-sm transition-all hover:shadow-md animate-in fade-in slide-in-from-top-4 duration-500 delay-100">
                                                                            <div className="flex items-center gap-2 mb-2">
                                                                                <div className="p-1.5 bg-red-100 rounded-lg">
                                                                                    <Ban className="w-3.5 h-3.5 text-red-600" />
                                                                                </div>
                                                                                <span className="text-[10px] font-black text-red-700 uppercase tracking-widest">Dealing Breakers</span>
                                                                            </div>
                                                                            <p className="text-sm text-red-900 font-bold leading-relaxed italic">
                                                                                "{lead.negative_preferences}"
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {lead.points_of_interest && typeof lead.points_of_interest === 'object' && Object.values(lead.points_of_interest as Record<string, any>).filter(Boolean).length > 0 && (
                                                                    <div className="animate-in fade-in slide-in-from-top-4 duration-500 delay-200">
                                                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Neighborhood Interests</label>
                                                                        <div className="flex flex-wrap gap-1.5">
                                                                            {Object.entries(lead.points_of_interest as Record<string, any>).filter(([_, val]) => val).map(([key, val], i) => (
                                                                                <span key={i} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-600 rounded-md text-[10px] font-bold shadow-sm flex items-center gap-1.5 capitalize">
                                                                                    <div className="w-1 h-1 rounded-full bg-orange-400"></div>
                                                                                    {String(val)}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Matching Properties Section */}
                                                        <div className="border-t border-slate-100 bg-slate-50/30 p-8">
                                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-2 bg-orange-600 rounded-lg text-white shadow-lg shadow-orange-600/20">
                                                                        <Zap className="w-5 h-5 fill-current" />
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="font-black text-slate-900 text-lg uppercase tracking-tight">AI Matching Properties</h4>
                                                                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Showing top compatible properties from inventory</p>
                                                                    </div>
                                                                </div>

                                                                {selectedPropertyIds.length > 0 && (
                                                                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
                                                                        <button
                                                                            onClick={() => handleShareWhatsApp(lead)}
                                                                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-black flex items-center gap-2 transition-all shadow-md shadow-green-600/20"
                                                                        >
                                                                            <Phone className="w-4 h-4" /> Share WhatsApp ({selectedPropertyIds.length})
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleShareEmail(lead)}
                                                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-black flex items-center gap-2 transition-all shadow-md shadow-blue-600/20"
                                                                        >
                                                                            <Mail className="w-4 h-4" /> Share Email
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {!hasScanned && !isMatchingLoading ? (
                                                                <div className="py-16 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center px-6">
                                                                    <div className="w-20 h-20 bg-orange-100 rounded-3xl flex items-center justify-center mb-6 ring-8 ring-orange-50 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                                                                        <Zap className="w-10 h-10 text-orange-600 fill-current" />
                                                                    </div>
                                                                    <h3 className="text-slate-900 font-black text-xl mb-2">Find the Perfect Property</h3>
                                                                    <p className="text-slate-500 text-sm max-w-sm mb-8 font-medium">
                                                                        Our AI engine will analyze this lead's specific requirements and scan your entire inventory for the highest compatibility matches.
                                                                    </p>
                                                                    <button
                                                                        onClick={() => handleLoadMatches(lead.id)}
                                                                        className="px-10 py-4 bg-gradient-to-br from-orange-500 via-orange-600 to-pink-600 text-white rounded-xl font-black text-sm hover:scale-105 transition-all shadow-xl shadow-orange-600/25 flex items-center gap-4 active:scale-95 group"
                                                                    >
                                                                        <Zap className="w-5 h-5 fill-current group-hover:animate-pulse" />
                                                                        START AI MATCH SCAN
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    {isMatchingLoading ? (
                                                                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                                                                            <div className="w-12 h-12 border-4 border-orange-600/20 border-t-orange-600 rounded-full animate-spin"></div>
                                                                            <p className="text-slate-500 text-sm font-bold animate-pulse uppercase tracking-widest">Scanning inventory for best matches...</p>
                                                                        </div>
                                                                    ) : matchError ? (
                                                                        <div className="p-8 bg-red-50 border border-red-100 rounded-2xl text-center">
                                                                            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
                                                                            <p className="text-red-700 font-bold">{matchError}</p>
                                                                            <button onClick={() => handleLoadMatches(lead.id)} className="mt-4 text-sm font-black text-red-600 underline uppercase">Retry Scan</button>
                                                                        </div>
                                                                    ) : matches.length > 0 ? (
                                                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                                                            {matches.slice(0, 6).map((property) => (
                                                                                <div
                                                                                    key={property.id}
                                                                                    className={`group relative bg-white rounded-2xl border-2 transition-all cursor-pointer overflow-hidden ${selectedPropertyIds.includes(property.id) ? 'border-orange-600 shadow-xl ring-4 ring-orange-50' : 'border-slate-100 hover:border-slate-300 shadow-sm'}`}
                                                                                    onClick={() => togglePropertySelection(property.id)}
                                                                                >
                                                                                    <div className="aspect-[16/9] bg-slate-100 relative overflow-hidden">
                                                                                        <img
                                                                                            src={property.images?.[0] || '/placeholder-property.jpg'}
                                                                                            alt={property.title}
                                                                                            className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500"
                                                                                        />
                                                                                        <div className="absolute top-3 left-3 flex gap-2">
                                                                                            <div className="px-2.5 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-black rounded-lg border border-white/20 uppercase">
                                                                                                {property.type}
                                                                                            </div>
                                                                                            <div className={`px-2.5 py-1 text-white text-[10px] font-black rounded-lg border border-white/20 uppercase ${property.listing_type === 'For Sale' ? 'bg-blue-600/80' : 'bg-green-600/80'}`}>
                                                                                                {property.listing_type}
                                                                                            </div>
                                                                                        </div>

                                                                                        {/* Match Score Badge */}
                                                                                        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 text-white rounded-full text-xs font-black shadow-lg border border-orange-400 drop-shadow-md">
                                                                                            <Activity className="w-3.5 h-3.5" />
                                                                                            {property.match_score} pts
                                                                                        </div>

                                                                                        {/* Selection Indicator */}
                                                                                        <div className={`absolute inset-0 bg-orange-600/20 backdrop-blur-[2px] flex items-center justify-center transition-opacity duration-300 ${selectedPropertyIds.includes(property.id) ? 'opacity-100' : 'opacity-0'}`}>
                                                                                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-2xl scale-in-center">
                                                                                                <CheckCircle className="w-8 h-8 text-orange-600" />
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="p-4">
                                                                                        <h5 className="font-black text-slate-800 text-sm truncate mb-1">{property.title}</h5>
                                                                                        <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold mb-3 uppercase tracking-wider">
                                                                                            <MapPin className="w-3 h-3" /> {property.location_city}
                                                                                            {property.location_area && ` • ${property.location_area}`}
                                                                                        </div>
                                                                                        <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                                                                                            <div className="text-lg font-black text-orange-600 leading-none">
                                                                                                {property.price.toLocaleString()} {property.currency}
                                                                                            </div>
                                                                                            <div className="flex gap-2">
                                                                                                {property.owner_id !== currentUserId && (
                                                                                                    <button
                                                                                                        onClick={(e) => {
                                                                                                            e.stopPropagation();
                                                                                                            handleContactPartner(property, lead.id);
                                                                                                        }}
                                                                                                        className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors"
                                                                                                        title="Contact Partner"
                                                                                                    >
                                                                                                        <MessageSquare className="w-4 h-4" />
                                                                                                    </button>
                                                                                                )}
                                                                                                <Link
                                                                                                    href={`/properties/${property.id}`}
                                                                                                    target="_blank"
                                                                                                    onClick={(e) => e.stopPropagation()}
                                                                                                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                                                                                                    title="View Property"
                                                                                                >
                                                                                                    <ArrowUpRight className="w-4 h-4" />
                                                                                                </Link>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="p-12 bg-slate-100/50 rounded-2xl border-2 border-dashed border-slate-200 text-center">
                                                                            <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                                                                <Home className="w-8 h-8 text-slate-400" />
                                                                            </div>
                                                                            <p className="text-slate-500 font-bold">No highly compatible properties found in current inventory.</p>
                                                                            <p className="text-slate-400 text-xs mt-1">Try adjusting the lead preferences or scoring rules in Superadmin.</p>
                                                                            <button onClick={() => handleLoadMatches(lead.id)} className="mt-4 text-xs font-black text-orange-600 underline uppercase">Scan Again</button>
                                                                        </div>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <Search className="w-8 h-8 opacity-20" />
                                            <span className="text-sm">
                                                {searchTerm || activeStatus !== 'all'
                                                    ? 'No leads match your search criteria.'
                                                    : 'No leads added yet.'}
                                            </span>
                                            {(searchTerm || activeStatus !== 'all') && (
                                                <button
                                                    onClick={() => { setSearchTerm(''); setActiveStatus('all'); }}
                                                    className="text-xs text-orange-600 font-bold hover:underline mt-2"
                                                >
                                                    Clear all filters
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                        Showing {filteredAndSortedLeads.length} of {leads.length} leads
                    </span>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 text-sm border border-slate-300 rounded-md bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50" disabled>Previous</button>
                        <button className="px-3 py-1 text-sm border border-slate-300 rounded-md bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50" disabled>Next</button>
                    </div>
                </div>
            </div>
        </div >
    );
}
