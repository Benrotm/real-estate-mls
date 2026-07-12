import React from 'react';
import { User, Building2, TrendingUp, Home, Zap, Heart, Ban, MapPin } from 'lucide-react';
import { LeadData } from '@/app/lib/types';

export default function LeadProfileDetails({ lead }: { lead: Partial<LeadData> }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kids / Pets / Habits</label>
                        <div className="text-sm font-bold text-slate-900">
                            {lead.has_small_kids || (lead.kids_count && lead.kids_count > 0) ? 'Small Kids' : 'No Small Kids'}
                            {lead.has_pets ? ' • Has Pets' : ''}
                            {lead.is_smoker ? ' • Smoker' : ''}
                        </div>
                    </div>
                </div>

                {/* Property Ownership Section */}
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
    );
}
