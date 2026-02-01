import { MOCK_PROPERTIES, Property } from "@/app/lib/properties";
import Link from 'next/link';
import { ArrowLeft, Bed, Bath, Ruler, Calendar, MapPin, Check, Lock, Award } from 'lucide-react';
import { notFound } from 'next/navigation';
import PropertyMap from '../../components/PropertyMap';
import ValuationWidget from '../../components/ValuationWidget';
import ContactForm from '../../components/ContactForm';
import { supabase } from "@/app/lib/supabase/client";

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // 1. Try to fetch from Supabase
    const { data: dbProperty, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();

    let property: Property | undefined;

    if (dbProperty) {
        // Map DB fields to Frontend Interface
        property = {
            id: dbProperty.id,
            listing_type: dbProperty.listing_type,
            currency: dbProperty.currency,
            title: dbProperty.title,
            description: dbProperty.description,

            // Location
            address: dbProperty.address,
            location_city: dbProperty.location_city,
            location_county: dbProperty.location_county,
            location_area: dbProperty.location_area,
            latitude: dbProperty.latitude,
            longitude: dbProperty.longitude,

            price: dbProperty.price,

            // Specs
            bedrooms: dbProperty.bedrooms,
            bathrooms: dbProperty.bathrooms,
            area_usable: dbProperty.area_usable,
            area_built: dbProperty.area_built,
            year_built: dbProperty.year_built,

            type: dbProperty.type,
            floor: dbProperty.floor,
            total_floors: dbProperty.total_floors,

            partitioning: dbProperty.partitioning,
            comfort: dbProperty.comfort,

            building_type: dbProperty.building_type,
            interior_condition: dbProperty.interior_condition,
            furnishing: dbProperty.furnishing,

            features: dbProperty.features || [],
            images: dbProperty.images || [],
            owner_id: dbProperty.owner_id,

            video_url: dbProperty.video_url, // Legacy
            youtube_video_url: dbProperty.youtube_video_url, // New
            virtual_tour_url: dbProperty.virtual_tour_url,

            social_media_url: dbProperty.social_media_url,
            personal_property_id: dbProperty.personal_property_id,

            promoted: dbProperty.promoted,

            status: dbProperty.status,
            score: dbProperty.score,
            created_at: dbProperty.created_at,
            updated_at: dbProperty.updated_at
        };
    } else {
        // Fallback to mock data for demo
        property = MOCK_PROPERTIES.find(p => p.id === id);
    }

    if (!property) {
        return notFound();
    }

    const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: property.currency || 'USD', maximumFractionDigits: 0 });

    // Mock Agent for display (since not in Property interface)
    const agent = {
        name: 'Sarah Broker',
        image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    };

    return (
        <div className="min-h-screen pb-20 bg-gray-50">
            {/* Breadcrumb / Back */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <Link href="/properties" className="flex items-center gap-2 text-sm text-gray-500 hover:text-slate-900 transition-colors font-medium">
                        <ArrowLeft className="w-4 h-4" /> Back to Properties
                    </Link>
                </div>
            </div>

            {/* Hero Images - Dynamic Grid */}
            <div className="h-[50vh] md:h-[60vh] relative z-0 grid grid-cols-1 md:grid-cols-2 gap-1 text-slate-800 overflow-hidden">
                <img src={property.images[0] || '/placeholder.jpg'} className="w-full h-full object-cover" alt="Main View" />
                <div className="hidden md:grid grid-rows-2 gap-1">
                    <img src={property.images[1] || property.images[0] || '/placeholder.jpg'} className="w-full h-full object-cover" alt="Secondary View" />
                    <div className="relative">
                        <img src={property.images[2] || property.images[0] || '/placeholder.jpg'} className="w-full h-full object-cover opacity-80" alt="More" />
                        {property.images.length > 3 && (
                            <button className="absolute inset-0 m-auto bg-white/90 text-slate-900 px-6 py-2 h-fit w-fit rounded-lg font-bold shadow-lg hover:scale-105 transition-transform">
                                View All {property.images.length} Photos
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-10">

                    {/* Info Header */}
                    <div>
                        {/* 1. Badges Row */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {property.listing_type === 'For Sale' ? (
                                <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-md uppercase tracking-wide">
                                    For Sale
                                </span>
                            ) : property.listing_type === 'Hotel Regime' ? (
                                <span className="bg-purple-600 text-white text-xs font-bold px-3 py-1.5 rounded-md uppercase tracking-wide">
                                    Hotel Regime
                                </span>
                            ) : (
                                <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-md uppercase tracking-wide">
                                    For Rent
                                </span>
                            )}

                            <span className="bg-white border border-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-md uppercase tracking-wide">
                                {property.type}
                            </span>

                            {property.promoted && (
                                <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-md uppercase tracking-wide">
                                    Promoted
                                </span>
                            )}

                            {(property.score !== undefined && property.score > 0) && (
                                <span className={`text-white text-xs font-bold px-3 py-1.5 rounded-md uppercase tracking-wide flex items-center gap-1 ${property.score >= 80 ? 'bg-red-600' :
                                    property.score >= 50 ? 'bg-orange-500' : 'bg-slate-500'
                                    }`}>
                                    <Award className="w-3 h-3" /> Quality Score: {property.score}
                                </span>
                            )}
                        </div>

                        {/* 2. Title & Location */}
                        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-3 leading-tight">
                            {property.title}
                        </h1>
                        <div className="flex items-center text-slate-500 mb-6 text-lg">
                            <MapPin className="w-5 h-5 mr-2 stroke-2" />
                            {property.address}, {property.location_city}, {property.location_county}
                        </div>

                        {/* 3. Price */}
                        <div className="text-5xl font-extrabold text-slate-900 mb-8">
                            {formatter.format(property.price)}
                            {property.listing_type === 'For Rent' && <span className="text-2xl font-normal text-slate-400">/mo</span>}
                            {property.listing_type === 'Hotel Regime' && <span className="text-2xl font-normal text-slate-400">/night</span>}
                        </div>

                        {/* 4. Specs Widget */}
                        <div className="border border-slate-200 rounded-2xl p-6 flex flex-wrap gap-8 items-center bg-white shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
                                    <Bed className="w-7 h-7" />
                                </div>
                                <div className="leading-tight">
                                    <div className="font-extrabold text-2xl text-slate-900">{property.bedrooms || 0}</div>
                                    <div className="text-slate-500 font-bold text-sm">Bedrooms</div>
                                </div>
                            </div>

                            <div className="w-px h-12 bg-slate-100 hidden sm:block"></div>

                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                                    <Bath className="w-7 h-7" />
                                </div>
                                <div className="leading-tight">
                                    <div className="font-extrabold text-2xl text-slate-900">{property.bathrooms || 0}</div>
                                    <div className="text-slate-500 font-bold text-sm">Bathrooms</div>
                                </div>
                            </div>

                            <div className="w-px h-12 bg-slate-100 hidden sm:block"></div>

                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                                    <Ruler className="w-7 h-7" />
                                </div>
                                <div className="leading-tight">
                                    <div className="font-extrabold text-2xl text-slate-900">{formatter.format(property.area_usable || 0).replace('$', '')}</div>
                                    <div className="text-slate-500 font-bold text-sm">Sq m</div>
                                </div>
                            </div>
                        </div>

                        {/* Additional Details Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Partitioning</div>
                                <div className="text-slate-900 font-bold">{property.partitioning || 'N/A'}</div>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Comfort</div>
                                <div className="text-slate-900 font-bold">{property.comfort || 'N/A'}</div>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Building</div>
                                <div className="text-slate-900 font-bold">{property.building_type || 'N/A'}</div>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Condition</div>
                                <div className="text-slate-900 font-bold">{property.interior_condition || 'N/A'}</div>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Furnishing</div>
                                <div className="text-slate-900 font-bold">{property.furnishing || 'N/A'}</div>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Year Built</div>
                                <div className="text-slate-900 font-bold">{property.year_built || 'N/A'}</div>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Floors</div>
                                <div className="text-slate-900 font-bold">
                                    {property.floor ? `Flr ${property.floor}` : ''}
                                    {property.floor && property.total_floors ? ' / ' : ''}
                                    {property.total_floors ? `${property.total_floors} Tot` : 'N/A'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 5. Description */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-slate-900">Description</h2>
                        <div className="border border-slate-200 rounded-2xl p-8 bg-white shadow-sm">
                            <p className="text-slate-600 leading-relaxed text-lg">
                                {property.description}
                            </p>
                        </div>
                    </div>

                    {/* 6. Features & Amenities */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-slate-900">Features & Amenities</h2>
                        <div className="border border-slate-200 rounded-2xl p-8 bg-white shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                                {property.features.map((feature, i) => (
                                    <div key={i} className="flex items-center gap-3 text-slate-600 group">
                                        <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                                            <Check className="w-3 h-3 text-orange-600 stroke-[3]" />
                                        </div>
                                        <span className="group-hover:text-slate-900 transition-colors font-medium">{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Media: Video & Virtual Tour */}
                    {(property.youtube_video_url || property.virtual_tour_url) && (
                        <div className="space-y-4">
                            <h2 className="text-2xl font-bold text-slate-900">Media & Tours</h2>

                            {property.youtube_video_url && (
                                <div className="bg-black rounded-2xl overflow-hidden shadow-lg aspect-video">
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        src={property.youtube_video_url.replace('watch?v=', 'embed/')}
                                        title="Property Video"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    ></iframe>
                                </div>
                            )}

                            {property.virtual_tour_url && (
                                <div className="bg-zinc-950 rounded-2xl overflow-hidden shadow-2xl mt-6">
                                    <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex justify-between items-center">
                                        <h3 className="text-white font-bold flex items-center gap-2">
                                            🎥 360° Virtual Tour
                                        </h3>
                                        <span className="text-xs text-zinc-400">Interactive Walkthrough</span>
                                    </div>
                                    <div className="w-full h-[400px]">
                                        <iframe
                                            src={property.virtual_tour_url}
                                            width="100%"
                                            height="100%"
                                            frameBorder="0"
                                            allowFullScreen
                                        ></iframe>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Valuation Widget */}
                    <ValuationWidget property={property} />

                    {/* Location Map */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-slate-900">Location</h2>
                        <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                            <PropertyMap
                                center={{ lat: property.latitude || 44.4, lng: property.longitude || 26.1 }}
                                zoom={15}
                                markers={[{ id: property.id, lat: property.latitude || 44.4, lng: property.longitude || 26.1, title: property.title }]}
                                height="400px"
                            />
                        </div>
                    </div>
                </div>

                {/* Sidebar Agent */}
                <div className="lg:col-span-1">
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-lg sticky top-24 z-0">
                        <h3 className="text-xl font-bold mb-6 text-slate-900">Contact</h3>
                        <div className="flex items-center gap-4 mb-6">
                            <img src={agent.image} alt={agent.name} className="w-16 h-16 rounded-full object-cover border-2 border-slate-200" />
                            <div>
                                <div className="font-bold text-slate-900 text-lg">{agent.name}</div>
                                <div className="text-sm text-slate-500 font-medium">Senior Realtor</div>
                            </div>
                        </div>

                        {/* Social & ID */}
                        {(property.personal_property_id || property.social_media_url) && (
                            <div className="mb-6 space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-100">
                                {property.personal_property_id && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500 font-medium">Property ID:</span>
                                        <span className="font-mono font-bold text-slate-900 bg-white px-2 py-1 rounded border border-slate-200">{property.personal_property_id}</span>
                                    </div>
                                )}
                                {property.social_media_url && (
                                    <div className="pt-2 border-t border-slate-200">
                                        <a
                                            href={property.social_media_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-2 rounded-lg hover:opacity-90 transition shadow-sm"
                                        >
                                            View on Social Media
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}

                        <ContactForm
                            propertyTitle={property.title}
                            propertyAddress={`${property.address}, ${property.location_city}`}
                            agentName={agent.name}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
