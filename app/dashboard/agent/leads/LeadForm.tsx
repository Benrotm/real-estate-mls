"use client";

import React, { useState } from 'react';
import { Save, X } from 'lucide-react';
import {
    PROPERTY_TYPES,
    TRANSACTION_TYPES,
    CURRENCIES,
    PROPERTY_FEATURES
} from '@/app/lib/properties';
import { createLead, updateLead, LeadData } from '@/app/lib/actions/leads';

interface LeadFormProps {
    initialData?: LeadData;
    isEditing?: boolean;
    onCancel?: () => void;
}

export default function LeadForm({ initialData, isEditing = false, onCancel }: LeadFormProps) {
    const [isLoading, setIsLoading] = useState(false);
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
        preference_features: []
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
            if (onCancel) onCancel(); // Or let server action redirect
        } catch (error) {
            alert('Failed to save lead. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-8">
            {/* Contact Info */}
            <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 border-b pb-2">Client Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Full Name *</label>
                        <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Phone</label>
                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500" />
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
                        <label className="block text-sm font-bold text-slate-700 mb-2">Source</label>
                        <input type="text" name="source" placeholder="e.g. Website, Walk-in, Referral" value={formData.source} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500" />
                    </div>
                </div>
            </div>

            {/* Preferences */}
            <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 border-b pb-2">Property Preferences</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Type</label>
                        <select name="preference_type" value={formData.preference_type} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg">
                            {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Listing Type</label>
                        <select name="preference_listing_type" value={formData.preference_listing_type} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg">
                            {TRANSACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Budget ({formData.currency})</label>
                        <div className="flex gap-2">
                            <input type="number" name="budget_min" placeholder="Min" value={formData.budget_min || ''} onChange={handleChange} className="w-1/2 px-4 py-2 border rounded-lg" />
                            <input type="number" name="budget_max" placeholder="Max" value={formData.budget_max || ''} onChange={handleChange} className="w-1/2 px-4 py-2 border rounded-lg" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Location (County)</label>
                        <input type="text" name="preference_location_county" value={formData.preference_location_county || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
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
                        <label className="block text-sm font-bold text-slate-700 mb-2">Min Bedrooms</label>
                        <input type="number" name="preference_bedrooms_min" value={formData.preference_bedrooms_min || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Min Surface (sqm)</label>
                        <input type="number" name="preference_surface_min" value={formData.preference_surface_min || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg" />
                    </div>
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Features</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {PROPERTY_FEATURES.map(feature => (
                            <label key={feature} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={(formData.preference_features || []).includes(feature)}
                                    onChange={() => handleFeatureToggle(feature)}
                                    className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                                />
                                {feature}
                            </label>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Notes</label>
                    <textarea name="notes" rows={4} value={formData.notes || ''} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"></textarea>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
                {onCancel && (
                    <button type="button" onClick={onCancel} className="px-6 py-2 border border-slate-300 rounded-lg font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                    <Save className="w-5 h-5" />
                    {isLoading ? 'Saving...' : (isEditing ? 'Update Lead' : 'Create Lead')}
                </button>
            </div>
        </form>
    );
}
