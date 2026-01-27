'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createProperty } from '@/app/lib/actions/properties';
import { PROPERTY_TYPES, TRANSACTION_TYPES, PARTITIONING_TYPES, COMFORT_TYPES } from '@/app/lib/properties';
import { Loader2, Plus, Camera, MapPin, Layout, DollarSign, Home, Briefcase } from 'lucide-react';

export default function AddPropertyForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError(null);

        try {
            const rawData = Object.fromEntries(formData.entries());
            const features = [];

            // Collect booleans manually effectively
            const featureList = ['has_video', 'has_virtual_tour', 'commission_0', 'exclusive', 'luxury', 'hotel_regime', 'foreclosure'];
            for (const f of featureList) {
                if (rawData[f] === 'on') features.push(f);
            }

            // Add custom payload
            const result = await createProperty({
                ...rawData,
                features
            });

            if (result.error) {
                setError(result.error);
            } else {
                router.push('/dashboard/owner');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <form action={handleSubmit} className="space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm font-bold animate-pulse">
                    {error}
                </div>
            )}

            {/* Section 1: Basic Info */}
            <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Home className="w-5 h-5 text-blue-500" /> Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-1">Property Title</label>
                        <input name="title" required placeholder="e.g. Modern Apartment in City Center" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Transaction Type</label>
                        <select name="listing_type" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                            {TRANSACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Property Type</label>
                        <select name="type" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                            {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Section 2: Location */}
            <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2 border-t pt-6">
                    <MapPin className="w-5 h-5 text-red-500" /> Location
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">County (Judet)</label>
                        <input name="location_county" required placeholder="e.g. Ilfov" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outlines-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">City (Localitate)</label>
                        <input name="location_city" required placeholder="e.g. Bucuresti" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outlines-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Area (Zona)</label>
                        <input name="location_area" placeholder="e.g. Pipera" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outlines-none" />
                    </div>
                    <div className="col-span-1 md:col-span-3">
                        <label className="block text-sm font-bold text-slate-700 mb-1">Full Address</label>
                        <input name="address" placeholder="Street Name, Number, etc." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outlines-none" />
                    </div>
                </div>
            </div>

            {/* Section 3: Pricing */}
            <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2 border-t pt-6">
                    <DollarSign className="w-5 h-5 text-emerald-500" /> Pricing
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Price</label>
                        <input type="number" name="price" required placeholder="0.00" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outlines-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Currency</label>
                        <select name="currency" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outlines-none">
                            <option value="EUR">EUR</option>
                            <option value="USD">USD</option>
                            <option value="RON">RON</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Section 4: Details & Specs */}
            <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2 border-t pt-6">
                    <Layout className="w-5 h-5 text-purple-500" /> Details & Specifications
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Rooms</label>
                        <input type="number" name="rooms" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outlines-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Bedrooms</label>
                        <input type="number" name="bedrooms" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outlines-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Bathrooms</label>
                        <input type="number" name="bathrooms" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outlines-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Year Built</label>
                        <input type="number" name="year_built" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outlines-none" />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Usable Area (sqm)</label>
                        <input type="number" name="area_usable" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outlines-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Built Area (sqm)</label>
                        <input type="number" name="area_built" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outlines-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Floor</label>
                        <input type="number" name="floor" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outlines-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Total Floors</label>
                        <input type="number" name="total_floors" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outlines-none" />
                    </div>

                    <div className="col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-1">Partitioning</label>
                        <select name="partitioning" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outlines-none">
                            <option value="">Select...</option>
                            {PARTITIONING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-1">Comfort</label>
                        <select name="comfort" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outlines-none">
                            <option value="">Select...</option>
                            {COMFORT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Section 5: Features Checkboxes */}
            <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2 border-t pt-6">
                    <Briefcase className="w-5 h-5 text-orange-500" /> Features & Amenities
                </h3>
                <div className="flex flex-wrap gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" name="has_video" className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                        <span className="text-slate-700 font-medium">Video Available</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" name="has_virtual_tour" className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                        <span className="text-slate-700 font-medium">Virtual Tour</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" name="commission_0" className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                        <span className="text-slate-700 font-medium">0% Commission</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" name="exclusive" className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                        <span className="text-slate-700 font-medium">Exclusive</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" name="luxury" className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                        <span className="text-slate-700 font-medium">Luxury</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" name="hotel_regime" className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                        <span className="text-slate-700 font-medium">Hotel Regime</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" name="foreclosure" className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                        <span className="text-slate-700 font-medium">Foreclosure</span>
                    </label>
                </div>
            </div>

            {/* Description */}
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                <textarea name="description" rows={5} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outlines-none"></textarea>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => router.back()} className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition">Cancel</button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition flex items-center gap-2"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                    Create Listing
                </button>
            </div>
        </form>
    );
}
