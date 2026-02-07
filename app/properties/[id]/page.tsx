import { MOCK_PROPERTIES, Property } from "@/app/lib/properties";
import { checkUserFeatureAccess, SYSTEM_FEATURES } from '@/app/lib/auth/features';

export const dynamic = 'force-dynamic';
import PropertyCarousel from '../../components/properties/PropertyCarousel';
import Link from 'next/link';
import { ArrowLeft, Bed, Bath, Ruler, Calendar, MapPin, Check, Lock, Award, Home, Maximize2, Box, Trees, Sun, Facebook, Instagram, Linkedin, Twitter, Youtube, ExternalLink, FileText } from 'lucide-react';
import { notFound } from 'next/navigation';
import PropertyMap from '../../components/PropertyMap';
import PropertyValuationSection from '../../components/valuation/PropertyValuationSection';
import ContactForm from '../../components/ContactForm';
import { supabase } from "@/app/lib/supabase/client";

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
                                <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                                    <Home className="w-7 h-7" />
                                </div>
                                <div className="leading-tight">
                                    <div className="font-extrabold text-2xl text-slate-900">{property.rooms || 0}</div>
                                    <div className="text-slate-500 font-bold text-sm">Rooms</div>
                                </div>
                            </div>

                            <div className="w-px h-12 bg-slate-100 hidden sm:block"></div>

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

                    {/* Media: Video & Virtual Tour */}
                    {(property.youtube_video_url || (showVirtualTour && property.virtual_tour_url)) && (
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

                            {showVirtualTour && property.virtual_tour_url && (
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

                            {/* Social Media Widget */}
                            {property.social_media_url && (
                                <div className="mt-6">
                                    <a
                                        href={property.social_media_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group block bg-white border border-slate-200 rounded-2xl p-6 hover:border-purple-300 hover:shadow-md transition-all"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                                                    {property.social_media_url.includes('facebook') ? <Facebook className="w-6 h-6" /> :
                                                        property.social_media_url.includes('instagram') ? <Instagram className="w-6 h-6" /> :
                                                            property.social_media_url.includes('linkedin') ? <Linkedin className="w-6 h-6" /> :
                                                                property.social_media_url.includes('twitter') || property.social_media_url.includes('x.com') ? <Twitter className="w-6 h-6" /> :
                                                                    property.social_media_url.includes('youtube') ? <Youtube className="w-6 h-6" /> :
                                                                        <ExternalLink className="w-6 h-6" />
                                                    }
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 text-lg group-hover:text-purple-700 transition-colors">
                                                        {property.social_media_url.includes('facebook') ? 'View on Facebook' :
                                                            property.social_media_url.includes('instagram') ? 'View on Instagram' :
                                                                property.social_media_url.includes('linkedin') ? 'View on LinkedIn' :
                                                                    property.social_media_url.includes('twitter') || property.social_media_url.includes('x.com') ? 'View on X (Twitter)' :
                                                                        property.social_media_url.includes('youtube') ? 'View on YouTube' :
                                                                            'View on Social Media'
                                                        }
                                                    </div>
                                                    <div className="text-slate-500 text-sm">Check out this property listing details and updates</div>
                                                </div>
                                            </div>
                                            <ExternalLink className="w-5 h-5 text-slate-400 group-hover:text-purple-500" />
                                        </div>
                                    </a>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Valuation Widget & Insights */}
                    <div id="valuation-section">
                        <PropertyValuationSection property={property} showMakeOffer={showMakeOffer} />
                    </div>

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
                                            {property.social_media_url.includes('facebook') ? <Facebook className="w-4 h-4" /> :
                                                property.social_media_url.includes('instagram') ? <Instagram className="w-4 h-4" /> :
                                                    property.social_media_url.includes('linkedin') ? <Linkedin className="w-4 h-4" /> :
                                                        property.social_media_url.includes('twitter') || property.social_media_url.includes('x.com') ? <Twitter className="w-4 h-4" /> :
                                                            property.social_media_url.includes('youtube') ? <Youtube className="w-4 h-4" /> :
                                                                <ExternalLink className="w-4 h-4" />
                                            }
                                            {property.social_media_url.includes('facebook') ? 'Facebook' :
                                                property.social_media_url.includes('instagram') ? 'Instagram' :
                                                    property.social_media_url.includes('linkedin') ? 'LinkedIn' :
                                                        property.social_media_url.includes('twitter') || property.social_media_url.includes('x.com') ? 'X (Twitter)' :
                                                            property.social_media_url.includes('youtube') ? 'YouTube' :
                                                                'Social Media'
                                            }
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
