import { MOCK_PROPERTIES, Property } from "@/app/lib/properties";
import { checkUserFeatureAccess, SYSTEM_FEATURES } from '@/app/lib/auth/features';

export const dynamic = 'force-dynamic';
import PropertyCarousel from '../../components/properties/PropertyCarousel';
import Link from 'next/link';
import { ArrowLeft, Bed, Bath, Ruler, Calendar, MapPin, Check, Lock, Award, Home, Maximize2, Box, Trees, Sun, Facebook, Instagram, Linkedin, Twitter, Youtube, ExternalLink, FileText, Star, Video, Sparkles, ArrowRight } from 'lucide-react';
import { notFound } from 'next/navigation';
import PropertyMap from '../../components/PropertyMap';

import PropertyFeatures from '@/app/components/PropertyFeatures';
import ContactForm from '../../components/ContactForm';
import OpenHouseWidget from '@/app/components/events/OpenHouseWidget';
import PropertyValuationSection from '@/app/components/valuation/PropertyValuationSection';
import ShareButton from '@/app/components/property/ShareButton';
import FavoriteButton from '@/app/components/property/FavoriteButton';
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

            {/* Property Images Carousel */}
            <PropertyCarousel images={property.images} title={property.title} propertyId={property.id} />

            {/* Breadcrumb / Back */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <Link href="/properties" className="relative inline-flex h-12 overflow-hidden rounded-full p-[2px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50 group">
                        <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#0EA5E9_0%,#F472B6_25%,#8B5CF6_50%,#10B981_75%,#0EA5E9_100%)]" />
                        <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-white px-6 py-1 text-sm font-bold text-slate-900 backdrop-blur-3xl transition-all group-hover:bg-white/90 gap-2 uppercase tracking-wide">
                            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1 text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 fill-indigo-600" />
                            <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent group-hover:from-violet-600 group-hover:to-indigo-600 transition-all">Back to Properties</span>
                        </span>
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


            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-10">
                    {/* Info Header */}
                    {/* Info Header & Summary Cards */}
                    <div>
                        {/* 1. Badges Row */}
                        <div className="flex flex-wrap items-center gap-3 mb-6">
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

                        {/* 2. Title & Price */}
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2 leading-tight">
                                    {property.title}
                                </h1>
                                <div className="text-slate-500 font-medium flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    {property.address}, {property.location_city}
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                                <div className="font-extrabold text-3xl text-slate-900">
                                    {formatter.format(property.price)}
                                </div>
                                <div className="flex items-center gap-3">
                                    <FavoriteButton propertyId={property.id} />
                                    <ShareButton
                                        propertyId={property.id}
                                        title={property.title}
                                        description={`Check out ${property.title} on Imobum!`}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 3. Summary Metrics Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                            {/* Rooms */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0 text-indigo-600">
                                    <Home className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="font-extrabold text-xl text-slate-900">{property.rooms || '-'}</div>
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Rooms</div>
                                </div>
                            </div>

                            {/* Bedrooms */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center shrink-0 text-orange-600">
                                    <Bed className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="font-extrabold text-xl text-slate-900">{property.bedrooms || '-'}</div>
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Bedrooms</div>
                                </div>
                            </div>

                            {/* Bathrooms */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0 text-blue-600">
                                    <Bath className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="font-extrabold text-xl text-slate-900">{property.bathrooms || '-'}</div>
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Bathrooms</div>
                                </div>
                            </div>

                            {/* Sqm Price */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0 text-emerald-600">
                                    <Ruler className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="font-extrabold text-xl text-slate-900">
                                        {property.area_usable ? Math.round(property.price / property.area_usable) : '-'}
                                        <span className="text-sm font-normal text-slate-400 ml-1">/sqm</span>
                                    </div>
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Unit Price</div>
                                </div>
                            </div>
                        </div>

                        {/* 4. Key Details Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                            {[
                                { label: 'Partitioning', value: property.partitioning },
                                { label: 'Comfort', value: property.comfort },
                                { label: 'Building', value: property.building_type },
                                { label: 'Condition', value: property.interior_condition },
                                { label: 'Furnishing', value: property.furnishing },
                                { label: 'Year Built', value: property.year_built },
                                { label: 'Floors', value: property.floor && property.total_floors ? `${property.floor}/${property.total_floors}` : (property.total_floors || property.floor) }
                            ].map((item, i) => (
                                item.value ? (
                                    <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                        <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">{item.label}</div>
                                        <div className="text-slate-900 font-bold text-sm truncate" title={String(item.value)}>{item.value}</div>
                                    </div>
                                ) : null
                            ))}
                        </div>

                        {/* 5. Areas & Measurements */}
                        <h3 className="text-xl font-bold text-slate-900 mb-4">Areas & Measurements</h3>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { label: 'Built Area', value: property.area_built, unit: 'sqm', icon: Maximize2 },
                                { label: 'Terrace/Balcony', value: property.area_terrace, unit: 'sqm', icon: Sun },
                                { label: 'Garden', value: property.area_garden, unit: 'sqm', icon: Trees },
                                { label: 'Box/Storage', value: property.area_box, unit: 'sqm', icon: Box }
                            ].map((item, i) => (
                                <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-500 shrink-0">
                                        <item.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">{item.label}</div>
                                        <div className="text-slate-900 font-bold text-sm">
                                            {item.value ? `${item.value} ${item.unit}` : 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            ))}
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
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-slate-900">Features & Amenities</h2>
                        <div className="space-y-4">
                            {(() => {
                                const FEATURE_CATEGORIES: Record<string, string[]> = {
                                    'Listing Tags': ['Commission 0%', 'Exclusive', 'Foreclosure', 'Hotel Regime', 'Luxury'],
                                    'Unit Features': ['Air Conditioning', 'Balcony', 'Central Heating', 'Fireplace', 'Garage', 'Jacuzzi', 'Laundry', 'Parking', 'Private Pool', 'Sauna', 'Storage'],
                                    'Community & Recreation': ['Amphitheatre', 'Clubhouse', 'Common Garden', 'Jogging Track', 'Library', 'Park', 'Party Hall', 'Playground'],
                                    'Sports & Fitness': ['Basketball Court', 'Football Field', 'Gym', 'Squash Court', 'Swimming Pool', 'Tennis Court', 'Yoga Deck'],
                                    'Security & Safety': ['24/7 Security', 'CCTV Surveillance', 'Fire Safety', 'Gated Community', 'Intercom', 'Shelter', 'Video Door Phone'],
                                    'Sustainability & Services': ['Concierge', 'Elevator', 'Green Building', 'Maintenance Staff', 'Power Backup', 'Rainwater Harvesting', 'Sewage Treatment', 'Smart Home', 'Solar Panels', 'Visitor Parking']
                                };

                                const CATEGORY_STYLES: Record<string, { bg: string, border: string, text: string, iconBg: string, iconColor: string }> = {
                                    'Listing Tags': { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-900', iconBg: 'bg-blue-200', iconColor: 'text-blue-700' },
                                    'Unit Features': { bg: 'bg-violet-50', border: 'border-violet-100', text: 'text-violet-900', iconBg: 'bg-violet-200', iconColor: 'text-violet-700' },
                                    'Community & Recreation': { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-900', iconBg: 'bg-emerald-200', iconColor: 'text-emerald-700' },
                                    'Sports & Fitness': { bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-900', iconBg: 'bg-orange-200', iconColor: 'text-orange-700' },
                                    'Security & Safety': { bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-900', iconBg: 'bg-rose-200', iconColor: 'text-rose-700' },
                                    'Sustainability & Services': { bg: 'bg-cyan-50', border: 'border-cyan-100', text: 'text-cyan-900', iconBg: 'bg-cyan-200', iconColor: 'text-cyan-700' }
                                };

                                return Object.entries(FEATURE_CATEGORIES).map(([category, categoryFeatures]) => {
                                    const matchedFeatures = categoryFeatures.filter(f => property?.features.includes(f));
                                    if (matchedFeatures.length === 0) return null;

                                    const style = CATEGORY_STYLES[category] || CATEGORY_STYLES['Unit Features'];

                                    return (
                                        <div key={category} className={`border ${style.border} rounded-2xl p-6 ${style.bg}`}>
                                            <h3 className={`text-lg font-bold mb-4 ${style.text}`}>{category}</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-6">
                                                {matchedFeatures.map((feature, i) => (
                                                    <div key={i} className="flex items-center gap-3">
                                                        <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${style.iconBg}`}>
                                                            <Check className={`w-3.5 h-3.5 ${style.iconColor}`} />
                                                        </div>
                                                        <span className={`font-medium text-sm ${style.text}`}>{feature}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </div>



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

                            {property.video_url && (
                                <div className="bg-zinc-950 rounded-2xl overflow-hidden shadow-2xl">
                                    <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex justify-between items-center">
                                        <h3 className="text-white font-bold flex items-center gap-2">
                                            <Video className="w-5 h-5 text-indigo-500" />
                                            Virtual Tour
                                        </h3>
                                    </div>
                                    <div className="w-full h-[400px] relative">
                                        <iframe
                                            src={property.video_url}
                                            width="100%"
                                            height="100%"
                                            frameBorder="0"
                                            allowFullScreen
                                            className="w-full h-full"
                                        ></iframe>
                                    </div>
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

                    {/* Social Media Spotlight */}
                    {property.social_media_url && (
                        <div className="space-y-6 mt-10">
                            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                <Sparkles className="w-6 h-6 text-pink-500" />
                                Social Media Spotlight
                            </h2>
                            <div className="bg-zinc-950 rounded-2xl overflow-hidden shadow-2xl border border-zinc-800">
                                <div className="w-full h-[600px] relative flex justify-center bg-black">
                                    {property.social_media_url.includes('instagram.com/reel') ? (
                                        <iframe
                                            src={`${property.social_media_url}embed`}
                                            className="w-full h-full max-w-[400px]"
                                            frameBorder="0"
                                            allowFullScreen
                                        ></iframe>
                                    ) : property.social_media_url.includes('tiktok.com') ? (
                                        <blockquote className="tiktok-embed" cite={property.social_media_url} data-video-id={property.social_media_url.split('/video/')[1]} style={{ maxWidth: '605px', minWidth: '325px' }}>
                                            <section>
                                                <a target="_blank" href={property.social_media_url} className="text-white underline">View TikTok</a>
                                            </section>
                                            <script async src="https://www.tiktok.com/embed.js"></script>
                                        </blockquote>
                                    ) : property.social_media_url.includes('youtube.com/shorts') ? (
                                        <iframe
                                            src={property.social_media_url.replace('shorts/', 'embed/')}
                                            className="w-full h-full max-w-[400px]"
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        ></iframe>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-10 text-center h-full">
                                            <p className="text-slate-400 mb-6">View this property on social media</p>
                                            <a
                                                href={property.social_media_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="bg-pink-600 hover:bg-pink-500 text-white font-bold py-3 px-8 rounded-full transition-colors flex items-center gap-2"
                                            >
                                                Open Social Media Link <ArrowRight className="w-4 h-4" />
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
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

                        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-500 text-sm font-medium">Ref ID:</span>
                                <span className="text-slate-900 font-bold bg-slate-100 px-2 py-1 rounded text-sm">
                                    {property.friendly_id ? `#${property.friendly_id}` : `#${property.id.slice(0, 8)}`}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-500 text-sm font-medium">Personal / Internal ID:</span>
                                <span className="text-slate-900 font-bold text-xs bg-slate-100 px-2 py-1 rounded font-mono truncate max-w-[150px]" title={property.personal_property_id || property.id}>
                                    {property.personal_property_id || property.id}
                                </span>
                            </div>
                        </div>
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

            {/* Platform Features / Interaction Options */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
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
            </div>
        </div>
    );
}
