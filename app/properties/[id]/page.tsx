import { MOCK_PROPERTIES, Property } from "@/app/lib/properties";
import Link from 'next/link';
import { ArrowLeft, Bed, Bath, Expand, Calendar, MapPin, Phone, Lock, Send } from 'lucide-react';
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
        <div className="min-h-screen pb-20">
            {/* Breadcrumb / Back */}
            <div className="bg-card border-b border-border">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <Link href="/properties" className="flex items-center gap-2 text-sm text-foreground/60 hover:text-primary transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to Properties
                    </Link>
                </div>
            </div>

            {/* Hero Images */}
            <div className="h-[50vh] md:h-[60vh] relative z-0 grid grid-cols-1 md:grid-cols-2 gap-1 text-slate-800 overflow-hidden">
                <img src={property.images[0]} className="w-full h-full object-cover" alt="Main View" />
                <div className="hidden md:grid grid-rows-2 gap-1">
                    <img src={property.images[1] || property.images[0]} className="w-full h-full object-cover" alt="Secondary View" />
                    <div className="relative">
                        <img src={property.images[0]} className="w-full h-full object-cover opacity-80" alt="More" />
                        <button className="absolute inset-0 m-auto bg-white/90 text-primary px-6 py-2 h-fit w-fit rounded-lg font-bold shadow-lg hover:scale-105 transition-transform">
                            View All Photos
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-10">

                    {/* Header */}
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h1 className="text-3xl font-bold text-foreground mb-2">{property.title}</h1>
                                <div className="flex items-center text-foreground/60">
                                    <MapPin className="w-4 h-4 mr-1" />
                                    {property.location.address}, {property.location.city}, {property.location.state} {property.location.zip}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-bold text-primary">
                                    {formatter.format(property.price)}
                                    {property.listingType === 'For Rent' && <span className="text-lg font-normal text-muted-foreground">/mo</span>}
                                </div>
                                <div className="text-sm text-zinc-500">{property.listingType}</div>
                            </div>
                        </div>

                        <div className="flex gap-6 border-y border-border py-4 text-foreground/80">
                            <div className="flex items-center gap-2">
                                <Bed className="w-5 h-5 text-secondary" />
                                <span className="font-semibold">{property.specs.beds}</span> Beds
                            </div>
                            <div className="flex items-center gap-2">
                                <Bath className="w-5 h-5 text-secondary" />
                                <span className="font-semibold">{property.specs.baths}</span> Baths
                            </div>
                            <div className="flex items-center gap-2">
                                <Expand className="w-5 h-5 text-secondary" />
                                <span className="font-semibold">{property.specs.sqft}</span> Sqft
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-secondary" />
                                Built <span className="font-semibold">{property.specs.yearBuilt}</span>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <h2 className="text-xl font-bold mb-4">About this home</h2>
                        <p className="text-foreground/70 leading-relaxed text-lg">
                            {property.description}
                        </p>
                    </div>

                    {/* Valuation Widget */}
                    <ValuationWidget property={property} />

                    {/* Virtual Tour */}
                    <div className="bg-zinc-950 rounded-2xl overflow-hidden shadow-2xl">
                        <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex justify-between items-center">
                            <h3 className="text-white font-bold flex items-center gap-2">
                                🎥 360° Virtual Tour
                            </h3>
                            <span className="text-xs text-zinc-400">Interactive Walkthrough</span>
                        </div>
                        {/* Placeholder for Iframe / WebGL Viewer */}
                        <div className="w-full h-[400px] bg-zinc-800 flex items-center justify-center relative group cursor-pointer hover:bg-zinc-700 transition-colors">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                    <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[18px] border-l-white border-b-[10px] border-b-transparent ml-1"></div>
                                </div>
                                <p className="text-zinc-300 font-medium">Start Virtual Tour</p>
                            </div>
                        </div>
                    </div>

                    {/* Location Map */}
                    <div>
                        <h2 className="text-xl font-bold mb-4">Location</h2>
                        <PropertyMap
                            center={{ lat: property.location.lat, lng: property.location.lng }}
                            zoom={15}
                            markers={[{ id: property.id, lat: property.location.lat, lng: property.location.lng, title: property.title }]}
                            height="400px"
                        />
                        <div className="mt-2 text-sm text-foreground/60 flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {property.location.address}, {property.location.city}, {property.location.state} {property.location.zip}
                        </div>
                    </div>

                    {/* Price Evaluation Section */}
                    <div className="bg-gradient-to-br from-primary/5 to-secondary/10 border border-secondary/20 rounded-2xl p-8" id="valuation">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    AI Price Valuation
                                    <span className="bg-secondary text-white text-xs px-2 py-0.5 rounded-full">BETA</span>
                                </h2>
                                <p className="text-foreground/60 text-sm mt-1">Based on floor, amenities, location, and interior quality.</p>
                            </div>
                            {/* Demo Toggle for Reviewers */}
                            <div className="flex items-center gap-2 bg-white/50 px-3 py-1 rounded-full border border-border">
                                <span className="text-xs font-medium uppercase text-foreground/50">Demo View:</span>
                                <div className="flex gap-1">
                                    <Link href="?user=free#valuation" className="text-xs px-2 py-1 bg-gray-200 rounded hover:bg-gray-300">Free</Link>
                                    <Link href="?user=paid#valuation" className="text-xs px-2 py-1 bg-secondary text-white rounded hover:bg-secondary/90">Paid</Link>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                            {/* Lock Overlay for Free Users */}
                            {/* Check for "user=paid" query param or default to locked if not specified for demo */}
                            {(typeof window === 'undefined' || !window.location.search.includes('user=paid')) && (
                                <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-4 rounded-xl border border-white/20">
                                    <div className="w-12 h-12 bg-secondary/10 text-secondary rounded-full flex items-center justify-center mb-4">
                                        <Lock className="w-6 h-6" />
                                    </div>
                                    <h4 className="font-bold text-lg mb-2">Unlock Premium Insights</h4>
                                    <p className="text-sm text-foreground/60 max-w-xs mb-6">
                                        Detailed price valuations and market confidence scores are available for Paid Plans, Agents, and Owners.
                                    </p>
                                    <button className="bg-primary text-white px-6 py-2 rounded-full font-medium hover:bg-primary/90 transition-transform hover:scale-105 shadow-lg">
                                        Upgrade to Pro
                                    </button>
                                </div>
                            )}

                            <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                                <div className="text-sm text-foreground/60 mb-2 font-medium uppercase tracking-wider">Estimated Market Value</div>
                                <div className="text-4xl font-bold text-primary mb-2">
                                    {formatter.format(property.valuation?.estimatedPrice || property.price)}
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-md">▲ 2.4%</span>
                                    <span className="text-foreground/40">vs last month</span>
                                </div>
                            </div>

                            <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                                <div className="text-sm text-foreground/60 mb-2 font-medium uppercase tracking-wider">Confidence Score</div>
                                <div className="text-4xl font-bold text-secondary mb-2">
                                    {property.valuation?.confidence}%
                                </div>
                                <div className="text-sm text-foreground/40">
                                    High confidence based on <span className="text-foreground/80 font-bold">{property.features.length} comparable points</span> including floor, view, and recent sales.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Agent */}
                <div className="lg:col-span-1">
                    <div className="bg-card border border-border rounded-xl p-6 shadow-lg sticky top-24 z-0">
                        <h3 className="text-lg font-bold mb-4">Property Contact</h3>
                        <div className="flex items-center gap-4 mb-6">
                            <img src={property.agent.image} alt={property.agent.name} className="w-16 h-16 rounded-full object-cover border-2 border-secondary" />
                            <div>
                                <div className="font-bold">{property.agent.name}</div>
                                <div className="text-sm text-foreground/60">Senior Realtor</div>
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
