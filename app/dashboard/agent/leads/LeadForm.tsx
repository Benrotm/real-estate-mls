"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, X, User, ClipboardList, Eye } from 'lucide-react';
import {
    PROPERTY_TYPES,
    TRANSACTION_TYPES,
    PROPERTY_FEATURES
} from '@/app/lib/properties';
import { createLead, updateLead, LeadData } from '@/app/lib/actions/leads';

interface LeadFormProps {
    initialData?: LeadData;
    isEditing?: boolean;
    onCancel?: () => void;
}

type TabType = 'contact' | 'classification' | 'viewing';

export default function LeadForm({ initialData, isEditing = false, onCancel }: LeadFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('contact');
    const [formData, setFormData] = useState<LeadData>(initialData || {
        name: '',
        email: '',
        phone: '',
        status: 'new',
        source: '',
        notes: '',
        preference_type: 'Apartment',
        preference_listing_type: 'For Sale',
        currency: 'EUR',
        preference_features: [],
        search_duration: '< 1 month',
        viewed_count_total: '0',
        move_urgency: '< 1 month (Urgent)',
        payment_method: 'Credit',
        bank_status: 'No',
        budget_vs_market: 'Moderate',
        agent_interest_rating: 'Moderate',
        viewed_count_agent: 0,
        outcome_status: 'Still Searching'
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFeatureToggle = (feature: string) => {
        setFormData(prev => {
            const features = prev.preference_features || [];
            if (features.includes(feature)) {
                return { ...prev, preference_features: features.filter(f => f !== feature) };
            } else {
                return { ...prev, preference_features: [...features, feature] };
            }
        });
    };

    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (isEditing && initialData?.id) {
                await updateLead(initialData.id, formData);
            } else {
                await createLead(formData);
            }
            if (onCancel) {
                onCancel();
            } else {
                // If not in a modal (e.g. on separate page), redirect
                router.push('/dashboard/agent/leads');
                router.refresh();
            }
        } catch (error: any) {
            console.error('Lead save error:', error);
            // Only alert if it's NOT a redirect error (though we removed redirects from server action, safety first)
            if (!error.message?.includes('NEXT_REDIRECT')) {
                alert(error.message || 'Failed to save lead. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const TabButton = ({ id, label, icon: Icon }: { id: TabType, label: string, icon: any }) => (
        <button
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 border ${activeTab === id
                ? 'bg-orange-50 border-orange-200 text-orange-700 shadow-sm'
                : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
        >
            <Icon className={`w-4 h-4 ${activeTab === id ? 'text-orange-600' : 'text-slate-400'}`} />
            {label}
        </button>
    );

    // Styled classes for consistent high-contrast design
    const inputClass = "w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-medium";
    const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2";
    const selectClass = "w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-medium cursor-pointer";

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden h-full flex flex-col">
            {/* Header Tabs */}
            <div className="bg-white p-2 flex gap-2 border-b border-slate-100">
                <TabButton id="contact" label="Contact Data" icon={User} />
                <TabButton id="classification" label="Classification" icon={ClipboardList} />
                <TabButton id="viewing" label="Viewing" icon={Eye} />
            </div>

            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">

                {/* CONTACT TAB */}
                {activeTab === 'contact' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-6">
                            <h3 className="text-blue-800 font-bold flex items-center gap-2 mb-1">
                                <User className="w-5 h-5" />
                                Basic Information
                            </h3>
                            <p className="text-blue-600/80 text-sm">Main contact details and lead status.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={labelClass}>Full Name *</label>
                                <input type="text" name="name" required value={formData.name} onChange={handleChange} className={inputClass} placeholder="e.g. John Doe" />
                            </div>
                            <div>
                                <label className={labelClass}>Status</label>
                                <div className="relative">
                                    <select name="status" value={formData.status} onChange={handleChange} className={selectClass}>
                                        <option value="new">New Lead</option>
                                        <option value="contacted">Contacted</option>
                                        <option value="viewing">Viewing Scheduled</option>
                                        <option value="negotiation">Negotiation</option>
                                        <option value="closed">Closed / Won</option>
                                        <option value="lost">Lost</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Email</label>
                                <input type="email" name="email" value={formData.email || ''} onChange={handleChange} className={inputClass} placeholder="client@example.com" />
                            </div>
                            <div>
                                <label className={labelClass}>Phone</label>
                                <input type="tel" name="phone" value={formData.phone || ''} onChange={handleChange} className={inputClass} placeholder="+1 234 567 890" />
                            </div>
                            <div className="md:col-span-2">
                                <label className={labelClass}>Source</label>
                                <input type="text" name="source" placeholder="e.g. Website, Walk-in, Referral" value={formData.source || ''} onChange={handleChange} className={inputClass} />
                            </div>
                        </div>
                    </div>
                )}

                {/* CLASSIFICATION TAB */}
                {activeTab === 'classification' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Status Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className={labelClass}>Search Duration</label>
                                <div className="relative">
                                    <select name="search_duration" value={formData.search_duration || ''} onChange={handleChange} className={selectClass}>
                                        <option value="< 1 month">{'< 1 month'}</option>
                                        <option value="1-3 months">1-3 months</option>
                                        <option value="3-6 months">3-6 months</option>
                                        <option value="> 6 months">{'> 6 months'}</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Variants Viewed</label>
                                <div className="relative">
                                    <select name="viewed_count_total" value={formData.viewed_count_total || ''} onChange={handleChange} className={selectClass}>
                                        <option value="0">0</option>
                                        <option value="1-2 variants">1-2 variants</option>
                                        <option value="3-5 variants">3-5 variants</option>
                                        <option value="> 5 variants">{'> 5 variants'}</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Move Urgency</label>
                                <div className="relative">
                                    <select name="move_urgency" value={formData.move_urgency || ''} onChange={handleChange} className={selectClass}>
                                        <option value="< 1 month (Urgent)">{'< 1 month (Urgent)'}</option>
                                        <option value="1-3 months (Moderate)">1-3 months (Moderate)</option>
                                        <option value="> 3 months (Low)">{'> 3 months (Low)'}</option>
                                    </select>
                                </div>
                            </div>
                        </div>



                        {/* Preference Details (Collapsable or Section) */}
                        <div className="border-t border-slate-200 pt-6">
                            <h3 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <ClipboardList className="w-5 h-5 text-slate-500" />
                                Property Requirements
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                <div>
                                    <label className={labelClass}>Type</label>
                                    <div className="relative">
                                        <select name="preference_type" value={formData.preference_type} onChange={handleChange} className={selectClass}>
                                            {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>City</label>
                                    <input type="text" name="preference_location_city" value={formData.preference_location_city || ''} onChange={handleChange} className={inputClass} placeholder="e.g. New York" />
                                </div>
                                <div>
                                    <label className={labelClass}>Area / Neighborhood</label>
                                    <input type="text" name="preference_location_area" value={formData.preference_location_area || ''} onChange={handleChange} className={inputClass} placeholder="e.g. Downtown" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                <div>
                                    <label className={labelClass}>Min Rooms</label>
                                    <input type="number" name="preference_rooms_min" value={formData.preference_rooms_min || ''} onChange={handleChange} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Min Surface (sqm)</label>
                                    <input type="number" name="preference_surface_min" value={formData.preference_surface_min || ''} onChange={handleChange} className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Agent Interest Level</label>
                                    <div className="relative">
                                        <select name="agent_interest_rating" value={formData.agent_interest_rating || ''} onChange={handleChange} className={selectClass}>
                                            <option value="High">High</option>
                                            <option value="Moderate">Moderate</option>
                                            <option value="Low">Low</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Features</label>
                                <div className="flex flex-wrap gap-2">
                                    {PROPERTY_FEATURES.map(feature => (
                                        <div key={feature}
                                            onClick={() => handleFeatureToggle(feature)}
                                            className={`px-4 py-2 rounded-xl text-sm font-bold cursor-pointer transition-all border shadow-sm ${(formData.preference_features || []).includes(feature)
                                                ? 'bg-orange-100 text-orange-800 border-orange-200 shadow-orange-100'
                                                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                                }`}
                                        >
                                            {feature}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* VIEWING TAB */}
                {activeTab === 'viewing' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100 mb-6">
                            <h3 className="text-purple-800 font-bold flex items-center gap-2 mb-1">
                                <Eye className="w-5 h-5" />
                                Viewing History
                            </h3>
                            <p className="text-purple-600/80 text-sm">Track viewings and outcome.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={labelClass}>Apartments Viewed (with me)</label>
                                <input type="number" name="viewed_count_agent" value={formData.viewed_count_agent || 0} onChange={handleChange} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Last Viewing Date</label>
                                <input type="date" name="last_viewing_date" value={formData.last_viewing_date || ''} onChange={handleChange} className={inputClass} />
                            </div>
                        </div>

                        {/* Financials (Moved from Classification) */}
                        <div className="p-6 bg-orange-50 rounded-xl border border-orange-100 shadow-sm">
                            <h4 className="text-base font-bold text-orange-800 mb-6 flex items-center gap-2">
                                💰 Financial Classification
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className={labelClass}>Cash or Credit</label>
                                    <div className="flex gap-6 items-center p-3 bg-white rounded-xl border border-orange-200">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input type="radio" name="payment_method" value="Cash" checked={formData.payment_method === 'Cash'} onChange={handleChange} className="w-5 h-5 text-orange-600 focus:ring-orange-500 border-gray-300" />
                                            <span className="text-slate-900 font-bold">Cash</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input type="radio" name="payment_method" value="Credit" checked={formData.payment_method === 'Credit'} onChange={handleChange} className="w-5 h-5 text-orange-600 focus:ring-orange-500 border-gray-300" />
                                            <span className="text-slate-900 font-bold">Credit</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Conditional Cash Amount */}
                                {formData.payment_method === 'Cash' && (
                                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                        <label className={labelClass}>Available Cash Amount</label>
                                        <input
                                            type="number"
                                            name="cash_amount"
                                            placeholder="e.g. 120000"
                                            value={formData.cash_amount || ''}
                                            onChange={handleChange}
                                            className={`${inputClass} !bg-green-50 !border-green-200 !text-green-800 focus:!border-green-500 focus:!ring-green-500/20`}
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className={labelClass}>Bank Status (Pre-approval)</label>
                                    <div className="relative">
                                        <select name="bank_status" value={formData.bank_status || ''} onChange={handleChange} className={selectClass}>
                                            <option value="No">No / Not Started</option>
                                            <option value="In Progress">In Progress</option>
                                            <option value="Pre-approved">Pre-approved</option>
                                            <option value="Not Needed">Not Needed (Cash)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className={labelClass}>Budget ({formData.currency})</label>
                                    <div className="flex gap-3">
                                        <input type="number" name="budget_min" placeholder="Min" value={formData.budget_min || ''} onChange={handleChange} className={inputClass} />
                                        <input type="number" name="budget_max" placeholder="Max" value={formData.budget_max || ''} onChange={handleChange} className={inputClass} />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>Budget vs Market Reality</label>
                                    <div className="relative">
                                        <select name="budget_vs_market" value={formData.budget_vs_market || ''} onChange={handleChange} className={selectClass}>
                                            <option value="Realistic">Realistic</option>
                                            <option value="Low">Low / Difficult</option>
                                            <option value="High">Generous</option>
                                            <option value="Unsure">Unsure</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Outcome Status (Cum am ramas)</label>
                            <div className="relative">
                                <select name="outcome_status" value={formData.outcome_status || ''} onChange={handleChange} className={selectClass}>
                                    <option value="Mai cauta">Still Searching (Mai caută)</option>
                                    <option value="Asteapta Credit">Waiting for Credit</option>
                                    <option value="Se gandeste">Thinking about an offer</option>
                                    <option value="A facut oferta">Offer Made</option>
                                    <option value="Nu e interesat">Not Interested</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Next Steps / Summary (Motivul)</label>
                            <textarea
                                name="next_steps_summary"
                                rows={3}
                                placeholder="Ex: Asteapta aprobarea creditului, revin saptamana viitoare..."
                                value={formData.next_steps_summary || ''}
                                onChange={handleChange}
                                className={inputClass}
                            ></textarea>
                        </div>

                        <div className="pt-4 border-t border-slate-200">
                            <label className={labelClass}>General Notes</label>
                            <textarea name="notes" rows={4} value={formData.notes || ''} onChange={handleChange} className={inputClass} placeholder="Any other important details..."></textarea>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center">
                <div className="text-xs text-slate-400 font-mono">
                    {/* Optional Status text */}
                    Tab: {activeTab.toUpperCase()}
                </div>
                <div className="flex gap-3">
                    {onCancel && (
                        <button type="button" onClick={onCancel} className="px-6 py-2 border border-slate-300 rounded-lg font-bold text-slate-600 hover:bg-white transition-colors">
                            Cancel
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-6 py-2 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
                    >
                        <Save className="w-4 h-4" />
                        {isLoading ? 'Saving...' : (isEditing ? 'Update Lead' : 'Create Client')}
                    </button>
                </div>
            </div>
        </form>
    );
}
