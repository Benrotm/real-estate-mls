'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createProperty, updateProperty } from '@/app/lib/actions/properties';
import { PROPERTY_TYPES, TRANSACTION_TYPES, PARTITIONING_TYPES, COMFORT_TYPES, BUILDING_TYPES, INTERIOR_CONDITIONS, FURNISHING_TYPES, PROPERTY_FEATURES, Property } from '@/app/lib/properties';
import { Loader2, Plus, Camera, MapPin, Layout, DollarSign, Home, Briefcase, Trash2, X, Save } from 'lucide-react';
import { supabase } from '@/app/lib/supabase/client';
import AddressAutocomplete from '@/app/components/AddressAutocomplete';
import LocationMap from '@/app/components/LocationMap';

export default function AddPropertyForm({ initialData }: { initialData?: Partial<Property> }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [images, setImages] = useState<string[]>(initialData?.images || []);
    const [error, setError] = useState<string | null>(null);
    const [coordinates, setCoordinates] = useState({
        lat: initialData?.latitude || 44.4268, // Default to Bucharest
        lng: initialData?.longitude || 26.1025
    });

    const isEditing = !!(initialData && initialData.id);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setUploading(true);
        const files = Array.from(e.target.files);
        const newUrls: string[] = [];

        try {
            for (const file of files) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
                const filePath = `listings/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('property-images')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('property-images')
                    .getPublicUrl(filePath);

                newUrls.push(publicUrl);
            }

            setImages(prev => [...prev, ...newUrls]);
        } catch (err: any) {
            console.error('Upload failed:', err);
            setError('Failed to upload images. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError(null);

        try {
            // Prepare FormData for server action
            const submissionData = new FormData();

            // Map and Append Fields (similar to public form)
            submissionData.append('title', formData.get('title') as string);
            submissionData.append('listing_type', formData.get('listing_type') as string);
            submissionData.append('type', formData.get('type') as string);
            submissionData.append('price', formData.get('price') as string);
            submissionData.append('currency', formData.get('currency') as string);

            submissionData.append('location_county', formData.get('location_county') as string);
            submissionData.append('location_city', formData.get('location_city') as string);
            submissionData.append('location_area', formData.get('location_area') as string);
            submissionData.append('address', formData.get('address') as string);

            if (formData.get('rooms')) submissionData.append('rooms', formData.get('rooms') as string);
            if (formData.get('bedrooms')) submissionData.append('bedrooms', formData.get('bedrooms') as string);
            if (formData.get('bathrooms')) submissionData.append('bathrooms', formData.get('bathrooms') as string);
            if (formData.get('year_built')) submissionData.append('year_built', formData.get('year_built') as string);
            if (formData.get('area_usable')) submissionData.append('area_usable', formData.get('area_usable') as string);
            if (formData.get('area_built')) submissionData.append('area_built', formData.get('area_built') as string);
            if (formData.get('floor')) submissionData.append('floor', formData.get('floor') as string);
            if (formData.get('total_floors')) submissionData.append('total_floors', formData.get('total_floors') as string);

            if (formData.get('partitioning')) submissionData.append('partitioning', formData.get('partitioning') as string);
            if (formData.get('comfort')) submissionData.append('comfort', formData.get('comfort') as string);

            // New Fields
            if (formData.get('building_type')) submissionData.append('building_type', formData.get('building_type') as string);
            if (formData.get('interior_condition')) submissionData.append('interior_condition', formData.get('interior_condition') as string);
            if (formData.get('furnishing')) submissionData.append('furnishing', formData.get('furnishing') as string);
            if (formData.get('youtube_video_url')) submissionData.append('youtube_video_url', formData.get('youtube_video_url') as string);
            if (formData.get('virtual_tour_url')) submissionData.append('virtual_tour_url', formData.get('virtual_tour_url') as string);

            if (formData.get('description')) submissionData.append('description', formData.get('description') as string);

            // New Fields - Social and ID
            if (formData.get('social_media_url')) submissionData.append('social_media_url', formData.get('social_media_url') as string);
            if (formData.get('personal_property_id')) submissionData.append('personal_property_id', formData.get('personal_property_id') as string);

            // Images
            submissionData.append('images', JSON.stringify(images));

            // Collect Features
            const selectedFeatures: string[] = [];
            // Special checkboxes
            const featureList = ['has_video', 'has_virtual_tour', 'commission_0', 'exclusive', 'luxury', 'foreclosure'];
            for (const f of featureList) {
                if (formData.get(f) === 'on') selectedFeatures.push(f);
            }
            // Standard amenities
            for (const f of PROPERTY_FEATURES) {
                if (formData.get(f) === 'on') selectedFeatures.push(f);
            }

            submissionData.append('features', JSON.stringify(selectedFeatures));

            let result;
            if (isEditing && initialData?.id) {
                result = await updateProperty(initialData.id, submissionData);
            } else {
                result = await createProperty(submissionData);
            }

            if (result.error) {
                setError(result.error);
            } else {
                router.push('/dashboard/owner/properties');
                router.refresh();
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    // Helper to check features
    const hasFeature = (feature: string) => {
        return initialData?.features?.includes(feature);
    };

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
                        <input name="title" defaultValue={initialData?.title} required placeholder="e.g. Modern Apartment in City Center" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Transaction Type</label>
                        <select name="listing_type" defaultValue={initialData?.listing_type} required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                            {TRANSACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Property Type</label>
                        <select name="type" defaultValue={initialData?.type} required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
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

                <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                    <label className="block text-sm font-bold text-blue-900 mb-2">Search Address (Auto-fill)</label>
                    <AddressAutocomplete
                        onAddressSelect={(details) => {
                            // Helper to set value of input by name
                            const setVal = (name: string, val: string) => {
                                const input = document.querySelector(`input[name="${name}"]`) as HTMLInputElement;
                                if (input) input.value = val;
                            };

                            setVal('address', details.formattedAddress);
                            setVal('location_city', details.city);
                            setVal('location_county', details.county);
                            setVal('location_area', details.area);

                            setCoordinates({ lat: details.lat, lng: details.lng });
                        }}
                        currentAddress={initialData?.address}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">County (Judet)</label>
                        <input name="location_county" defaultValue={initialData?.location_county} required placeholder="e.g. Ilfov" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outlines-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">City (Localitate)</label>
                        <input name="location_city" defaultValue={initialData?.location_city} required placeholder="e.g. Bucuresti" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outlines-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Area (Zona)</label>
                        <input name="location_area" defaultValue={initialData?.location_area} placeholder="e.g. Pipera" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outlines-none" />
                    </div>
                    <div className="col-span-1 md:col-span-3">
                        <label className="block text-sm font-bold text-slate-700 mb-1">Full Address</label>
                        <input name="address" defaultValue={initialData?.address} placeholder="Street Name, Number, etc." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outlines-none" />
                    </div>
                </div>

                {/* Map Section */}
                <div className="col-span-1 md:col-span-3">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Pin Location on Map</label>
                    <LocationMap
                        lat={coordinates.lat}
                        lng={coordinates.lng}
                        onLocationSelect={(lat, lng) => setCoordinates({ lat, lng })}
                    />
                    <input type="hidden" name="latitude" value={coordinates.lat} />
                    <input type="hidden" name="longitude" value={coordinates.lng} />
                    <p className="text-xs text-slate-500 mt-2">Drag the marker to refine the exact location.</p>
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
                        <input type="number" name="price" defaultValue={initialData?.price} required placeholder="0.00" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outlines-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Currency</label>
                        <select name="currency" defaultValue={initialData?.currency} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outlines-none">
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
                        <input type="number" name="rooms" defaultValue={initialData?.rooms ?? ''} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outlines-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Bedrooms</label>
                        <input type="number" name="bedrooms" defaultValue={initialData?.bedrooms ?? ''} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outlines-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Bathrooms</label>
                        <input type="number" name="bathrooms" defaultValue={initialData?.bathrooms ?? ''} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outlines-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Year Built</label>
                        <input type="number" name="year_built" defaultValue={initialData?.year_built ?? ''} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outlines-none" />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Usable Area (sqm)</label>
                        <input type="number" name="area_usable" defaultValue={initialData?.area_usable ?? ''} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outlines-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Built Area (sqm)</label>
                        <input type="number" name="area_built" defaultValue={initialData?.area_built ?? ''} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outlines-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Floor</label>
                        <input type="number" name="floor" defaultValue={initialData?.floor ?? ''} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outlines-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Total Floors</label>
                        <input type="number" name="total_floors" defaultValue={initialData?.total_floors ?? ''} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outlines-none" />
                    </div>

                    <div className="col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-1">Partitioning</label>
                        <select name="partitioning" defaultValue={initialData?.partitioning} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outlines-none">
                            <option value="">Select...</option>
                            {PARTITIONING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-1">Comfort</label>
                        <select name="comfort" defaultValue={initialData?.comfort} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outlines-none">
                            <option value="">Select...</option>
                            {COMFORT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>

                    {/* NEW FIELDS */}
                    <div className="col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-1">Building Type</label>
                        <select name="building_type" defaultValue={initialData?.building_type} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outlines-none">
                            <option value="">Select...</option>
                            {BUILDING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Interior Condition</label>
                        <select name="interior_condition" defaultValue={initialData?.interior_condition} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outlines-none">
                            <option value="">Select...</option>
                            {INTERIOR_CONDITIONS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Furnishing</label>
                        <select name="furnishing" defaultValue={initialData?.furnishing} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outlines-none">
                            <option value="">Select...</option>
                            {FURNISHING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Section: Images */}
            <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2 border-t pt-6">
                    <Camera className="w-5 h-5 text-indigo-500" /> Property Images
                </h3>

                <div className="mb-4">
                    <label className="block w-full cursor-pointer bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:bg-slate-100 transition">
                        <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                        <div className="flex flex-col items-center gap-2">
                            {uploading ? (
                                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                            ) : (
                                <Camera className="w-8 h-8 text-slate-400" />
                            )}
                            <span className="text-sm font-medium text-slate-600">
                                {uploading ? 'Uploading...' : 'Click to upload property specific images'}
                            </span>
                            <span className="text-xs text-slate-400">JPG, PNG supported</span>
                        </div>
                    </label>
                </div>

                {/* Image Previews */}
                {
                    images.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {images.map((url, index) => (
                                <div key={index} className="relative group aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                                    <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition shadow-sm"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )
                }
            </div >

            {/* Section 4.5: Media URLs */}
            < div >
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2 border-t pt-6">
                    <Camera className="w-5 h-5 text-pink-500" /> Media Links
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">YouTube Video URL</label>
                        <input name="youtube_video_url" defaultValue={initialData?.youtube_video_url} placeholder="https://youtube.com/watch?v=..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outlines-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Virtual Tour URL (Matterport/etc)</label>
                        <input name="virtual_tour_url" defaultValue={initialData?.virtual_tour_url} placeholder="https://my.matterport.com/show/?m=..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outlines-none" />
                    </div>
                </div>
            </div >

            {/* Section Identification */}
            < div >
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2 border-t pt-6">
                    <Briefcase className="w-5 h-5 text-teal-500" /> Identification & Socials
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Social Media Link (e.g. Instagram Post)</label>
                        <input name="social_media_url" defaultValue={initialData?.social_media_url} placeholder="https://instagram.com/p/..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outlines-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Personal Website Property ID</label>
                        <input name="personal_property_id" defaultValue={initialData?.personal_property_id} placeholder="e.g. PROP-1234" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outlines-none" />
                    </div>
                </div>
            </div >

            {/* Section 5: Features Checkboxes */}
            < div >
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2 border-t pt-6">
                    <Briefcase className="w-5 h-5 text-orange-500" /> Features & Amenities
                </h3>

                {/* Special Tags */}
                <div className="flex flex-wrap gap-4 mb-4 pb-4 border-b border-gray-100">
                    <label className="flex items-center gap-2 cursor-pointer bg-blue-50 px-3 py-2 rounded-lg border border-blue-100 hover:bg-blue-100 transition">
                        <input type="checkbox" name="commission_0" defaultChecked={hasFeature('commission_0')} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                        <span className="text-blue-900 font-bold text-xs uppercase">0% Commission</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer bg-amber-50 px-3 py-2 rounded-lg border border-amber-100 hover:bg-amber-100 transition">
                        <input type="checkbox" name="exclusive" defaultChecked={hasFeature('exclusive')} className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500" />
                        <span className="text-amber-900 font-bold text-xs uppercase">Exclusive</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer bg-purple-50 px-3 py-2 rounded-lg border border-purple-100 hover:bg-purple-100 transition">
                        <input type="checkbox" name="luxury" defaultChecked={hasFeature('luxury')} className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500" />
                        <span className="text-purple-900 font-bold text-xs uppercase">Luxury</span>
                    </label>
                </div>

                {/* Standard Amenities */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {PROPERTY_FEATURES.map(feature => (
                        <label key={feature} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-50 rounded-lg transition">
                            <input type="checkbox" name={feature} defaultChecked={hasFeature(feature)} className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500 border-gray-300" />
                            <span className="text-slate-700 text-sm whitespace-nowrap">{feature}</span>
                        </label>
                    ))}
                </div>
            </div >

            {/* Description */}
            < div >
                <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                <textarea name="description" defaultValue={initialData?.description} rows={5} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outlines-none"></textarea>
            </div >

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => router.back()} className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition">Cancel</button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition flex items-center gap-2"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isEditing ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />)}
                    {isEditing ? 'Update Listing' : 'Create Listing'}
                </button>
            </div>
        </form >
    );
}
