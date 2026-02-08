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
import { createClient } from "@/app/lib/supabase/server";
import PropertyAnalyticsWidget from '@/app/components/analytics/PropertyAnalyticsWidget';
import PropertyViewTracker from '@/app/components/analytics/PropertyViewTracker';
import { getPropertyAnalytics } from '@/app/lib/actions/propertyAnalytics';

function getYouTubeEmbedUrl(url: string) {
    if (!url) return '';

    // Extract Video ID using Regex
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);

    if (match && match[2].length === 11) {
        return `https://www.youtube.com/embed/${match[2]}`;
    }

    return url;
}

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // UUID validation to prevent Postgres errors
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUuid = uuidRegex.test(id);

    const supabase = await createClient();
    let property: Property | undefined;
    let ownerProfile = null;
    let user = null;
    let analytics: { views: number; favorites: number; inquiries: number; offers: number; shares: number; createdAt: string | null } = { views: 0, favorites: 0, inquiries: 0, offers: 0, shares: 0, createdAt: null };
    let propertyEvents: any[] = [];
    let showMakeOffer = false;
    let showVirtualTour = false;
    let hasAccess = false;
    let canViewContact = false;

    try {
        // 1. Try to fetch from Supabase if ID is valid UUID
        if (isUuid) {
            const { data: dbProperty } = await supabase
                .from('properties')
                .select('*')
                .eq('id', id)
                .single();

            if (dbProperty) {
                property = {
                    id: dbProperty.id,
                    listing_type: dbProperty.listing_type || 'For Sale',
                    currency: dbProperty.currency || 'EUR',
                    title: dbProperty.title || '',
                    description: dbProperty.description || '',
                    address: dbProperty.address || '',
                    location_city: dbProperty.location_city || '',
                    location_county: dbProperty.location_county || '',
                    location_area: dbProperty.location_area || null,
                    latitude: dbProperty.latitude || null,
                    longitude: dbProperty.longitude || null,
                    price: dbProperty.price || 0,
                    rooms: dbProperty.rooms || null,
                    bedrooms: dbProperty.bedrooms || null,
                    bathrooms: dbProperty.bathrooms || null,
                    area_usable: dbProperty.area_usable || null,
                    area_built: dbProperty.area_built || null,
                    area_box: dbProperty.area_box || null,
                    area_terrace: dbProperty.area_terrace || null,
                    area_garden: dbProperty.area_garden || null,
                    year_built: dbProperty.year_built || null,
                    type: dbProperty.type || 'Other',
                    floor: dbProperty.floor || null,
                    total_floors: dbProperty.total_floors || null,
                    partitioning: dbProperty.partitioning || null,
                    comfort: dbProperty.comfort || null,
                    building_type: dbProperty.building_type || null,
                    interior_condition: dbProperty.interior_condition || null,
                    furnishing: dbProperty.furnishing || null,
                    features: dbProperty.features || [],
                    images: dbProperty.images || [],
                    owner_id: dbProperty.owner_id || '',
                    video_url: dbProperty.video_url || null,
                    youtube_video_url: dbProperty.youtube_video_url || null,
                    virtual_tour_url: dbProperty.virtual_tour_url || null,
                    social_media_url: dbProperty.social_media_url || null,
                    personal_property_id: dbProperty.personal_property_id || null,
                    promoted: !!dbProperty.promoted,
                    status: dbProperty.status || 'draft',
                    score: dbProperty.score || 0,
                    created_at: dbProperty.created_at instanceof Date ? (dbProperty.created_at as Date).toISOString() : (dbProperty.created_at || null),
                    updated_at: dbProperty.updated_at instanceof Date ? (dbProperty.updated_at as Date).toISOString() : (dbProperty.updated_at || null),
                    friendly_id: dbProperty.friendly_id || null,
                    private_notes: dbProperty.private_notes || null,
                    documents: dbProperty.documents || [],
                    owner_name: (dbProperty as any).owner_name || null,
                    owner_phone: (dbProperty as any).owner_phone || null
                };
            }
        }

        // 2. Fallback to mock data if not found or invalid UUID
        if (!property) {
            property = MOCK_PROPERTIES.find(p => p.id === id);
        }

        if (!property) {
            return notFound();
        }

        // 3. Fetch data - sequential for maximum stability
        const userRes = await supabase.auth.getUser();
        user = userRes.data.user;

        analytics = await getPropertyAnalytics(property.id);

        const { data: events } = await supabase
            .from('property_events')
            .select('id, title, description, event_type, start_time, end_time, created_at')
            .eq('property_id', property.id)
            .order('start_time', { ascending: true });

        if (events) {
            propertyEvents = events.map(event => ({
                id: event.id,
                title: event.title || '',
                description: event.description || null,
                event_type: event.event_type || 'other',
                start_time: event.start_time instanceof Date ? (event.start_time as Date).toISOString() : (event.start_time || null),
                end_time: event.end_time instanceof Date ? (event.end_time as Date).toISOString() : (event.end_time || null),
                created_at: event.created_at instanceof Date ? (event.created_at as Date).toISOString() : (event.created_at || null)
            }));
        }

        // 4. Owner & Access Logic - Serialized
        if (property.owner_id && isUuid) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, role, avatar_url, phone, email')
                .eq('id', property.owner_id)
                .single();
            ownerProfile = profile;

            // Check Feature Access sequentially
            showMakeOffer = await checkUserFeatureAccess(property.owner_id, SYSTEM_FEATURES.MAKE_AN_OFFER).catch(() => false);
            showVirtualTour = await checkUserFeatureAccess(property.owner_id, SYSTEM_FEATURES.VIRTUAL_TOUR).catch(() => false);
        }

        if (user) {
            if (property.owner_id === user.id) {
                hasAccess = true;
                canViewContact = true;
            } else {
                const { data: currentUserProfile } = await supabase
                    .from('profiles')
                    .select('role, plan_tier')
                    .eq('id', user.id)
                    .single();

                if (currentUserProfile?.role === 'admin' || currentUserProfile?.role === 'superadmin') {
                    hasAccess = true;
                    canViewContact = true;
                }

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
    } catch (err) {
        console.error("Critical error in PropertyDetailPage:", err);
    }

    if (!property) return notFound();

    // Safe formatter factory
    const getSafeFormatter = (currencyCode: string) => {
        try {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currencyCode || 'USD',
                maximumFractionDigits: 0
            });
        } catch (e) {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 0
            });
        }
    };

    const formatter = getSafeFormatter(property.currency || 'USD');

    // Agent / Owner Display Data
    const agent = {
        name: ownerProfile?.full_name || 'Property Owner',
        image: ownerProfile?.avatar_url || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        role: ownerProfile?.role ? (ownerProfile.role.charAt(0).toUpperCase() + ownerProfile.role.slice(1)) : 'Realtor',
        phone: ownerProfile?.phone,
        email: ownerProfile?.email
    };

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
                                {canViewContact && ((property as any).owner_name || (property as any).owner_phone) && (
                                    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {(property as any).owner_name && (
                                            <div>
                                                <div className="text-xs font-bold text-slate-500 uppercase mb-1">Owner Name</div>
                                                <div className="text-lg font-bold text-white">{(property as any).owner_name}</div>
                                            </div>
                                        )}
                                        {(property as any).owner_phone && (
                                            <div>
                                                <div className="text-xs font-bold text-slate-500 uppercase mb-1">Owner Phone</div>
                                                <div className="text-lg font-bold text-white font-mono">{(property as any).owner_phone}</div>
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
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mt-4">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2 leading-tight">
                                    {property.title}
                                </h1>
                                <div className="leading-tight">
                                    <div className="font-extrabold text-2xl text-slate-900">{formatter.format(property.area_usable || 0).replace('$', '').replace('€', '')}</div>
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
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                    </div>

                    {/* Description */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-slate-900">Description</h2>
                        <div className="border border-slate-200 rounded-2xl p-8 bg-white shadow-sm">
                            <p className="text-slate-600 leading-relaxed text-lg whitespace-pre-wrap">
                                {property.description}
                            </p>
                        </div>
                    </div>

                    {/* Open House Events */}
                    {propertyEvents && propertyEvents.length > 0 && (
                        <div className="space-y-4">
                            <OpenHouseWidget
                                events={propertyEvents}
                                propertyTitle={property.title}
                                propertyAddress={`${property.address}, ${property.location_city}`}
                            />
                        </div>
                    )}

                    {/* Features & Amenities */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-slate-900">Features & Amenities</h2>
                        <div className="grid grid-cols-1 gap-4">
                            {(() => {
                                const FEATURE_CATEGORIES: Record<string, string[]> = {
                                    'Unit Features': ['Air Conditioning', 'Balcony', 'Central Heating', 'Fireplace', 'Garage', 'Jacuzzi', 'Laundry', 'Parking', 'Private Pool', 'Sauna', 'Storage'],
                                    'Security & Safety': ['24/7 Security', 'CCTV Surveillance', 'Fire Safety', 'Gated Community', 'Intercom', 'Shelter', 'Video Door Phone']
                                };

                                return Object.entries(FEATURE_CATEGORIES).map(([category, categoryFeatures]) => {
                                    const matchedFeatures = categoryFeatures.filter(f => property?.features.includes(f));
                                    if (matchedFeatures.length === 0) return null;

                                    return (
                                        <div key={category} className="border border-slate-200 rounded-2xl p-6 bg-slate-50">
                                            <h3 className="text-lg font-bold text-slate-800 mb-4">{category}</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {matchedFeatures.map((feature, i) => (
                                                    <div key={i} className="flex items-center gap-3 text-slate-700">
                                                        <Check className="w-4 h-4 text-emerald-500" />
                                                        <span className="font-medium text-sm">{feature}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </div>

                    {/* Platform Features / Interaction Options */}
                    <PropertyFeatures
                        propertyId={property.id}
                        ownerId={property.owner_id}
                        propertyTitle={property.title}
                        currency={property.currency}
                        features={{
                            makeOffer: showMakeOffer,
                            virtualTour: !!(showVirtualTour && property.virtual_tour_url),
                            directMessage: false
                        }}
                    />

                    {/* Media: Video & Virtual Tour */}
                    {(property.youtube_video_url || property.video_url || property.virtual_tour_url) && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-slate-900">Media & Tours</h2>

                            {property.youtube_video_url && (
                                <div className="aspect-video rounded-2xl overflow-hidden shadow-lg">
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

                            {property.virtual_tour_url && (
                                <div className="bg-zinc-950 rounded-2xl overflow-hidden shadow-2xl">
                                    <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex justify-between items-center">
                                        <h3 className="text-white font-bold flex items-center gap-2">
                                            🎥 360° Virtual Tour
                                        </h3>
                                    </div>
                                    <div className="w-full h-[400px] relative">
                                        {!showVirtualTour ? (
                                            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10 backdrop-blur-sm">
                                                <div className="text-center p-6">
                                                    <Lock className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                                                    <h3 className="text-xl font-bold text-white mb-2">Virtual Tour Locked</h3>
                                                    <p className="text-slate-400 max-w-xs mx-auto">
                                                        This feature is only available on the owner's plan.
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
                        </div>
                    )}

                    {/* Location / Map */}
                    <div>
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
                    <PropertyAnalyticsWidget
                        views={analytics.views}
                        favorites={analytics.favorites}
                        inquiries={analytics.inquiries}
                        offers={analytics.offers}
                        shares={analytics.shares}
                        createdAt={analytics.createdAt}
                    />

                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm sticky top-24">
                        <h3 className="text-xl font-bold mb-6 text-slate-900">Contact</h3>
                        <div className="flex items-center gap-4 mb-6">
                            <img src={agent.image} alt={agent.name} className="w-14 h-14 rounded-full object-cover border-2 border-slate-100" />
                            <div>
                                <div className="font-bold text-slate-900">{agent.name}</div>
                                <div className="text-sm text-slate-500">{agent.role}</div>
                            </div>
                        </div>

                        <ContactForm
                            propertyId={property.id}
                            propertyTitle={property.title}
                            propertyAddress={`${property.address}, ${property.location_city}`}
                            agentName={agent.name}
                        />
                    </div>
                </div>
            </div>

            {/* Valuation Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 mt-12 border-t border-gray-200">
                <PropertyValuationSection
                    property={property}
                    showMakeOffer={showMakeOffer}
                />
            </div>
        </div>
    );
}
