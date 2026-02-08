import { MOCK_PROPERTIES, Property } from "@/app/lib/properties";
import { checkUserFeatureAccess, SYSTEM_FEATURES } from '@/app/lib/auth/features';

export const dynamic = 'force-dynamic';
import PropertyCarousel from '../../components/properties/PropertyCarousel';
import Link from 'next/link';
import { ArrowLeft, Bed, Bath, Ruler, Calendar, MapPin, Check, Lock, Award, Home, Maximize2, Box, Trees, Sun, Facebook, Instagram, Linkedin, Twitter, Youtube, ExternalLink, FileText, Star } from 'lucide-react';
import { notFound } from 'next/navigation';
import PropertyMap from '../../components/PropertyMap';

import PropertyFeatures from '@/app/components/PropertyFeatures';
import ContactForm from '../../components/ContactForm';
import OpenHouseWidget from '@/app/components/events/OpenHouseWidget';
import PropertyValuationSection from '@/app/components/valuation/PropertyValuationSection';
import ShareButton from '@/app/components/property/ShareButton';
import { supabase } from "@/app/lib/supabase/client";
import PropertyAnalyticsWidget from '@/app/components/analytics/PropertyAnalyticsWidget';
import PropertyViewTracker from '@/app/components/analytics/PropertyViewTracker';
import { getPropertyAnalytics } from '@/app/lib/actions/propertyAnalytics';

function getYouTubeEmbedUrl(url: string) {
    if (!url) return '';

    // Extract Video ID using Regex
    // Supports:
    // - youtube.com/watch?v=ID
    // - youtu.be/ID
    // - youtube.com/embed/ID
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);

    if (match && match[2].length === 11) {
        return `https://www.youtube.com/embed/${match[2]}`;
    }

    // Fallback if regex fails but it might be an embed link already
    return url;
}

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
            rooms: dbProperty.rooms,
            bedrooms: dbProperty.bedrooms,
            bathrooms: dbProperty.bathrooms,
            area_usable: dbProperty.area_usable,
            area_built: dbProperty.area_built,
            area_box: dbProperty.area_box,
            area_terrace: dbProperty.area_terrace,
            area_garden: dbProperty.area_garden,
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
            updated_at: dbProperty.updated_at,
            friendly_id: dbProperty.friendly_id,

            // Private
            private_notes: dbProperty.private_notes,
            documents: dbProperty.documents
        };
    } else {
        // Fallback to mock data for demo
        property = MOCK_PROPERTIES.find(p => p.id === id);
    }

    if (!property) {
        return notFound();
    }

    const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: property.currency || 'USD', maximumFractionDigits: 0 });

    // 2. Fetch Owner Profile
    let ownerProfile = null;
    if (property && property.owner_id) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, role, avatar_url, phone, email')
            .eq('id', property.owner_id)
            .single();
        ownerProfile = profile;
    }

    // 3. Fetch Current User & Check Access
    const { data: { user } } = await supabase.auth.getUser();
    let hasAccess = false;
    let canViewContact = false;

    if (user) {
        if (property.owner_id === user.id) {
            hasAccess = true;
            canViewContact = true; // Owner can always view their own contact info
        } else {
            // Check if admin
            const { data: currentUserProfile } = await supabase
                .from('profiles')
                .select('role, plan_tier')
                .eq('id', user.id)
                .single();

            if (currentUserProfile?.role === 'admin' || currentUserProfile?.role === 'superadmin') {
                hasAccess = true;
                canViewContact = true;
            }

            // Check Plan Feature for Contact View
            if (!hasAccess && currentUserProfile) {
                const { data: feature } = await supabase
                    .from('plan_features')
                    .select('is_included')
                    .eq('role', currentUserProfile.role)
                    .eq('plan_name', currentUserProfile.plan_tier)
                    .eq('feature_key', 'view_owner_contact')
                    .single();

                if (feature?.is_included) {
                    canViewContact = true;
                }
            }
        }
    }

    // Agent / Owner Display Data
    const agent = {
        name: ownerProfile?.full_name || 'Property Owner',
        image: ownerProfile?.avatar_url || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        role: ownerProfile?.role ? (ownerProfile.role.charAt(0).toUpperCase() + ownerProfile.role.slice(1)) : 'Realtor',
        phone: ownerProfile?.phone,
        email: ownerProfile?.email
    };

    // Check Feature Access for specific components
    const showMakeOffer = await checkUserFeatureAccess(property.owner_id, SYSTEM_FEATURES.MAKE_AN_OFFER);
    const showVirtualTour = await checkUserFeatureAccess(property.owner_id, SYSTEM_FEATURES.VIRTUAL_TOUR);

    // Fetch Property Events (Open House)
    const { data: propertyEvents } = await supabase
        .from('property_events')
        .select('*')
        .eq('property_id', property.id)
        .order('start_time', { ascending: true });

    // Fetch Property Analytics
    const analytics = await getPropertyAnalytics(property.id);

    return (
        <div className="min-h-screen pb-20 bg-gray-50">
            {/* Track Page View */}
            <PropertyViewTracker propertyId={property.id} />

            {/* Breadcrumb / Back */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <Link href="/properties" className="flex items-center gap-2 text-sm text-gray-500 hover:text-slate-900 transition-colors font-medium">
                        <ArrowLeft className="w-4 h-4" /> Back to Properties
                    </Link>
                </div>
            </div>

            {/* Private Info Section (Owner/Admin/Premium) */}
            {(hasAccess || canViewContact) && (
                <div className="bg-slate-900 text-white border-b border-violet-500/30">
                    <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-violet-600/20 rounded-xl border border-violet-500/30 shrink-0">
                                <Lock className="w-6 h-6 text-violet-400" />
                            </div>
                            <div className="space-y-4 flex-1">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h2 className="text-xl font-bold text-white">Private Information</h2>
                                        <span className="bg-violet-600 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">
                                            {property.owner_id === user?.id ? 'Owner View' : hasAccess ? 'Admin View' : 'Premium View'}
                                        </span>
                                    </div>
                                    <p className="text-slate-400 text-sm">
                                        {hasAccess ? 'This section contains private notes, documents, and contact info.' : 'You have access to view private owner contact details.'}
                                    </p>
                                </div>

                                {/* Owner Contact (Visible if canViewContact) */}
                                {canViewContact && (property.owner_name || property.owner_phone) && (
                                    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {property.owner_name && (
                                            <div>
                                                <div className="text-xs font-bold text-slate-500 uppercase mb-1">Owner Name</div>
                                                <div className="text-lg font-bold text-white">{property.owner_name}</div>
                                            </div>
                                        )}
                                        {property.owner_phone && (
                                            <div>
                                                <div className="text-xs font-bold text-slate-500 uppercase mb-1">Owner Phone</div>
                                                <div className="text-lg font-bold text-white font-mono">{property.owner_phone}</div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Notes & Docs (Restricted to Owner/Admin) */}
                                {hasAccess && property.private_notes && (
                                    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                                        <div className="text-xs font-bold text-slate-500 uppercase mb-2">Private Notes</div>
                                        <p className="text-slate-200 whitespace-pre-wrap">{property.private_notes}</p>
                                    </div>
                                )}

                                {hasAccess && property.documents && property.documents.length > 0 && (
                                    <div>
                                        <div className="text-xs font-bold text-slate-500 uppercase mb-3">Private Documents</div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {property.documents.map((doc, i) => (
                                                <a
                                                    key={i}
                                                    href={doc}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-3 bg-slate-800/80 border border-slate-700/80 p-3 rounded-lg hover:bg-slate-700 transition group"
                                                >
                                                    <div className="w-8 h-8 bg-slate-700 rounded flex items-center justify-center text-slate-400 group-hover:text-white group-hover:bg-slate-600 transition-colors">
                                                        <FileText className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-sm text-slate-300 truncate font-medium group-hover:text-white transition-colors">
                                                        {doc.split('/').pop() || doc}
                                                    </span>
                                                    <ExternalLink className="w-3 h-3 text-slate-500 ml-auto" />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {/* Hero Images - Property Carousel */}
            <PropertyCarousel images={property.images} title={property.title} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-10">

                    {/* MARKET INSIGHTS (Valuation) - Moved to Top */}


                    {/* Info Header */}
                    <div>
                        {/* 1. Badges Row */}
                        <div className="flex flex-wrap items-center gap-3">
                            {property.listing_type === 'For Sale' ? (
                                <span className="bg-purple-600 text-white text-xs font-bold px-3 py-1.5 rounded-md uppercase tracking-wide">
                                    For Sale
                                </span>
                            ) : (
                                <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-md uppercase tracking-wide">
                                    For Rent
                                </span>
                            )}

                            <span className="bg-white border border-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-md uppercase tracking-wide">
                                {property.type}
                            </span>

                            {property.promoted && (
                                <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-md uppercase tracking-wide flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-white" /> Featured
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

                        {/* 2. Title & Share */}
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2 leading-tight">
                                    {property.title}
                                </h1>
                                <div className="leading-tight">
                                    <div className="font-extrabold text-2xl text-slate-900">{formatter.format(property.area_usable || 0).replace('$', '')}</div>
                                    <div className="text-slate-500 font-bold text-sm">Sq m</div>
                                </div>
                            </div>

                            {/* Share Button */}
                            <ShareButton
                                propertyId={property.id}
                                title={property.title}
                                description={`Check out ${property.title} on Imobum!`}
                                className="shrink-0"
                            />
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

                    {/* Areas & Measurements */}
                    <div className="mt-8">
                        <h3 className="text-lg font-bold text-slate-900 mb-4">Areas & Measurements</h3>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-center gap-3">
                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-slate-500 shadow-sm">
                                    <Maximize2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-slate-400 uppercase">Built Area</div>
                                    <div className="font-bold text-slate-900">{property.area_built ? `${property.area_built} m²` : 'N/A'}</div>
                                </div>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-center gap-3">
                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-slate-500 shadow-sm">
                                    <Sun className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-slate-400 uppercase">Terrace/Balcony</div>
                                    <div className="font-bold text-slate-900">{property.area_terrace ? `${property.area_terrace} m²` : 'N/A'}</div>
                                </div>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-center gap-3">
                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-slate-500 shadow-sm">
                                    <Trees className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-slate-400 uppercase">Garden</div>
                                    <div className="font-bold text-slate-900">{property.area_garden ? `${property.area_garden} m²` : 'N/A'}</div>
                                </div>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-center gap-3">
                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-slate-500 shadow-sm">
                                    <Box className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-slate-400 uppercase">Box/Storage</div>
                                    <div className="font-bold text-slate-900">{property.area_box ? `${property.area_box} m²` : 'N/A'}</div>
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

                    {/* Open House Events - After Description */}
                    {propertyEvents && propertyEvents.length > 0 && (
                        <div className="space-y-4">
                            <OpenHouseWidget
                                events={propertyEvents}
                                propertyTitle={property.title}
                                propertyAddress={`${property.address}, ${property.location_city}`}
                            />
                        </div>
                    )}

                    {/* 6. Features & Amenities - Organized by Category */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-slate-900">Features & Amenities</h2>
                        <div className="space-y-6">
                            {/* Category-based Feature Display */}
                            {(() => {
                                const FEATURE_CATEGORIES: Record<string, string[]> = {
                                    'Listing Tags': ['Commission 0%', 'Exclusive', 'Foreclosure', 'Hotel Regime', 'Luxury'],
                                    'Unit Features': ['Air Conditioning', 'Balcony', 'Central Heating', 'Fireplace', 'Garage', 'Jacuzzi', 'Laundry', 'Parking', 'Private Pool', 'Sauna', 'Storage'],
                                    'Community & Recreation': ['Amphitheatre', 'Clubhouse', 'Common Garden', 'Jogging Track', 'Library', 'Park', 'Party Hall', 'Playground'],
                                    'Sports & Fitness': ['Basketball Court', 'Football Field', 'Gym', 'Squash Court', 'Swimming Pool', 'Tennis Court', 'Yoga Deck'],
                                    'Security & Safety': ['24/7 Security', 'CCTV Surveillance', 'Fire Safety', 'Gated Community', 'Intercom', 'Shelter', 'Video Door Phone'],
                                    'Sustainability & Services': ['Concierge', 'Elevator', 'Green Building', 'Maintenance Staff', 'Power Backup', 'Rainwater Harvesting', 'Sewage Treatment', 'Smart Home', 'Solar Panels', 'Visitor Parking']
                                };

                                const CATEGORY_COLORS: Record<string, { bg: string, border: string, iconBg: string, iconColor: string }> = {
                                    'Listing Tags': { bg: 'bg-indigo-50', border: 'border-indigo-200', iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600' },
                                    'Unit Features': { bg: 'bg-violet-50', border: 'border-violet-200', iconBg: 'bg-violet-100', iconColor: 'text-violet-600' },
                                    'Community & Recreation': { bg: 'bg-emerald-50', border: 'border-emerald-200', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
                                    'Sports & Fitness': { bg: 'bg-orange-50', border: 'border-orange-200', iconBg: 'bg-orange-100', iconColor: 'text-orange-600' },
                                    'Security & Safety': { bg: 'bg-red-50', border: 'border-red-200', iconBg: 'bg-red-100', iconColor: 'text-red-600' },
                                    'Sustainability & Services': { bg: 'bg-teal-50', border: 'border-teal-200', iconBg: 'bg-teal-100', iconColor: 'text-teal-600' }
                                };

                                return Object.entries(FEATURE_CATEGORIES).map(([category, categoryFeatures]) => {
                                    const matchedFeatures = categoryFeatures.filter(f => property.features.includes(f));
                                    if (matchedFeatures.length === 0) return null;

                                    const colors = CATEGORY_COLORS[category] || { bg: 'bg-slate-50', border: 'border-slate-200', iconBg: 'bg-slate-100', iconColor: 'text-slate-600' };

                                    return (
                                        <div key={category} className={`border ${colors.border} rounded-2xl p-6 ${colors.bg}`}>
                                            <h3 className="text-lg font-bold text-slate-800 mb-4">{category}</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {matchedFeatures.map((feature, i) => (
                                                    <div key={i} className="flex items-center gap-3 text-slate-700">
                                                        <div className={`w-6 h-6 rounded-full ${colors.iconBg} flex items-center justify-center shrink-0`}>
                                                            <Check className={`w-3.5 h-3.5 ${colors.iconColor} stroke-[3]`} />
                                                        </div>
                                                        <span className="font-medium">{feature}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </div>

                    {/* Platform Features / Upsell Section */}
                    <div className="py-2">
                        <PropertyFeatures
                            propertyId={property.id}
                            ownerId={property.owner_id}
                            features={{
                                makeOffer: showMakeOffer,
                                virtualTour: !!(showVirtualTour && property.virtual_tour_url),
                                directMessage: false
                            }}
                        />
                    </div>

                    {/* Media: Video & Virtual Tour */}
                    {(property.youtube_video_url || property.video_url || property.virtual_tour_url) && (
                        <div className="space-y-4">
                            <h2 className="text-2xl font-bold text-slate-900">Media & Tours</h2>

                            {property.youtube_video_url && (
                                <div className="bg-black rounded-2xl overflow-hidden shadow-lg aspect-video">
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        src={getYouTubeEmbedUrl(property.youtube_video_url)}
                                        title="Property Video"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    ></iframe>
                                </div>
                            )}

                            {property.video_url && (
                                <div className="bg-black rounded-2xl overflow-hidden shadow-lg aspect-video mt-6">
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        src={getYouTubeEmbedUrl(property.video_url)}
                                        title="Property Video / Tour"
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
                                    <div className="w-full h-[400px] relative">
                                        {!showVirtualTour ? (
                                            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10 backdrop-blur-sm">
                                                <div className="text-center p-6">
                                                    <Lock className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                                                    <h3 className="text-xl font-bold text-white mb-2">Virtual Tour Locked</h3>
                                                    <p className="text-slate-400 max-w-xs mx-auto">
                                                        This property has a virtual tour, but the owner's plan does not include this feature.
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <iframe
                                                src={property.virtual_tour_url}
                                                width="100%"
                                                height="100%"
                                                frameBorder="0"
                                                allowFullScreen
                                                className="w-full h-full"
                                            ></iframe>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Social Media Widget */}
                            {property.social_media_url && (
                                <div className="pt-2 border-t border-slate-200">
                                    <a
                                        href={property.social_media_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition shadow-sm"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        Visit Social Media
                                    </a>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Property Map */}
                    <div className="mt-10">
                        <h2 className="text-2xl font-bold text-slate-900 mb-6">Location</h2>
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm h-[400px]">
                            <PropertyMap
                                center={{ lat: property.latitude || 44.4268, lng: property.longitude || 26.1025 }}
                                zoom={15}
                                markers={[
                                    {
                                        id: property.id,
                                        lat: property.latitude || 44.4268,
                                        lng: property.longitude || 26.1025,
                                        title: property.title
                                    }
                                ]}
                            />
                        </div>
                    </div>

                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Property Insights Widget */}
                    <PropertyAnalyticsWidget
                        views={analytics.views}
                        favorites={analytics.favorites}
                        inquiries={analytics.inquiries}
                        offers={analytics.offers}
                        shares={analytics.shares}
                        createdAt={analytics.createdAt}
                    />

                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-lg sticky top-24 z-0">
                        <h3 className="text-xl font-bold mb-6 text-slate-900">Contact</h3>
                        <div className="flex items-center gap-4 mb-6">
                            <img src={agent.image} alt={agent.name} className="w-16 h-16 rounded-full object-cover border-2 border-slate-200" />
                            <div>
                                <div className="font-bold text-slate-900 text-lg">{agent.name}</div>
                                <div className="text-sm text-slate-500 font-medium">{agent.role}</div>
                            </div>
                        </div>

                        {(property.personal_property_id || property.social_media_url || property.friendly_id) && (
                            <div className="mb-6 space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-100">
                                {property.friendly_id && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500 font-medium">Ref ID:</span>
                                        <span className="font-mono font-bold text-slate-900 bg-white px-2 py-1 rounded border border-slate-200">#{property.friendly_id}</span>
                                    </div>
                                )}
                                {property.personal_property_id && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500 font-medium">Internal ID:</span>
                                        <span className="font-mono font-bold text-slate-900 bg-white px-2 py-1 rounded border border-slate-200">{property.personal_property_id}</span>
                                    </div>
                                )}
                                {property.social_media_url && (
                                    <div className="pt-2 border-t border-slate-200">
                                        <a
                                            href={property.social_media_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2 w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition shadow-sm"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                            Visit Social Media
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}

                        <ContactForm
                            propertyId={property.id}
                            propertyTitle={property.title}
                            propertyAddress={`${property.address}, ${property.location_city}`}
                            agentName={agent.name}
                        />
                    </div>
                </div>
            </div>

            {/* Valuation Reports Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <PropertyValuationSection
                    property={property}
                    showMakeOffer={showMakeOffer}
                />
            </div>
        </div>
    );
}
