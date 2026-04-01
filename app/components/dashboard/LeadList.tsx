'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Mail, Phone, Edit, Search, CheckCircle, Clock, Trash2, X, AlertCircle, ChevronDown, ChevronUp, Filter, ArrowUpAZ, ArrowDownZA, DollarSign, Zap, User, Wallet, MapPin, Activity, ChevronRight, Heart, Ban, Home, List, Building2, TrendingUp, ArrowUpRight, MessageSquare, Info, Eye } from 'lucide-react';
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
import ContactPartnerModal from '../ContactPartnerModal';
import LeadProfileDetails from './LeadProfileDetails';
import LeadAIMatching from './LeadAIMatching';

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
    teamMemberIds?: string[];
}

export default function LeadList({ leads, basePath, allowEdit = true, currentUserId, teamMemberIds = [] }: LeadListProps) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeStatus, setActiveStatus] = useState<string>('all');
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
    const [sortBy, setSortBy] = useState<'score' | 'budget' | 'urgency' | 'newest'>('newest');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
    const [ownershipFilter, setOwnershipFilter] = useState<'all' | 'my' | 'partner'>('all');

    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [selectedPartnerForContact, setSelectedPartnerForContact] = useState<any>(null);
    const [modalDefaultMessage, setModalDefaultMessage] = useState('');

    const handleContactPartnerLead = (lead: any) => {
        if (!lead.agent?.id) {
            alert('Partner contact info not available.');
            return;
        }
        setSelectedPartnerForContact({
            id: lead.agent.id,
            full_name: lead.agent.full_name || 'Partner Agent'
        });

        const shortId = lead.id.slice(0, 8);
        const budgetStr = lead.budget_max ? `, ${Number(lead.budget_max).toLocaleString()} ${lead.currency || 'EUR'}` : '';
        const prefType = lead.preference_type || 'Potential Buyer';

        setModalDefaultMessage(`Hi! I'm interested in collaborating on this lead: [${shortId}], [${prefType}]${budgetStr}. Let's chat!`);
        setIsContactModalOpen(true);
    };

    const toggleExpand = (id: string) => {
        if (expandedLeadId === id) {
            setExpandedLeadId(null);
        } else {
            setExpandedLeadId(id);
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
                (lead.preference_type?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (lead.id?.toLowerCase().includes(searchTerm.toLowerCase()));

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
                            placeholder="Search by ID, name, email, or preference..."
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
                                                        ) : teamMemberIds.includes(lead.agent_id) ? (
                                                            <Link href={`${basePath}/${lead.id}`} className="font-bold text-slate-500 italic hover:text-orange-600 transition-colors">
                                                                Team Lead
                                                            </Link>
                                                        ) : (
                                                            <span className="font-bold text-slate-500 italic">Partner Lead</span>
                                                        )}
                                                        <div className="text-xs text-slate-500">{lead.agent_id === currentUserId ? (lead.source || 'Unknown Source') : teamMemberIds.includes(lead.agent_id) ? 'Team Member Lead' : 'Shared Lead'}</div>
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
                                                    ) : teamMemberIds.includes(lead.agent_id) ? (
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleContactPartnerLead(lead); }}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-600 border border-orange-100 rounded-lg font-bold text-xs hover:bg-orange-100 transition-colors"
                                                            >
                                                                <MessageSquare className="w-3.5 h-3.5" /> Contact
                                                            </button>
                                                            <Link
                                                                href={`${basePath}/${lead.id}`}
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg font-bold text-xs hover:bg-slate-100 transition-colors"
                                                                title="View Details"
                                                            >
                                                                <Eye className="w-3.5 h-3.5" /> View
                                                            </Link>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleContactPartnerLead(lead); }}
                                                            className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-600 border border-orange-100 rounded-lg font-bold text-xs hover:bg-orange-100 transition-colors"
                                                        >
                                                            <MessageSquare className="w-3.5 h-3.5" /> Contact Partner
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

                                                        <div className="p-8">
                                                            <LeadProfileDetails lead={lead} />
                                                        </div>

                                                        {/* Matching Properties Section */}
                                                        <LeadAIMatching lead={lead} currentUserId={currentUserId} />
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
            {/* Contact Partner Modal */}
            {
                selectedPartnerForContact && (
                    <ContactPartnerModal
                        isOpen={isContactModalOpen}
                        onClose={() => {
                            setIsContactModalOpen(false);
                            setSelectedPartnerForContact(null);
                        }}
                        partnerId={selectedPartnerForContact.id}
                        partnerName={selectedPartnerForContact.full_name}
                        defaultMessage={modalDefaultMessage}
                        currentUserEmail={null}
                        currentUserId={currentUserId || null}
                    />
                )
            }
        </div >
    );
}
