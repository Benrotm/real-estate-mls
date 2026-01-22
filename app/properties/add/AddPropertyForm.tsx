'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Home,
    MapPin,
    DollarSign,
    Check,
    ArrowRight,
    ArrowLeft,
    Image as ImageIcon,
    Building2,
    CheckCircle2
} from 'lucide-react';
import { createProperty } from '../../lib/actions';

const PROPERTY_TYPES = ['Apartment', 'House', 'Land', 'Commercial', 'Industrial', 'Business'];
const FEATURE_CATEGORIES = {
    'Unit Features': ['Air Conditioning', 'Central Heating', 'Balcony', 'Fireplace', 'Furnished', 'Laundry', 'Smart Home', 'Storage', 'Solar Panels', 'Private Pool', 'Jacuzzi'],
    'Community & Recreation': ['Clubhouse', 'Park', 'Playground', 'Jogging Track', 'Common Garden', 'Party Hall', 'Library', 'Amphitheatre'],
    'Sports & Fitness': ['Gym', 'Swimming Pool', 'Basketball Court', 'tennis Court', 'Football Field', 'Squash Court', 'Yoga Deck'],
    'Security & Safety': ['24/7 Security', 'CCTV Surveillance', 'Gated Community', 'Intercom', 'Fire Safety', 'Video Door Phone'],
    'Sustainability & Services': ['Green Building', 'Rainwater Harvesting', 'Sewage Treatment', 'Power Backup', 'Elevator', 'Concierge', 'Maintenance Staff', 'Visitor Parking']
};

export default function AddPropertyForm() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        listingType: 'For Sale',
        currency: 'USD',
        propertyType: 'Apartment',
        address: '',
        city: '',
        state: '',
        zip: '',
        beds: '',
        baths: '',
        sqft: '',
        yearBuilt: new Date().getFullYear().toString(),
        totalFloors: '',
        floor: '', // For apartment unit floor
        buildingType: '', // e.g. Detached
        interiorCondition: '', // e.g. New
        furnishing: 'Unfurnished',
        virtualTourType: 'No Virtual Tour',
        virtualTourUrl: '',
        features: [] as string[]
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const toggleFeature = (feature: string) => {
        setFormData(prev => ({
            ...prev,
            features: prev.features.includes(feature)
                ? prev.features.filter(f => f !== feature)
                : [...prev.features, feature]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        const formDataToSend = new FormData();
        // Append simple fields
        formDataToSend.append('title', formData.title);
        formDataToSend.append('description', formData.description);
        formDataToSend.append('price', formData.price);
        formDataToSend.append('listingType', formData.listingType);
        formDataToSend.append('currency', formData.currency);
        formDataToSend.append('virtualTourType', formData.virtualTourType);
        formDataToSend.append('virtualTourUrl', formData.virtualTourUrl); // Added field

        // Complex objects
        const location = {
            address: formData.address,
            city: formData.city,
            state: formData.state,
            zip: formData.zip,
            lat: 0, // Mock lat/lng, ideally replaced by Geocoding API
            lng: 0
        };
        formDataToSend.append('location', JSON.stringify(location));

        const specs = {
            beds: formData.beds,
            baths: formData.baths,
            sqft: formData.sqft,
            yearBuilt: formData.yearBuilt,
            type: formData.propertyType,
            totalFloors: formData.totalFloors,
            floor: formData.floor,
            buildingType: formData.buildingType,
            interiorCondition: formData.interiorCondition,
            furnishing: formData.furnishing,
            // interiorRating can be added if UI field exists, skipping for now as not in form
        };
        formDataToSend.append('specs', JSON.stringify(specs));
        formDataToSend.append('features', JSON.stringify(formData.features));
        formDataToSend.append('images', JSON.stringify([])); // Todo: Implement Image Upload

        try {
            const result = await createProperty(formDataToSend);
            if (result.success) {
                setSuccess(true);
            } else {
                alert(`Error: ${result.error}`);
            }
        } catch (error) {
            console.error(error);
            alert('An unexpected error occurred.');
        } finally {
            setSubmitting(false);
        }
    };

    const checkKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') e.preventDefault();
    };

    if (success) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
                {/* Background Blobs */}
                <div className="absolute top-0 -left-20 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl opacity-50 pointer-events-none" />
                <div className="absolute bottom-0 -right-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl opacity-50 pointer-events-none" />

                <div className="max-w-md w-full bg-slate-900/50 backdrop-blur-xl p-8 rounded-3xl border border-slate-800 text-center shadow-2xl relative z-10">
                    <div className="w-24 h-24 bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                        <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                    </div>
                    <h1 className="text-3xl font-bold mb-3 text-white">Listing Submitted!</h1>
                    <p className="text-slate-400 mb-8 leading-relaxed">
                        Your property has been successfully listed and is now pending review.
                    </p>
                    <button
                        onClick={() => router.push('/properties')}
                        className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-4 rounded-xl font-bold hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-600/25 border border-violet-500/20"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 pt-28 pb-24 relative overflow-hidden selection:bg-violet-500/30 selection:text-white">
            {/* Ambient Background Effects */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[100px]" />
                <div className="absolute top-[30%] left-[20%] w-[300px] h-[300px] bg-fuchsia-600/5 rounded-full blur-[80px]" />
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header Section */}
                <div className="mb-10">
                    <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">Add New Property</h1>
                    <p className="text-slate-400 text-lg">Create a premium listing for your real estate asset.</p>
                </div>

                {/* Stepper Navigation */}
                <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-1 mb-10 shadow-xl flex items-center justify-between relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex-1 relative z-10">
                            <button
                                type="button"
                                onClick={() => setStep(s)}
                                className={`flex items-center justify-center gap-3 w-full py-4 px-2 rounded-xl transition-all duration-300 ${step === s
                                    ? 'bg-slate-800/80 shadow-lg shadow-black/20 border border-slate-700/50'
                                    : 'hover:bg-slate-800/40'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 ${step === s
                                    ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30 scale-110'
                                    : step > s
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                                    }`}>
                                    {step > s ? <Check className="w-5 h-5" /> : s}
                                </div>
                                <div className="text-left hidden sm:block">
                                    <div className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${step === s ? 'text-violet-400' : 'text-slate-500'}`}>Step {s}</div>
                                    <div className={`text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r ${step === s ? 'from-white to-slate-200' : 'from-slate-400 to-slate-500 opacity-60'
                                        }`}>
                                        {s === 1 && 'Details'}
                                        {s === 2 && 'Location'}
                                        {s === 3 && 'Amenities'}
                                    </div>
                                </div>
                            </button>
                        </div>
                    ))}
                </div>

                <form onSubmit={handleSubmit} onKeyDown={checkKeyDown} className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative group">
                    {/* Glass Shine Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                    {/* Step 1: Basic Information */}
                    {step === 1 && (
                        <div className="p-8 md:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center border border-violet-500/30 shadow-inner">
                                    <Home className="w-6 h-6 text-violet-400" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Basic Information</h2>
                                    <p className="text-slate-400 text-sm">Essential details about the property.</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-slate-300">Property Title</label>
                                    <input
                                        type="text"
                                        name="title"
                                        required
                                        value={formData.title}
                                        onChange={handleChange}
                                        placeholder="e.g., Luxury Modern Apartment in Downtown"
                                        className="w-full bg-slate-950/50 border border-slate-700/80 rounded-xl px-5 py-4 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none transition-all text-white placeholder-slate-600 hover:border-slate-600"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 text-slate-300">Description</label>
                                    <textarea
                                        name="description"
                                        required
                                        rows={5}
                                        value={formData.description}
                                        onChange={handleChange}
                                        placeholder="Tell us more about the property..."
                                        className="w-full bg-slate-950/50 border border-slate-700/80 rounded-xl px-5 py-4 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none transition-all resize-none text-white placeholder-slate-600 hover:border-slate-600"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-slate-300">Property Type</label>
                                        <div className="relative">
                                            <select
                                                name="propertyType"
                                                value={formData.propertyType}
                                                onChange={handleChange}
                                                className="w-full bg-slate-950/50 border border-slate-700/80 rounded-xl px-5 py-4 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none appearance-none text-white hover:border-slate-600"
                                            >
                                                {PROPERTY_TYPES.map(t => <option key={t} value={t} className="bg-slate-900">{t}</option>)}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-slate-300">Listing Type</label>
                                        <div className="relative">
                                            <select
                                                name="listingType"
                                                value={formData.listingType}
                                                onChange={handleChange}
                                                className="w-full bg-slate-950/50 border border-slate-700/80 rounded-xl px-5 py-4 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none appearance-none text-white hover:border-slate-600"
                                            >
                                                <option value="For Sale" className="bg-slate-900">For Sale</option>
                                                <option value="For Rent" className="bg-slate-900">For Rent</option>
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Location & Pricing */}
                    {step === 2 && (
                        <div className="p-8 md:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center border border-violet-500/30 shadow-inner">
                                    <MapPin className="w-6 h-6 text-violet-400" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Location & Pricing</h2>
                                    <p className="text-slate-400 text-sm">Where is it and how much?</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium mb-2 text-slate-300">Price</label>
                                        <div className="relative">
                                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-violet-400 font-bold">
                                                <DollarSign className="w-5 h-5" />
                                            </div>
                                            <input
                                                type="number"
                                                name="price"
                                                required
                                                value={formData.price}
                                                onChange={handleChange}
                                                placeholder="0.00"
                                                className="w-full bg-slate-950/50 border border-slate-700/80 rounded-xl pl-12 pr-5 py-4 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none transition-all text-white placeholder-slate-600 hover:border-slate-600 text-lg font-medium"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-slate-300">Currency</label>
                                        <div className="relative">
                                            <select
                                                name="currency"
                                                value={formData.currency}
                                                onChange={handleChange}
                                                className="w-full bg-slate-950/50 border border-slate-700/80 rounded-xl px-5 py-4 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none appearance-none text-white hover:border-slate-600"
                                            >
                                                <option value="USD" className="bg-slate-900">USD ($)</option>
                                                <option value="EUR" className="bg-slate-900">EUR (€)</option>
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 text-slate-300">Street Address</label>
                                    <input
                                        type="text"
                                        name="address"
                                        required
                                        value={formData.address}
                                        onChange={handleChange}
                                        className="w-full bg-slate-950/50 border border-slate-700/80 rounded-xl px-5 py-4 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none transition-all text-white placeholder-slate-600 hover:border-slate-600"
                                    />
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-slate-300">City</label>
                                        <input type="text" name="city" required value={formData.city} onChange={handleChange} className="w-full bg-slate-950/50 border border-slate-700/80 rounded-xl px-5 py-4 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none transition-all text-white placeholder-slate-600 hover:border-slate-600" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-slate-300">State</label>
                                        <input type="text" name="state" required value={formData.state} onChange={handleChange} className="w-full bg-slate-950/50 border border-slate-700/80 rounded-xl px-5 py-4 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none transition-all text-white placeholder-slate-600 hover:border-slate-600" />
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-sm font-medium mb-2 text-slate-300">ZIP Code</label>
                                        <input type="text" name="zip" required value={formData.zip} onChange={handleChange} className="w-full bg-slate-950/50 border border-slate-700/80 rounded-xl px-5 py-4 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none transition-all text-white placeholder-slate-600 hover:border-slate-600" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Specifications & Features */}
                    {step === 3 && (
                        <div className="p-8 md:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center border border-violet-500/30 shadow-inner">
                                    <Building2 className="w-6 h-6 text-violet-400" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Details & Features</h2>
                                    <p className="text-slate-400 text-sm">Specs, amenities, and media.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-slate-300">Beds</label>
                                    <input type="number" name="beds" value={formData.beds} onChange={handleChange} className="w-full bg-slate-950/50 border border-slate-700/80 rounded-xl px-5 py-4 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none transition-all text-white placeholder-slate-600 hover:border-slate-600" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-slate-300">Baths</label>
                                    <input type="number" name="baths" value={formData.baths} onChange={handleChange} className="w-full bg-slate-950/50 border border-slate-700/80 rounded-xl px-5 py-4 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none transition-all text-white placeholder-slate-600 hover:border-slate-600" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium mb-2 text-slate-300">Area (sq ft)</label>
                                    <input type="number" name="sqft" value={formData.sqft} onChange={handleChange} className="w-full bg-slate-950/50 border border-slate-700/80 rounded-xl px-5 py-4 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none transition-all text-white placeholder-slate-600 hover:border-slate-600" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-slate-300">Floor</label>
                                    <input type="number" name="floor" placeholder="e.g., 5" value={formData.floor} onChange={handleChange} className="w-full bg-slate-950/50 border border-slate-700/80 rounded-xl px-5 py-4 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none transition-all text-white placeholder-slate-600 hover:border-slate-600" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-slate-300">Total Floors</label>
                                    <input type="number" name="totalFloors" placeholder="e.g., 10" value={formData.totalFloors} onChange={handleChange} className="w-full bg-slate-950/50 border border-slate-700/80 rounded-xl px-5 py-4 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none transition-all text-white placeholder-slate-600 hover:border-slate-600" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-slate-300">Building Type</label>
                                    <div className="relative">
                                        <select name="buildingType" value={formData.buildingType} onChange={handleChange} className="w-full bg-slate-950/50 border border-slate-700/80 rounded-xl px-5 py-4 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none appearance-none text-white hover:border-slate-600">
                                            <option value="" className="bg-slate-900">Select..</option>
                                            <option value="Detached" className="bg-slate-900">Detached</option>
                                            <option value="Semi-Detached" className="bg-slate-900">Semi-Detached</option>
                                            <option value="High-Rise" className="bg-slate-900">High-Rise</option>
                                            <option value="Low-Rise" className="bg-slate-900">Low-Rise</option>
                                            <option value="Duplex" className="bg-slate-900">Duplex</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-slate-300">Interior Condition</label>
                                    <div className="relative">
                                        <select name="interiorCondition" value={formData.interiorCondition} onChange={handleChange} className="w-full bg-slate-950/50 border border-slate-700/80 rounded-xl px-5 py-4 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none appearance-none text-white hover:border-slate-600">
                                            <option value="" className="bg-slate-900">Select..</option>
                                            <option value="New" className="bg-slate-900">New</option>
                                            <option value="Good" className="bg-slate-900">Good</option>
                                            <option value="Fair" className="bg-slate-900">Fair</option>
                                            <option value="Needs Renovation" className="bg-slate-900">Needs Renovation</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-slate-300">Furnishing</label>
                                    <div className="relative">
                                        <select name="furnishing" value={formData.furnishing} onChange={handleChange} className="w-full bg-slate-950/50 border border-slate-700/80 rounded-xl px-5 py-4 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none appearance-none text-white hover:border-slate-600">
                                            <option value="Unfurnished" className="bg-slate-900">Unfurnished</option>
                                            <option value="Semi-Furnished" className="bg-slate-900">Semi-Furnished</option>
                                            <option value="Furnished" className="bg-slate-900">Furnished</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4">
                                <label className="block text-lg font-bold mb-6 text-white">Features & Amenities</label>
                                <div className="space-y-8">
                                    {Object.entries(FEATURE_CATEGORIES).map(([category, features]) => (
                                        <div key={category} className="bg-slate-950/30 rounded-2xl p-5 border border-slate-800">
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-violet-400 mb-4 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                                                {category}
                                            </h3>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                {features.map(feature => (
                                                    <button
                                                        key={feature}
                                                        type="button"
                                                        onClick={() => toggleFeature(feature)}
                                                        className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-medium transition-all text-left duration-200 ${formData.features.includes(feature)
                                                            ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20 scale-[1.02] border border-violet-500'
                                                            : 'bg-slate-900/50 text-slate-400 border border-slate-800 hover:border-slate-600 hover:text-slate-200'
                                                            }`}
                                                    >
                                                        {formData.features.includes(feature) ? (
                                                            <Check className="w-3.5 h-3.5 shrink-0 text-white" />
                                                        ) : (
                                                            <div className="w-3.5 h-3.5 rounded-full border border-slate-600 shrink-0" />
                                                        )}
                                                        <span className="truncate">{feature}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4">
                                <label className="block text-sm font-medium mb-4 text-slate-300">Virtual Tour</label>
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-slate-400">Tour Type</label>
                                    <div className="relative">
                                        <select name="virtualTourType" value={formData.virtualTourType} onChange={handleChange} className="w-full bg-slate-950/50 border border-slate-700/80 rounded-xl px-5 py-4 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none appearance-none text-white hover:border-slate-600">
                                            <option value="No Virtual Tour" className="bg-slate-900">No Virtual Tour</option>
                                            <option value="3D Walkthrough" className="bg-slate-900">3D Walkthrough</option>
                                            <option value="Video Tour" className="bg-slate-900">Video Tour</option>
                                            <option value="Virtual Reality" className="bg-slate-900">Virtual Reality</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        </div>
                                    </div>
                                    {/* Virtual Tour URL Input */}
                                    {formData.virtualTourType !== 'No Virtual Tour' && (
                                        <div className="mt-4 animate-in fade-in zoom-in duration-300">
                                            <label className="block text-sm font-medium mb-2 text-slate-400">Virtual Tour URL</label>
                                            <input
                                                type="url"
                                                name="virtualTourUrl"
                                                value={formData.virtualTourUrl}
                                                onChange={handleChange}
                                                placeholder="https://my.matterport.com/show/?m=..."
                                                className="w-full bg-slate-950/50 border border-slate-700/80 rounded-xl px-5 py-4 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none transition-all text-white placeholder-slate-600 hover:border-slate-600"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-4">
                                <label className="block text-sm font-medium mb-4 text-slate-300">Photos (Coming Soon)</label>
                                <div className="border-2 border-dashed border-slate-800 bg-slate-950/30 rounded-2xl p-12 text-center hover:bg-slate-900/50 hover:border-violet-500/50 transition-all cursor-pointer group relative overflow-hidden">
                                    <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 border border-slate-800 group-hover:border-violet-500/30 z-10 relative">
                                        <ImageIcon className="w-8 h-8 text-slate-500 group-hover:text-violet-400 transition-colors" />
                                    </div>
                                    <p className="text-slate-400 font-medium z-10 relative group-hover:text-white transition-colors">Click to upload or drag and drop photos</p>
                                    <p className="text-xs text-slate-600 mt-2 z-10 relative">Up to 10 images, max 5MB each</p>

                                    {/* Hover Glow */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-violet-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-slate-950/30 backdrop-blur-sm px-8 py-6 border-t border-slate-800 flex justify-between items-center relative z-20">
                        <button
                            type="button"
                            onClick={() => step > 1 ? setStep(step - 1) : router.push('/properties')}
                            className="flex items-center gap-2 bg-slate-900 border border-slate-700 text-slate-300 px-6 py-3 rounded-xl font-bold hover:bg-slate-800 hover:text-white hover:border-slate-600 transition-all shadow-lg"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            {step > 1 ? 'Previous Step' : 'Cancel'}
                        </button>

                        {step < 3 ? (
                            <button
                                key="next-step-btn"
                                type="button"
                                onClick={() => setStep(step + 1)}
                                className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:from-violet-500 hover:to-indigo-500 hover:shadow-violet-500/25 transition-all shadow-lg shadow-violet-900/20 group relative overflow-hidden"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    Next Step
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </span>
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                            </button>
                        ) : (
                            <button
                                key="submit-listing-btn"
                                type="submit"
                                disabled={submitting}
                                className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-10 py-3 rounded-xl font-bold hover:from-emerald-500 hover:to-teal-500 transition-all disabled:opacity-50 shadow-lg shadow-emerald-900/20 group relative overflow-hidden border border-emerald-500/20"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    {submitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            Save Property
                                            <Check className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                        </>
                                    )}
                                </span>
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
