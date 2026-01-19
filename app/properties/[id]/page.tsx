import { MOCK_PROPERTIES, Property } from "@/app/lib/properties";
import Link from 'next/link';
import { ArrowLeft, Bed, Bath, Ruler, Calendar, MapPin, Check, Lock } from 'lucide-react';
import { notFound } from 'next/navigation';
import PropertyMap from '../../components/PropertyMap';
import ValuationWidget from '../../components/ValuationWidget';
import ContactForm from '../../components/ContactForm';
import { supabase } from "@/app/lib/supabase";

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
            listingType: dbProperty.listing_type,
            currency: dbProperty.currency,
            title: dbProperty.title,
            description: dbProperty.description,
            location: {
                address: dbProperty.address,
                city: dbProperty.city,
                state: dbProperty.state,
                zip: dbProperty.zip,
                lat: dbProperty.lat,
                lng: dbProperty.lng
            },
            price: dbProperty.price,
            specs: {
                beds: dbProperty.beds,
                baths: dbProperty.baths,
                sqft: dbProperty.sqft,
                yearBuilt: dbProperty.year_built,
                type: dbProperty.property_type,
                stories: dbProperty.stories,
                floor: dbProperty.floor,
                interiorRating: dbProperty.interior_rating
            },
            features: dbProperty.features || [],
            images: dbProperty.images || [],
            agent: {
                id: dbProperty.agent_id || 'a1',
                name: 'Sarah Broker', // Hardcoded for demo until agents table exists
                image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                phone: '(555) 123-4567'
            },
            virtualTourUrl: dbProperty.virtual_tour_url,
            isFeatured: dbProperty.is_featured,
            valuation: {
                estimatedPrice: dbProperty.price * 0.98, // Mock valuation logic
                confidence: 92,
                lastUpdated: new Date().toISOString()
            }
        };
    } else {
        // Fallback to mock data for demo
        property = MOCK_PROPERTIES.find(p => p.id === id);
    }

    if (!property) {
        return notFound();
    }

    const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: property.currency || 'USD', maximumFractionDigits: 0 });

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

            {/* Hero Images - Kept simple but visually impressive */}
            <div className="h-[50vh] md:h-[60vh] relative z-0 grid grid-cols-1 md:grid-cols-2 gap-1 text-slate-800 overflow-hidden">
                <img src={property.images[0]} className="w-full h-full object-cover" alt="Main View" />
                <div className="hidden md:grid grid-rows-2 gap-1">
                    <img src={property.images[1] || property.images[0]} className="w-full h-full object-cover" alt="Secondary View" />
                    <div className="relative">
                        <img src={property.images[0]} className="w-full h-full object-cover opacity-80" alt="More" />
                        <button className="absolute inset-0 m-auto bg-white/90 text-slate-900 px-6 py-2 h-fit w-fit rounded-lg font-bold shadow-lg hover:scale-105 transition-transform">
                            View All Photos
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-10">

                    {/* NEW Reference Design Implementation */}
                    <div>
                        {/* 1. Badges Row */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {property.listingType === 'For Sale' ? (
                                <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-md uppercase tracking-wide">
                                    For Sale
                                </span>
                            ) : (
                                <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-md uppercase tracking-wide">
                                    For Rent
                                </span>
                            )}

                            <span className="bg-white border border-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-md uppercase tracking-wide">
                                {property.specs.type}
                            </span>

                            {property.isFeatured && (
                                <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-md uppercase tracking-wide">
                                    Featured
                                </span>
                            )}
                        </div>

                        {/* 2. Title & Location */}
                        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-3 leading-tight">
                            {property.title}
                        </h1>
                        <div className="flex items-center text-slate-500 mb-6 text-lg">
                            <MapPin className="w-5 h-5 mr-2 stroke-2" />
                            {property.location.address}, {property.location.city}, {property.location.state} {property.location.zip}
                        </div>

                        {/* 3. Price */}
                        <div className="text-5xl font-extrabold text-slate-900 mb-8">
                            {formatter.format(property.price)}
                            {property.listingType === 'For Rent' && <span className="text-2xl font-normal text-slate-400">/mo</span>}
                        </div>

                        {/* 4. Specs Widget */}
                        <div className="border border-slate-200 rounded-2xl p-6 flex flex-wrap gap-8 items-center bg-white shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
                                    <Bed className="w-7 h-7" />
                                </div>
                                <div className="leading-tight">
                                    <div className="font-extrabold text-2xl text-slate-900">{property.specs.beds}</div>
                                    <div className="text-slate-500 font-bold text-sm">Bedrooms</div>
                                </div>
                            </div>

                            <div className="w-px h-12 bg-slate-100 hidden sm:block"></div>

                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                                    <Bath className="w-7 h-7" />
                                </div>
                                <div className="leading-tight">
                                    <div className="font-extrabold text-2xl text-slate-900">{property.specs.baths}</div>
                                    <div className="text-slate-500 font-bold text-sm">Bathrooms</div>
                                </div>
                            </div>

                            <div className="w-px h-12 bg-slate-100 hidden sm:block"></div>

                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                                    <Ruler className="w-7 h-7" />
                                </div>
                                <div className="leading-tight">
                                    <div className="font-extrabold text-2xl text-slate-900">{formatter.format(property.specs.sqft || 0).replace('$', '')}</div>
                                    <div className="text-slate-500 font-bold text-sm">Sq Ft</div>
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

                    {/* Virtual Tour */}
                    <div className="space-y-4">
                        <div className="bg-zinc-950 rounded-2xl overflow-hidden shadow-2xl">
                            <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex justify-between items-center">
                                <h3 className="text-white font-bold flex items-center gap-2">
                                    🎥 360° Virtual Tour
                                </h3>
                                <span className="text-xs text-zinc-400">Interactive Walkthrough</span>
                            </div>
                            <div className="w-full h-[400px] bg-zinc-800 flex items-center justify-center relative group cursor-pointer hover:bg-zinc-700 transition-colors">
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                        <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[18px] border-l-white border-b-[10px] border-b-transparent ml-1"></div>
                                    </div>
                                    <p className="text-zinc-300 font-medium">Start Virtual Tour</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Valuation Widget */}
                    <ValuationWidget property={property} />

                    {/* Location Map */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-slate-900">Location</h2>
                        <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                            <PropertyMap
                                center={{ lat: property.location.lat, lng: property.location.lng }}
                                zoom={15}
                                markers={[{ id: property.id, lat: property.location.lat, lng: property.location.lng, title: property.title }]}
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
                            <img src={property.agent.image} alt={property.agent.name} className="w-16 h-16 rounded-full object-cover border-2 border-slate-200" />
                            <div>
                                <div className="font-bold text-slate-900 text-lg">{property.agent.name}</div>
                                <div className="text-sm text-slate-500 font-medium">Senior Realtor</div>
                            </div>
                        </div>

                        <ContactForm
                            propertyTitle={property.title}
                            propertyAddress={`${property.location.address}, ${property.location.city}, ${property.location.state}`}
                            agentName={property.agent.name}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
