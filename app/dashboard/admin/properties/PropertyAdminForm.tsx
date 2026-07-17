'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updatePropertyAdmin } from '@/app/lib/actions/admin';
import { PROPERTY_TYPES, TRANSACTION_TYPES, PARTITIONING_TYPES, COMFORT_TYPES, BUILDING_TYPES, INTERIOR_CONDITIONS, FURNISHING_TYPES, PROPERTY_FEATURES, Property } from '@/app/lib/properties';
import { Loader2, Save, Camera, MapPin, Layout, DollarSign, Home, Briefcase, X, ArrowLeft, Move, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/app/lib/supabase/client';
import Link from 'next/link';
import { ROMANIAN_CITIES, TIMISOARA_AREAS } from '@/app/lib/constants/locations';
import SearchableSelect from '@/app/components/SearchableSelect';
import { getSystemLocations } from '@/app/lib/actions/admin-settings';

interface Props {
    initialData: Property;
    propertyId: string;
}

export default function PropertyAdminForm({ initialData, propertyId }: Props) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [images, setImages] = useState<string[]>(initialData.images || []);
    const [error, setError] = useState<string | null>(null);

    const [cityVal, setCityVal] = useState(initialData.location_city || '');
    const [areaVal, setAreaVal] = useState(initialData.location_area || '');

    const [citiesList, setCitiesList] = useState<string[]>(ROMANIAN_CITIES);
    const [areasList, setAreasList] = useState<string[]>(TIMISOARA_AREAS);

    useEffect(() => {
        getSystemLocations().then(res => {
            if (res.cities?.length) {
                setCitiesList(res.cities.map(c => c.name));
            }
            if (res.areas?.length) {
                setAreasList(res.areas.map(a => a.name));
            }
        });
    }, []);

    // Photo reordering states
    const [draggedPhotoIndex, setDraggedPhotoIndex] = useState<number | null>(null);
    const [hoveredPhotoIndex, setHoveredPhotoIndex] = useState<number | null>(null);

    // Initial check for features to populate checkboxes if needed, 
    // but for checkboxes we rely on defaultChecked logic or uncontrolled inputs
    // For React controlled state it's complex with so many fields, so we use uncontrolled (name attributes)
    // and rely on defaultValue. 
    // EXCEPT for features array.
    const [selectedFeatures, setSelectedFeatures] = useState<string[]>(initialData.features || []);

    const handleFeatureChange = (feature: string, checked: boolean) => {
        if (checked) {
            setSelectedFeatures(prev => [...prev, feature]);
        } else {
            setSelectedFeatures(prev => prev.filter(f => f !== feature));
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setUploading(true);
        const files = Array.from(e.target.files);
        const newUrls: string[] = [];

        try {
            for (const file of files) {
                const fileExt = file.name.split('.').pop();
                const fileName = `admin_${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
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
            setError('Failed to upload images.');
        } finally {
            setUploading(false);
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    // Photo drag-and-drop reordering handlers
    const handlePhotoDragStart = (e: React.DragEvent, index: number) => {
        setDraggedPhotoIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index.toString());
    };

    const handlePhotoDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedPhotoIndex === index) return;
        setHoveredPhotoIndex(index);
    };

    const handlePhotoDragLeave = (index: number) => {
        if (hoveredPhotoIndex === index) {
            setHoveredPhotoIndex(null);
        }
    };

    const handlePhotoDragEnd = () => {
        setDraggedPhotoIndex(null);
        setHoveredPhotoIndex(null);
    };

    const handlePhotoDrop = (e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();
        const dataTransferIndex = e.dataTransfer.getData('text/plain');
        const sourceIndex = dataTransferIndex !== '' ? parseInt(dataTransferIndex, 10) : draggedPhotoIndex;

        if (sourceIndex === null || isNaN(sourceIndex) || sourceIndex === targetIndex) return;

        const newImages = [...images];
        const [draggedImg] = newImages.splice(sourceIndex, 1);
        newImages.splice(targetIndex, 0, draggedImg);

        setImages(newImages);

        setDraggedPhotoIndex(null);
        setHoveredPhotoIndex(null);
    };

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError(null);

        try {
            // Append images manually
            formData.append('images', JSON.stringify(images));

            // Append features manually (since we track them to handle pre-flling)
            // Wait, formData automatically captures checked boxes? 
            // Yes, but we need to collate them into one JSON array 'features'.
            // The Action expects 'features' as JSON string.
            // Our previous Logic (AddPropertyForm) re-scanned inputs. Here we can use state.
            // But we also have special checkboxes.
            // Let's rely on the state `selectedFeatures` which we keep in sync.
            // ACTUALLY: The previous owner form manually checked `formData.get(feature)`
            // We should do the same consistency.

            // Collect all checked features
            const allFeatures: string[] = [];
            // Special checkboxes
            const featureList = ['commission_0', 'exclusive', 'luxury', 'hotel_regime', 'foreclosure'];
            for (const f of featureList) {
                if (formData.get(f) === 'on') allFeatures.push(f);
            }
            // Standard amenities
            for (const f of PROPERTY_FEATURES) {
                if (formData.get(f) === 'on') allFeatures.push(f);
            }

            formData.set('features', JSON.stringify(allFeatures));

            const result = await updatePropertyAdmin(propertyId, formData);

            if (result && result.error) {
                setError(result.error);
            } else {
                router.push('/dashboard/admin/properties');
                router.refresh();
            }
        } catch (err: any) {
            setError(err.message || 'Something went wrong.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <form action={handleSubmit} className="space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm font-bold">
                    {error}
                </div>
            )}

            <div className="flex justify-between">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Home className="w-5 h-5 text-blue-500" /> Basic Information
                </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Property Title</label>
                    <input name="title" required defaultValue={initialData.title} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Transaction Type</label>
                    <select name="listing_type" required defaultValue={initialData.listing_type} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                        {TRANSACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Property Type</label>
                    <select name="type" required defaultValue={initialData.type} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                        {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            </div>

            {/* Location */}
            <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2 border-t pt-6">
                    <MapPin className="w-5 h-5 text-red-500" /> Location
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">County</label>
                        <input name="location_county" required defaultValue={initialData.location_county} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">City</label>
                        <SearchableSelect
                            name="location_city"
                            required
                            value={cityVal}
                            options={citiesList}
                            onChange={(val) => setCityVal(val)}
                            placeholder="Type or select city..."
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Area</label>
                        <SearchableSelect
                            name="location_area"
                            value={areaVal}
                            options={areasList}
                            onChange={(val) => setAreaVal(val)}
                            placeholder="Type or select area..."
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                        />
                    </div>
                    <div className="col-span-1 md:col-span-3">
                        <label className="block text-sm font-bold text-slate-700 mb-1">Full Address</label>
                        <input name="address" defaultValue={initialData.address} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none" />
                    </div>
                </div>
            </div>

            {/* Pricing */}
            <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2 border-t pt-6">
                    <DollarSign className="w-5 h-5 text-emerald-500" /> Pricing
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Price</label>
                        <input type="number" name="price" required defaultValue={initialData.price} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Currency</label>
                        <select name="currency" defaultValue={initialData.currency} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none">
                            <option value="EUR">EUR</option>
                            <option value="USD">USD</option>
                            <option value="RON">RON</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Details */}
            <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2 border-t pt-6">
                    <Layout className="w-5 h-5 text-purple-500" /> Details
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Rooms</label>
                        <input type="number" name="rooms" defaultValue={initialData.rooms || ''} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Bedrooms</label>
                        <input type="number" name="bedrooms" defaultValue={initialData.bedrooms || ''} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Bathrooms</label>
                        <input type="number" name="bathrooms" defaultValue={initialData.bathrooms || ''} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Year Built</label>
                        <input type="number" name="year_built" defaultValue={initialData.year_built || ''} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Usable Area (sqm)</label>
                        <input type="number" name="area_usable" defaultValue={initialData.area_usable || ''} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Built Area (sqm)</label>
                        <input type="number" name="area_built" defaultValue={initialData.area_built || ''} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Floor</label>
                        <input type="number" name="floor" defaultValue={initialData.floor || ''} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Total Floors</label>
                        <input type="number" name="total_floors" defaultValue={initialData.total_floors || ''} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none" />
                    </div>

                    <div className="col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-1">Partitioning</label>
                        <select name="partitioning" defaultValue={initialData.partitioning || ''} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none">
                            <option value="">Select...</option>
                            {PARTITIONING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-1">Comfort</label>
                        <select name="comfort" defaultValue={initialData.comfort || ''} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none">
                            <option value="">Select...</option>
                            {COMFORT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>

                    <div className="col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-1">Building Type</label>
                        <select name="building_type" defaultValue={initialData.building_type || ''} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none">
                            <option value="">Select...</option>
                            {BUILDING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Condition</label>
                        <select name="interior_condition" defaultValue={initialData.interior_condition || ''} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none">
                            <option value="">Select...</option>
                            {INTERIOR_CONDITIONS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Furnishing</label>
                        <select name="furnishing" defaultValue={initialData.furnishing || ''} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none">
                            <option value="">Select...</option>
                            {FURNISHING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Images */}
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
                                {uploading ? 'Uploading...' : 'Click to add images'}
                            </span>
                        </div>
                    </label>
                </div>
                {images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {images.map((url, index) => (
                            <div
                                key={index}
                                draggable
                                onDragStart={(e) => handlePhotoDragStart(e, index)}
                                onDragOver={(e) => handlePhotoDragOver(e, index)}
                                onDragLeave={() => handlePhotoDragLeave(index)}
                                onDrop={(e) => handlePhotoDrop(e, index)}
                                onDragEnd={handlePhotoDragEnd}
                                className={`relative group aspect-square bg-slate-100 rounded-lg overflow-hidden border transition-all cursor-grab active:cursor-grabbing ${
                                    draggedPhotoIndex === index
                                        ? 'opacity-40 border-blue-500 scale-95'
                                        : hoveredPhotoIndex === index
                                            ? 'border-blue-500 scale-[1.03] shadow-lg shadow-blue-500/25'
                                            : 'border-slate-200 hover:border-slate-400'
                                }`}
                            >
                                <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover select-none pointer-events-none" />
                                
                                {/* Drag Hint Overlay */}
                                <div className="absolute top-1.5 left-1.5 bg-slate-900/80 text-slate-300 p-1 rounded-md opacity-100 md:opacity-0 md:group-hover:opacity-100 transition pointer-events-none" title="Drag to reorder">
                                    <Move size={12} />
                                </div>

                                {/* Move Left Button */}
                                {index > 0 && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const newImages = [...images];
                                            const temp = newImages[index];
                                            newImages[index] = newImages[index - 1];
                                            newImages[index - 1] = temp;
                                            setImages(newImages);
                                        }}
                                        className="absolute bottom-1.5 left-1.5 bg-slate-900/80 text-white p-1 rounded-md opacity-100 md:opacity-0 md:group-hover:opacity-100 transition hover:bg-slate-800"
                                        title="Move Left"
                                    >
                                        <ChevronLeft size={12} />
                                    </button>
                                )}

                                {/* Move Right Button */}
                                {index < images.length - 1 && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const newImages = [...images];
                                            const temp = newImages[index];
                                            newImages[index] = newImages[index + 1];
                                            newImages[index + 1] = temp;
                                            setImages(newImages);
                                        }}
                                        className="absolute bottom-1.5 right-1.5 bg-slate-900/80 text-white p-1 rounded-md opacity-100 md:opacity-0 md:group-hover:opacity-100 transition hover:bg-slate-800"
                                        title="Move Right"
                                    >
                                        <ChevronRight size={12} />
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeImage(index);
                                    }}
                                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition shadow-sm hover:bg-red-600"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Media URLs */}
            <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2 border-t pt-6">
                    <Camera className="w-5 h-5 text-pink-500" /> Media Links
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">YouTube URL</label>
                        <input name="youtube_video_url" defaultValue={initialData.youtube_video_url || ''} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Virtual Tour URL</label>
                        <input name="virtual_tour_url" defaultValue={initialData.virtual_tour_url || ''} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none" />
                    </div>
                </div>
            </div>

            {/* ID & Social */}
            <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2 border-t pt-6">
                    <Briefcase className="w-5 h-5 text-teal-500" /> Identification & Socials
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Social Media Link</label>
                        <input name="social_media_url" defaultValue={initialData.social_media_url || ''} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Property ID (External)</label>
                        <input name="personal_property_id" defaultValue={initialData.personal_property_id || ''} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none" />
                    </div>
                </div>
            </div>

            {/* Features */}
            <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2 border-t pt-6">
                    <Briefcase className="w-5 h-5 text-orange-500" /> Features
                </h3>

                <div className="flex flex-wrap gap-4 mb-4 pb-4 border-b border-gray-100">
                    <label className="flex items-center gap-2 cursor-pointer bg-blue-50 px-3 py-2 rounded-lg border border-blue-100 hover:bg-blue-100 transition">
                        <input type="checkbox" name="commission_0" defaultChecked={initialData.features?.includes('commission_0')} className="w-4 h-4 text-blue-600 rounded" />
                        <span className="text-blue-900 font-bold text-xs uppercase">0% Commission</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer bg-amber-50 px-3 py-2 rounded-lg border border-amber-100 hover:bg-amber-100 transition">
                        <input type="checkbox" name="exclusive" defaultChecked={initialData.features?.includes('exclusive')} className="w-4 h-4 text-amber-600 rounded" />
                        <span className="text-amber-900 font-bold text-xs uppercase">Exclusive</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer bg-purple-50 px-3 py-2 rounded-lg border border-purple-100 hover:bg-purple-100 transition">
                        <input type="checkbox" name="luxury" defaultChecked={initialData.features?.includes('luxury')} className="w-4 h-4 text-purple-600 rounded" />
                        <span className="text-purple-900 font-bold text-xs uppercase">Luxury</span>
                    </label>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {PROPERTY_FEATURES.map(feature => (
                        <label key={feature} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-50 rounded-lg transition">
                            <input type="checkbox" name={feature} defaultChecked={initialData.features?.includes(feature)} className="w-4 h-4 text-orange-600 rounded" />
                            <span className="text-slate-700 text-sm whitespace-nowrap">{feature}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Description */}
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                <textarea name="description" defaultValue={initialData.description || ''} rows={5} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none"></textarea>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                <Link href="/dashboard/admin/properties" className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition">Cancel</Link>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition flex items-center gap-2"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Save Changes
                </button>
            </div>

        </form>
    );
}
