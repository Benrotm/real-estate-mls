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
    const [status, setStatus] = useState<'active' | 'draft'>('active');
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
            const submissionData = new FormData();
            const status = formData.get('status') as string || 'active';
            submissionData.append('status', status);

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

            if (formData.get('building_type')) submissionData.append('building_type', formData.get('building_type') as string);
            if (formData.get('interior_condition')) submissionData.append('interior_condition', formData.get('interior_condition') as string);
            if (formData.get('furnishing')) submissionData.append('furnishing', formData.get('furnishing') as string);
            if (formData.get('youtube_video_url')) submissionData.append('youtube_video_url', formData.get('youtube_video_url') as string);
            if (formData.get('virtual_tour_url')) submissionData.append('virtual_tour_url', formData.get('virtual_tour_url') as string);

            if (formData.get('description')) submissionData.append('description', formData.get('description') as string);
            if (formData.get('social_media_url')) submissionData.append('social_media_url', formData.get('social_media_url') as string);
            if (formData.get('personal_property_id')) submissionData.append('personal_property_id', formData.get('personal_property_id') as string);

            submissionData.append('images', JSON.stringify(images));

            const selectedFeatures: string[] = [];
            const featureList = ['has_video', 'has_virtual_tour', 'commission_0', 'exclusive', 'luxury', 'foreclosure'];
            for (const f of featureList) {
                if (formData.get(f) === 'on') selectedFeatures.push(f);
            }
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
            setError('Something went wrong.');
        } finally {
            setLoading(false);
        }
    }

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

            <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Home className="w-5 h-5 text-blue-500" /> Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-1">Property Title</label>
                        <input name="title" defaultValue={initialData?.title} required placeholder="Title" className="w-full p-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Transaction Type</label>
                        <select name="listing_type" defaultValue={initialData?.listing_type} required className="w-full p-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg outline-none">
                            {TRANSACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Property Type</label>
                        <select name="type" defaultValue={initialData?.type} required className="w-full p-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg outline-none">
                            {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2 border-t pt-6">
                    <MapPin className="w-5 h-5 text-red-500" /> Location
                </h3>
                <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                    <label className="block text-sm font-bold text-blue-900 mb-2">Search Address (Auto-fill)</label>
                    <AddressAutocomplete
                        onAddressSelect={(details) => {
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
                        <label className="block text-sm font-bold text-slate-700 mb-1">County</label>
                        <input name="location_county" defaultValue={initialData?.location_county} required className="w-full p-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">City</label>
                        <input name="location_city" defaultValue={initialData?.location_city} required className="w-full p-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Area</label>
                        <input name="location_area" defaultValue={initialData?.location_area} className="w-full p-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg outline-none" />
                    </div>
                    <div className="col-span-1 md:col-span-3">
                        <label className="block text-sm font-bold text-slate-700 mb-1">Full Address</label>
                        <input name="address" defaultValue={initialData?.address} className="w-full p-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg outline-none" />
                    </div>
                </div>
                <div className="col-span-1 md:col-span-3">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Pin Location</label>
                    <LocationMap
                        lat={coordinates.lat}
                        lng={coordinates.lng}
                        onLocationSelect={(lat, lng) => setCoordinates({ lat, lng })}
                    />
                    <input type="hidden" name="latitude" value={coordinates.lat} />
                    <input type="hidden" name="longitude" value={coordinates.lng} />
                </div>
            </div>

            <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2 border-t pt-6">
                    <DollarSign className="w-5 h-5 text-emerald-500" /> Pricing
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Price</label>
                        <input type="number" name="price" defaultValue={initialData?.price} required className="w-full p-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Currency</label>
                        <select name="currency" defaultValue={initialData?.currency} className="w-full p-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg outline-none">
                            <option value="EUR">EUR</option>
                            <option value="USD">USD</option>
                            <option value="RON">RON</option>
                        </select>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2 border-t pt-6">
                    <Layout className="w-5 h-5 text-purple-500" /> Details & Specs
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div><label className="block text-sm font-bold text-slate-700 mb-1">Rooms</label><input type="number" name="rooms" defaultValue={initialData?.rooms ?? ''} className="w-full p-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg outline-none" /></div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-1">Bedrooms</label><input type="number" name="bedrooms" defaultValue={initialData?.bedrooms ?? ''} className="w-full p-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg outline-none" /></div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-1">Bathrooms</label><input type="number" name="bathrooms" defaultValue={initialData?.bathrooms ?? ''} className="w-full p-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg outline-none" /></div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-1">Year Built</label><input type="number" name="year_built" defaultValue={initialData?.year_built ?? ''} className="w-full p-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg outline-none" /></div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-1">Usable Area</label><input type="number" name="area_usable" defaultValue={initialData?.area_usable ?? ''} className="w-full p-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg outline-none" /></div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-1">Built Area</label><input type="number" name="area_built" defaultValue={initialData?.area_built ?? ''} className="w-full p-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg outline-none" /></div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-1">Floor</label><input type="number" name="floor" defaultValue={initialData?.floor ?? ''} className="w-full p-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg outline-none" /></div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-1">Total Floors</label><input type="number" name="total_floors" defaultValue={initialData?.total_floors ?? ''} className="w-full p-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg outline-none" /></div>
                    <div className="col-span-2"><label className="block text-sm font-bold text-slate-700 mb-1">Partitioning</label><select name="partitioning" defaultValue={initialData?.partitioning} className="w-full p-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg outline-none"><option value="">Select...</option>{PARTITIONING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                    <div className="col-span-2"><label className="block text-sm font-bold text-slate-700 mb-1">Comfort</label><select name="comfort" defaultValue={initialData?.comfort} className="w-full p-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg outline-none"><option value="">Select...</option>{COMFORT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                    <div className="col-span-2"><label className="block text-sm font-bold text-slate-700 mb-1">Building Type</label><select name="building_type" defaultValue={initialData?.building_type} className="w-full p-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg outline-none"><option value="">Select...</option>{BUILDING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-1">Interior</label><select name="interior_condition" defaultValue={initialData?.interior_condition} className="w-full p-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg outline-none"><option value="">Select...</option>{INTERIOR_CONDITIONS.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-1">Furnishing</label><select name="furnishing" defaultValue={initialData?.furnishing} className="w-full p-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg outline-none"><option value="">Select...</option>{FURNISHING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2 border-t pt-6">
                    <Camera className="w-5 h-5 text-indigo-500" /> Property Images
                </h3>
                <div className="mb-4">
                    <label className="block w-full cursor-pointer bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:bg-slate-100 transition">
                        <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                        <div className="flex flex-col items-center gap-2">
                            {uploading ? <Loader2 className="w-8 h-8 text-blue-500 animate-spin" /> : <Camera className="w-8 h-8 text-slate-400" />}
                            <span className="text-sm font-medium text-slate-600">{uploading ? 'Uploading...' : 'Click to upload'}</span>
                        </div>
                    </label>
                </div>
                {images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {images.map((url, index) => (
                            <div key={index} className="relative group aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                                <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                                <button type="button" onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition shadow-sm"><X className="w-3 h-3" /></button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2 border-t pt-6">
                    <Camera className="w-5 h-5 text-pink-500" /> Media Links
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label className="block text-sm font-bold text-slate-700 mb-1">YouTube Video</label><input name="youtube_video_url" defaultValue={initialData?.youtube_video_url} className="w-full p-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg outline-none" /></div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-1">Virtual Tour</label><input name="virtual_tour_url" defaultValue={initialData?.virtual_tour_url} className="w-full p-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg outline-none" /></div>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2 border-t pt-6">
                    <Layout className="w-5 h-5 text-gray-500" /> Internal Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label className="block text-sm font-bold text-slate-700 mb-1">Social Media Listing URL</label><input name="social_media_url" defaultValue={initialData?.social_media_url} className="w-full p-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg outline-none" placeholder="Facebook/Instagram Post URL" /></div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-1">Personal / Internal ID</label><input name="personal_property_id" defaultValue={initialData?.personal_property_id} className="w-full p-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg outline-none" placeholder="Optional internal reference" /></div>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2 border-t pt-6">
                    <Briefcase className="w-5 h-5 text-orange-500" /> Features
                </h3>
                <div className="flex flex-wrap gap-4 mb-4 pb-4 border-b border-gray-100">
                    {['commission_0', 'exclusive', 'luxury'].map(f => (
                        <label key={f} className="flex items-center gap-2 cursor-pointer bg-blue-50 px-3 py-2 rounded-lg border border-blue-100">
                            <input type="checkbox" name={f} defaultChecked={hasFeature(f)} className="w-4 h-4 text-blue-600 rounded" />
                            <span className="text-blue-900 font-bold text-xs uppercase">{f.replace('_', ' ')}</span>
                        </label>
                    ))}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {PROPERTY_FEATURES.map(feature => (
                        <label key={feature} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-50 rounded-lg transition">
                            <input type="checkbox" name={feature} defaultChecked={hasFeature(feature)} className="w-4 h-4 text-orange-600 rounded border-gray-300" />
                            <span className="text-slate-700 text-sm whitespace-nowrap">{feature}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                <textarea name="description" defaultValue={initialData?.description} rows={5} className="w-full p-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg outline-none"></textarea>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => router.back()} className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition">Cancel</button>

                <button type="submit" disabled={loading} name="status" value="draft" className="px-6 py-3 rounded-xl font-bold text-slate-700 bg-white border-2 border-slate-200 hover:bg-slate-50 transition flex items-center gap-2">
                    {loading && status === 'draft' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Save Draft
                </button>

                <button type="submit" disabled={loading} name="status" value="active" className="px-6 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition flex items-center gap-2">
                    {loading && status === 'active' ? <Loader2 className="w-5 h-5 animate-spin" /> : (isEditing ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />)}
                    {isEditing ? 'Update & Publish' : 'Publish Property'}
                </button>
            </div>
        </form >
    );
}
