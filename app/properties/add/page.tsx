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

const PROPERTY_TYPES = ['Apartment', 'House', 'Land', 'Commercial', 'Industrial', 'Business'];
const FEATURES = ['Pool', 'Gym', 'Smart Home', 'Wine Cellar', 'Theater', 'Marble Floors', 'Designer Kitchen', 'Concierge', 'Rooftop Terrace', 'Spa', 'Solar Panels', 'Garden', 'EV Charging'];

export default function AddPropertyPage() {
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
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        setSubmitting(false);
        setSuccess(true);
    };

    if (success) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-card p-8 rounded-2xl border border-border text-center shadow-xl">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Listing Submitted!</h1>
                    <p className="text-foreground/60 mb-8">
                        Your property listing has been successfully submitted and is under review by our agents.
                    </p>
                    <button
                        onClick={() => router.push('/properties')}
                        className="w-full bg-secondary text-white py-3 rounded-xl font-bold hover:bg-secondary/90 transition-all"
                    >
                        Back to Properties
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pt-24 pb-20">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Progress Header */}
                <div className="mb-12">
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-3xl font-bold">List Your Property</h1>
                        <span className="text-sm font-medium text-foreground/40">Step {step} of 3</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-secondary transition-all duration-500"
                            style={{ width: `${(step / 3) * 100}%` }}
                        />
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
                    {/* Step 1: Basic Information */}
                    {step === 1 && (
                        <div className="p-8 space-y-6">
                            <div className="flex items-center gap-3 mb-2 text-primary font-bold">
                                <Home className="w-5 h-5" />
                                <h2>Basic Information</h2>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5 opacity-70">Property Title</label>
                                    <input
                                        type="text"
                                        name="title"
                                        required
                                        value={formData.title}
                                        onChange={handleChange}
                                        placeholder="e.g., Luxury Modern Apartment in Downtown"
                                        className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1.5 opacity-70">Description</label>
                                    <textarea
                                        name="description"
                                        required
                                        rows={4}
                                        value={formData.description}
                                        onChange={handleChange}
                                        placeholder="Tell us more about the property..."
                                        className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition-all resize-none"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5 opacity-70">Property Type</label>
                                        <select
                                            name="propertyType"
                                            value={formData.propertyType}
                                            onChange={handleChange}
                                            className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-secondary outline-none"
                                        >
                                            {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5 opacity-70">Listing Type</label>
                                        <select
                                            name="listingType"
                                            value={formData.listingType}
                                            onChange={handleChange}
                                            className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-secondary outline-none"
                                        >
                                            <option value="For Sale">For Sale</option>
                                            <option value="For Rent">For Rent</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Location & Pricing */}
                    {step === 2 && (
                        <div className="p-8 space-y-6">
                            <div className="flex items-center gap-3 mb-2 text-primary font-bold">
                                <MapPin className="w-5 h-5" />
                                <h2>Location & Pricing</h2>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium mb-1.5 opacity-70">Price</label>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 font-bold">
                                                <DollarSign className="w-4 h-4" />
                                            </div>
                                            <input
                                                type="number"
                                                name="price"
                                                required
                                                value={formData.price}
                                                onChange={handleChange}
                                                placeholder="0.00"
                                                className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-secondary outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5 opacity-70">Currency</label>
                                        <select
                                            name="currency"
                                            value={formData.currency}
                                            onChange={handleChange}
                                            className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-secondary outline-none"
                                        >
                                            <option value="USD">USD ($)</option>
                                            <option value="EUR">EUR (€)</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1.5 opacity-70">Street Address</label>
                                    <input
                                        type="text"
                                        name="address"
                                        required
                                        value={formData.address}
                                        onChange={handleChange}
                                        className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-secondary outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5 opacity-70">City</label>
                                        <input type="text" name="city" required value={formData.city} onChange={handleChange} className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-secondary outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1.5 opacity-70">State</label>
                                        <input type="text" name="state" required value={formData.state} onChange={handleChange} className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-secondary outline-none" />
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-sm font-medium mb-1.5 opacity-70">ZIP Code</label>
                                        <input type="text" name="zip" required value={formData.zip} onChange={handleChange} className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-secondary outline-none" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Specifications & Features */}
                    {step === 3 && (
                        <div className="p-8 space-y-6">
                            <div className="flex items-center gap-3 mb-2 text-primary font-bold">
                                <Building2 className="w-5 h-5" />
                                <h2>Details & Features</h2>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5 opacity-70">Beds</label>
                                    <input type="number" name="beds" value={formData.beds} onChange={handleChange} className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-secondary outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5 opacity-70">Baths</label>
                                    <input type="number" name="baths" value={formData.baths} onChange={handleChange} className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-secondary outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5 opacity-70">Sqft</label>
                                    <input type="number" name="sqft" value={formData.sqft} onChange={handleChange} className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-secondary outline-none" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-6 opacity-70">Key Features</label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {FEATURES.map(feature => (
                                        <button
                                            key={feature}
                                            type="button"
                                            onClick={() => toggleFeature(feature)}
                                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${formData.features.includes(feature) ? 'bg-secondary/10 border-secondary text-secondary' : 'bg-background border-border text-foreground/60 hover:border-foreground/20'}`}
                                        >
                                            {formData.features.includes(feature) && <Check className="w-3.5 h-3.5" />}
                                            {feature}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4">
                                <label className="block text-sm font-medium mb-4 opacity-70">Photos (Coming Soon)</label>
                                <div className="border-2 border-dashed border-border rounded-2xl p-12 text-center hover:bg-gray-50 transition-colors cursor-pointer group">
                                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                        <ImageIcon className="w-6 h-6 text-foreground/40" />
                                    </div>
                                    <p className="text-sm text-foreground/40 font-medium">Click to upload or drag and drop photos</p>
                                    <p className="text-xs text-foreground/30 mt-1">Up to 10 images, max 5MB each</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="bg-gray-50 px-8 py-6 border-t border-border flex justify-between items-center">
                        <button
                            type="button"
                            onClick={() => step > 1 ? setStep(step - 1) : router.push('/properties')}
                            className="flex items-center gap-2 text-sm font-bold text-foreground/60 hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            {step > 1 ? 'Previous Step' : 'Cancel'}
                        </button>

                        {step < 3 ? (
                            <button
                                type="button"
                                onClick={() => setStep(step + 1)}
                                className="flex items-center gap-2 bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
                            >
                                Next Step
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex items-center gap-2 bg-secondary text-white px-10 py-3 rounded-xl font-bold hover:bg-secondary/90 transition-all disabled:opacity-50 shadow-lg shadow-secondary/20"
                            >
                                {submitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        Submit Listing
                                        <Check className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
