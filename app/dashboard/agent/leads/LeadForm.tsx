"use client";

import React, { useState } from 'react';
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (isEditing && initialData?.id) {
                await updateLead(initialData.id, formData);
            } else {
                await createLead(formData);
            }
            if (onCancel) onCancel();
        } catch (error) {
            alert('Failed to save lead. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const TabButton = ({ id, label, icon: Icon }: { id: TabType, label: string, icon: any }) => (
        <button
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex-1 m-1 py-2 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${activeTab === id
                ? 'bg-white shadow-sm text-orange-600 font-bold'
                : 'text-slate-500 hover:bg-slate-50'
                }`}
        >
            <Icon className="w-4 h-4" />
            {label}
        </button>
    );

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Header Tabs */}
            <div className="bg-slate-100 p-1 flex border-b border-slate-200">
                <TabButton id="contact" label="Contact Data" icon={User} />
                <TabButton id="classification" label="Classification" icon={ClipboardList} />
                <TabButton id="viewing" label="Viewing" icon={Eye} />
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh]">

                {/* CONTACT TAB */}
                {activeTab === 'contact' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Full Name *</label>
                                <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Status</label>
                                <select name="status" value={formData.status} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500">
                                    <option value="new">New Lead</option>
                                    <option value="contacted">Contacted</option>
                                    <option value="viewing">Viewing Scheduled</option>
                                    <option value="negotiation">Negotiation</option>
                                    <option value="closed">Closed / Won</option>
                                    <option value="lost">Lost</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                                <input type="email" name="email" value={formData.email || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Phone</label>
                                <input type="tel" name="phone" value={formData.phone || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-slate-700 mb-2">Source</label>
                                <input type="text" name="source" placeholder="e.g. Website, Walk-in, Referral" value={formData.source || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500" />
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
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Search Duration</label>
                                <select name="search_duration" value={formData.search_duration || ''} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border rounded-lg">
                                    <option value="< 1 month">{'< 1 month'}</option>
                                    <option value="1-3 months">1-3 months</option>
                                    <option value="3-6 months">3-6 months</option>
                                    <option value="> 6 months">{'> 6 months'}</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Variants Viewed</label>
                                <select name="viewed_count_total" value={formData.viewed_count_total || ''} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border rounded-lg">
                                    <option value="0">0</option>
                                    <option value="1-2 variants">1-2 variants</option>
                                    <option value="3-5 variants">3-5 variants</option>
                                    <option value="> 5 variants">{'> 5 variants'}</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Move Urgency</label>
                                <select name="move_urgency" value={formData.move_urgency || ''} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border rounded-lg">
                                    <option value="< 1 month (Urgent)">{'< 1 month (Urgent)'}</option>
                                    <option value="1-3 months (Moderate)">1-3 months (Moderate)</option>
                                    <option value="> 3 months (Low)">{'> 3 months (Low)'}</option>
                                </select>
                            </div>
                        </div>

                        {/* Financials */}
                        <div className="p-4 bg-orange-50/50 rounded-xl border border-orange-100">
                            <h4 className="text-sm font-bold text-orange-800 mb-4 flex items-center gap-2">
                                💰 Financial Classification
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Cash or Credit</label>
                                    <div className="flex gap-4 items-center">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="payment_method" value="Cash" checked={formData.payment_method === 'Cash'} onChange={handleChange} className="text-orange-600 focus:ring-orange-500" />
                                            <span className="text-slate-700">Cash</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="payment_method" value="Credit" checked={formData.payment_method === 'Credit'} onChange={handleChange} className="text-orange-600 focus:ring-orange-500" />
                                            <span className="text-slate-700">Credit</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Conditional Cash Amount */}
                                {formData.payment_method === 'Cash' && (
                                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Available Cash Amount</label>
                                        <input
                                            type="number"
                                            name="cash_amount"
                                            placeholder="e.g. 120000"
                                            value={formData.cash_amount || ''}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 bg-green-50 border-green-200 text-green-800 font-bold"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Bank Status (Pre-approval)</label>
                                    <select name="bank_status" value={formData.bank_status || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg">
                                        <option value="No">No / Not Started</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Pre-approved">Pre-approved</option>
                                        <option value="Not Needed">Not Needed (Cash)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Budget ({formData.currency})</label>
                                    <div className="flex gap-2">
                                        <input type="number" name="budget_min" placeholder="Min" value={formData.budget_min || ''} onChange={handleChange} className="w-1/2 px-4 py-2 border rounded-lg bg-white" />
                                        <input type="number" name="budget_max" placeholder="Max" value={formData.budget_max || ''} onChange={handleChange} className="w-1/2 px-4 py-2 border rounded-lg bg-white" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Budget vs Market Reality</label>
                                    <select name="budget_vs_market" value={formData.budget_vs_market || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg bg-white">
                                        <option value="Realistic">Realistic</option>
                                        <option value="Low">Low / Difficult</option>
                                        <option value="High">Generous</option>
                                        <option value="Unsure">Unsure</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Preference Details (Collapsable or Section) */}
                        <div className="border-t pt-6">
                            <h3 className="text-base font-bold text-slate-900 mb-4">Property Requirements</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Type</label>
                                    <select name="preference_type" value={formData.preference_type} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg">
                                        {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">City</label>
                                    <input type="text" name="preference_location_city" value={formData.preference_location_city || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Area / Neighborhood</label>
                                    <input type="text" name="preference_location_area" value={formData.preference_location_area || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Min Rooms</label>
                                    <input type="number" name="preference_rooms_min" value={formData.preference_rooms_min || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Min Surface (sqm)</label>
                                    <input type="number" name="preference_surface_min" value={formData.preference_surface_min || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Agent Interest Level</label>
                                    <select name="agent_interest_rating" value={formData.agent_interest_rating || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg">
                                        <option value="High">High</option>
                                        <option value="Moderate">Moderate</option>
                                        <option value="Low">Low</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Features</label>
                                <div className="flex flex-wrap gap-2">
                                    {PROPERTY_FEATURES.map(feature => (
                                        <div key={feature}
                                            onClick={() => handleFeatureToggle(feature)}
                                            className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition-colors border ${(formData.preference_features || []).includes(feature)
                                                ? 'bg-orange-100 text-orange-700 border-orange-200'
                                                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Apartments Viewed (with me)</label>
                                <input type="number" name="viewed_count_agent" value={formData.viewed_count_agent || 0} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Last Viewing Date</label>
                                <input type="date" name="last_viewing_date" value={formData.last_viewing_date || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Outcome Status (Cum am ramas)</label>
                            <select name="outcome_status" value={formData.outcome_status || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500">
                                <option value="Mai cauta">Still Searching (Mai caută)</option>
                                <option value="Asteapta Credit">Waiting for Credit</option>
                                <option value="Se gandeste">Thinking about an offer</option>
                                <option value="A facut oferta">Offer Made</option>
                                <option value="Nu e interesat">Not Interested</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Next Steps / Summary (Motivul)</label>
                            <textarea
                                name="next_steps_summary"
                                rows={3}
                                placeholder="Ex: Asteapta aprobarea creditului, revin saptamana viitoare..."
                                value={formData.next_steps_summary || ''}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                            ></textarea>
                        </div>

                        <div className="pt-4 border-t">
                            <label className="block text-sm font-bold text-slate-700 mb-2">General Notes</label>
                            <textarea name="notes" rows={4} value={formData.notes || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"></textarea>
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
