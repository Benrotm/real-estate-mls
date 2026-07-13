'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Home,
    MapPin,
    DollarSign,
    Check,
    ArrowRight,
    ArrowLeft,
    Building2,
    Image as ImageIcon,
    CheckCircle2,
    Save,
    Camera,
    Layout,
    Upload,
    Sparkles,
    ChevronRight,
    ChevronLeft,
    Loader2,
    Globe,
    X,
    Lock,
    AlertCircle,
    FileText,
    RefreshCw,
    Calendar,
    Move,
    Coins,
    Info,
    Share2,
    Instagram,
    Facebook,
    Copy,
    ExternalLink
} from 'lucide-react';
import { createProperty, updateProperty } from '@/app/lib/actions/properties';
import { getFeatureCosts, getSocialLinks } from '@/app/lib/actions/settings';
import { checkVirtualTourUnlock, unlockVirtualTour } from '@/app/lib/actions/credits';
import { getAdminSettings } from '@/app/lib/actions/admin-settings';
import { createCollaborationContract, getCollaborationContractForProperty, getCollaborationContract } from '@/app/lib/actions/collaboration-contracts';
import { supabase } from '@/app/lib/supabase/client';
import LocationMap from '@/app/components/LocationMap';
import AddressAutocomplete from '@/app/components/AddressAutocomplete';
import ImportPropertiesModal from '@/app/components/properties/ImportPropertiesModal';
import {
    PROPERTY_TYPES,
    PARTITIONING_TYPES,
    COMFORT_TYPES,
    BUILDING_TYPES,
    INTERIOR_CONDITIONS,
    FURNISHING_TYPES,
    TRANSACTION_TYPES,
    Property,
    FEATURE_CATEGORIES,
    CATEGORY_COLORS
} from '@/app/lib/properties';
import { getVirtualTours } from '@/app/lib/actions/tours';
import { VirtualTour } from '@/app/lib/tours';
import { requestPortalActivation, getUserPortalActivations } from '@/app/lib/actions/portal-activations';
import toast from 'react-hot-toast';

// FEATURE_CATEGORIES is now imported from @/app/lib/properties

// CATEGORY_COLORS is now imported from @/app/lib/properties

import UpgradeModal from '@/app/components/UpgradeModal';
import PropertyValuationSection from '@/app/components/valuation/PropertyValuationSection';
import EventClient from '@/app/components/events/EventClient';
import ReportSoldModal from '@/app/components/properties/ReportSoldModal';

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.456L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.451 5.403.002 9.803-4.394 9.806-9.799.002-2.618-1.016-5.079-2.87-6.934C16.356 2.016 13.896 1 11.278 1 5.875 1 1.475 5.397 1.472 10.802c-.001 1.517.398 2.998 1.157 4.312L1.642 20.3l5.005-1.146zm11.758-5.324c-.314-.158-1.859-.918-2.148-1.023-.29-.105-.5-.158-.71.158-.21.314-.813 1.023-.996 1.233-.183.21-.366.236-.68.079-.314-.158-1.328-.49-2.529-1.561-.933-.833-1.564-1.862-1.747-2.178-.183-.315-.02-.485.137-.642.142-.141.315-.367.472-.551.157-.184.21-.315.315-.525.105-.21.053-.394-.026-.551-.079-.158-.71-1.712-.973-2.348-.255-.615-.515-.532-.71-.542-.183-.01-.393-.011-.603-.011s-.552.079-.84.394c-.288.315-1.101 1.077-1.101 2.626 0 1.549 1.128 3.045 1.285 3.255.158.21 2.221 3.391 5.38 4.757.753.325 1.341.52 1.8.664.757.241 1.446.207 1.99.126.607-.091 1.859-.761 2.122-1.458.263-.697.263-1.294.184-1.42-.079-.126-.29-.21-.604-.368z"/>
    </svg>
);

const TikTokIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.74-3.99-1.72-.08-.07-.17-.17-.25-.25v6.5c-.02 2.11-.74 4.24-2.23 5.73-1.49 1.49-3.63 2.21-5.74 2.2-2.11.02-4.24-.71-5.73-2.2-1.49-1.49-2.21-3.62-2.2-5.73-.02-2.11.71-4.24 2.2-5.73 1.49-1.49 3.62-2.21 5.73-2.2 1.15-.02 2.3.26 3.32.81V0zm-3.32 11.51c-.88-.01-1.78.3-2.42.94-.64.64-.95 1.53-.94 2.42-.01.88.3 1.78.94 2.42.64.64 1.53.95 2.42.94.88.01 1.78-.3 2.42-.94.64-.64 1.53.95 2.42.94.88.01 1.78-.3 2.42-.94.64-.64 1.53-1.53 1.52-2.42V8.12c-.89.56-1.92.88-2.98.92-.12.01-.24.01-.36.01v2.48z"/>
    </svg>
);

export default function AddPropertyForm({ initialData, canUseVirtualTours = true }: { initialData?: Partial<Property>, canUseVirtualTours?: boolean }) {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [propertyId, setPropertyId] = useState<string | null>(initialData?.id || null);
    const [submitting, setSubmitting] = useState(false);
    const [savingDraft, setSavingDraft] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [isUploadingDocs, setIsUploadingDocs] = useState(false);
    const [success, setSuccess] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [showRomimoInfo, setShowRomimoInfo] = useState(false);
    const [isReportSoldModalOpen, setIsReportSoldModalOpen] = useState(false);
    const [availableTours, setAvailableTours] = useState<VirtualTour[]>([]);
    const [contractLanguage, setContractLanguage] = useState<'ro' | 'en'>('ro');

    // Watermark Settings States
    const [userWatermark, setUserWatermark] = useState({
        is_active: false,
        logo_url: '',
        opacity: 0.5,
        size: 20,
        position: 'bottom-right'
    });

    const [adminWatermark, setAdminWatermark] = useState<{
        is_active: boolean;
        override_users: boolean;
        logo_url: string;
        opacity: number;
        size: number;
        position: string;
    } | null>(null);

    const [isUploadingUserLogo, setIsUploadingUserLogo] = useState(false);

    // Photo reordering states
    const [draggedPhotoIndex, setDraggedPhotoIndex] = useState<number | null>(null);
    const [hoveredPhotoIndex, setHoveredPhotoIndex] = useState<number | null>(null);

    // Virtual Tour Unlocking States
    const [isVirtualTourUnlocked, setIsVirtualTourUnlocked] = useState(canUseVirtualTours || !!initialData?.virtual_tour_url);
    const [virtualTourCost, setVirtualTourCost] = useState<number>(1);
    const [loadingTourCost, setLoadingTourCost] = useState<boolean>(true);
    const [unlockTourError, setUnlockTourError] = useState<string | null>(null);
    const [isUnlockingTour, setIsUnlockingTour] = useState<boolean>(false);

    const [portalCosts, setPortalCosts] = useState<Record<string, number>>({
        publish_imobiliare: 2,
        publish_storia: 2,
        publish_romimo: 2,
        promote_romimo: 5,
        publish_homezz: 2,
        publish_imobiliarepret: 2,
        publish_whatsapp_groups: 2,
        publish_facebook_groups: 2,
        publish_facebook_page: 2,
        publish_instagram: 2,
        publish_tiktok: 2,
        price_contribution_reward: 10,
        add_listing_reward: 5
    });

    useEffect(() => {
        getFeatureCosts().then(res => {
            if (res && res.costs) {
                setPortalCosts({
                    publish_imobiliare: res.costs.publish_imobiliare ?? 2,
                    publish_storia: res.costs.publish_storia ?? 2,
                    publish_romimo: res.costs.publish_romimo ?? 2,
                    promote_romimo: res.costs.promote_romimo ?? 5,
                    publish_homezz: res.costs.publish_homezz ?? 2,
                    publish_imobiliarepret: res.costs.publish_imobiliarepret ?? 2,
                    publish_whatsapp_groups: res.costs.publish_whatsapp_groups ?? 2,
                    publish_facebook_groups: res.costs.publish_facebook_groups ?? 2,
                    publish_facebook_page: res.costs.publish_facebook_page ?? 2,
                    publish_instagram: res.costs.publish_instagram ?? 2,
                    publish_tiktok: res.costs.publish_tiktok ?? 2,
                    price_contribution_reward: res.costs.price_contribution_reward ?? 10,
                    add_listing_reward: res.costs.add_listing_reward ?? 5
                });
                if (res.costs.virtual_tour !== undefined) {
                    setVirtualTourCost(res.costs.virtual_tour);
                }
            }
            setLoadingTourCost(false);
        }).catch(err => {
            console.error("Error loading costs:", err);
            setLoadingTourCost(false);
        });
    }, []);

    useEffect(() => {
        if (!canUseVirtualTours) {
            checkVirtualTourUnlock(initialData?.id).then(res => {
                if (res.unlocked) {
                    setIsVirtualTourUnlocked(true);
                }
            }).catch(err => {
                console.error("Error checking virtual tour unlock:", err);
            });
        }
    }, [canUseVirtualTours, initialData?.id]);

    useEffect(() => {
        // Load user watermark settings from Local Storage
        const savedSettings = localStorage.getItem('imobum_watermark_settings');
        if (savedSettings) {
            try {
                setUserWatermark(JSON.parse(savedSettings));
            } catch (e) {
                console.error("Failed to parse user watermark settings from localStorage:", e);
            }
        }

        // Fetch admin global override watermark configuration
        async function fetchAdminSettings() {
            try {
                const settings = await getAdminSettings();
                if (settings && settings.global_watermark) {
                    setAdminWatermark(settings.global_watermark);
                }
            } catch (e) {
                console.error("Failed to fetch admin watermark settings:", e);
            }
        }
        fetchAdminSettings();
    }, []);

    const saveUserWatermark = (newSettings: typeof userWatermark) => {
        setUserWatermark(newSettings);
        localStorage.setItem('imobum_watermark_settings', JSON.stringify(newSettings));
    };

    const handleUserLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Limit user logo size to 1.5MB to stay performant
        if (file.size > 1.5 * 1024 * 1024) {
            toast.error("User watermark logo must be under 1.5MB");
            return;
        }

        setIsUploadingUserLogo(true);
        try {
            // Upload to property-images bucket under user_watermarks/
            const fileExt = file.name.split('.').pop();
            const fileName = `user_watermarks/wm_${Date.now()}.${fileExt}`;

            const { data, error: uploadError } = await supabase.storage
                .from('property-images')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('property-images')
                .getPublicUrl(fileName);

            const updatedSettings = { ...userWatermark, logo_url: publicUrl };
            saveUserWatermark(updatedSettings);
            toast.success("Watermark logo uploaded!");
        } catch (error: any) {
            console.error("User watermark logo upload failed:", error);
            toast.error(`Logo upload failed: ${error.message || error}`);
        } finally {
            setIsUploadingUserLogo(false);
        }
    };

    const applyWatermark = async (file: File): Promise<File> => {
        // 1. Determine which watermark to use
        const isAdminOverride = adminWatermark?.is_active && adminWatermark?.override_users && adminWatermark?.logo_url;
        const isUserActive = userWatermark.is_active && userWatermark.logo_url;

        // If neither is active, return original file
        if (!isAdminOverride && !isUserActive) {
            return file;
        }

        const activeLogoUrl = isAdminOverride ? adminWatermark.logo_url : userWatermark.logo_url;
        const activeOpacity = isAdminOverride ? adminWatermark.opacity : userWatermark.opacity;
        const activeSize = isAdminOverride ? adminWatermark.size : userWatermark.size; // percentage of image width
        const activePosition = isAdminOverride ? adminWatermark.position : userWatermark.position;

        return new Promise((resolve) => {
            // Create image element from listing photo file
            const img = new window.Image();
            const url = URL.createObjectURL(file);
            img.src = url;

            img.onload = () => {
                // Free URL object memory
                URL.revokeObjectURL(url);

                // Create watermark image element
                const watermarkImg = new window.Image();
                // CRITICAL: We must set crossOrigin = 'anonymous' for external URLs (CDN URLs)
                watermarkImg.crossOrigin = 'anonymous';
                watermarkImg.src = activeLogoUrl;

                watermarkImg.onload = () => {
                    // Create canvas
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        resolve(file);
                        return;
                    }

                    // Set canvas dimensions equal to original image dimensions
                    canvas.width = img.width;
                    canvas.height = img.height;

                    // Draw listing photo
                    ctx.drawImage(img, 0, 0);

                    // Configure watermark opacity
                    ctx.globalAlpha = activeOpacity;

                    // Compute watermark size (activeSize is percentage of photo width)
                    const targetWidth = canvas.width * (activeSize / 100);
                    const aspectRatio = watermarkImg.width / watermarkImg.height;
                    const targetHeight = targetWidth / aspectRatio;

                    // Helper to draw a single watermark instance
                    const drawWatermark = (x: number, y: number) => {
                        ctx.drawImage(watermarkImg, x, y, targetWidth, targetHeight);
                    };

                    // Draw based on position
                    if (activePosition === 'tile') {
                        // Tiled pattern - draw in grid
                        const stepX = targetWidth * 2;
                        const stepY = targetHeight * 2;
                        for (let x = targetWidth / 2; x < canvas.width; x += stepX) {
                            for (let y = targetHeight / 2; y < canvas.height; y += stepY) {
                                drawWatermark(x - targetWidth / 2, y - targetHeight / 2);
                            }
                        }
                    } else {
                        // Single positioning
                        let x = 0;
                        let y = 0;
                        const margin = Math.max(10, Math.round(canvas.width * 0.02)); // 2% margin from edges

                        switch (activePosition) {
                            case 'center':
                                x = (canvas.width - targetWidth) / 2;
                                y = (canvas.height - targetHeight) / 2;
                                break;
                            case 'top-left':
                                x = margin;
                                y = margin;
                                break;
                            case 'top-right':
                                x = canvas.width - targetWidth - margin;
                                y = margin;
                                break;
                            case 'bottom-left':
                                x = margin;
                                y = canvas.height - targetHeight - margin;
                                break;
                            case 'bottom-right':
                            default:
                                x = canvas.width - targetWidth - margin;
                                y = canvas.height - targetHeight - margin;
                                break;
                        }
                        drawWatermark(x, y);
                    }

                    // Reset globalAlpha
                    ctx.globalAlpha = 1.0;

                    // Convert canvas back to a File blob
                    canvas.toBlob((blob) => {
                        if (!blob) {
                            resolve(file);
                            return;
                        }
                        const watermarkedFile = new File([blob], file.name, {
                            type: file.type,
                            lastModified: Date.now()
                        });
                        resolve(watermarkedFile);
                    }, file.type, 0.9); // high quality (90%) compression
                };

                watermarkImg.onerror = (err) => {
                    console.error("Failed to load watermark logo image:", err);
                    resolve(file); // Fallback to original image if watermark logo fails to load
                };
            };

            img.onerror = (err) => {
                console.error("Failed to load listing photo image for canvas:", err);
                resolve(file);
            };
        });
    };

    useEffect(() => {
        getVirtualTours().then(tours => {
            if (tours) setAvailableTours(tours);
        });
    }, []);

    // Set starting step if defined in URL search query (e.g. ?step=4)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const stepParam = params.get('step');
            if (stepParam) {
                const parsedStep = parseInt(stepParam, 10);
                if (parsedStep >= 1 && parsedStep <= 4) {
                    setStep(parsedStep);
                }
            }
        }
    }, []);

    // Auto-geocode address on form load when lat/lng are missing (null from DB defaults to Bucharest)
    // NOTE: Uses Places API (enabled) instead of Geocoding API (not enabled) via findPlaceFromQuery
    useEffect(() => {
        const address = initialData?.address || '';
        const lat = initialData?.latitude;
        const lng = initialData?.longitude;

        // If we have an address but no real coordinates, look it up using the Places API
        if (address && address.length > 3 && (!lat || !lng)) {
            // Reverse address from "County, City, Zone" to "Zone, City, County, Romania" for Google
            const addressParts = address.split(',').map((p: string) => p.trim()).filter(Boolean);
            const reversedAddress = [...addressParts].reverse().join(', ') + ', Romania';

            const tryPlacesLookup = () => {
                const gm = (window as any).google?.maps;
                if (typeof window !== 'undefined' && gm?.places?.PlacesService) {
                    console.log('[Auto-geocode] Using Places API for:', reversedAddress);

                    // PlacesService needs a DOM element or map instance
                    const dummyDiv = document.createElement('div');
                    const service = new gm.places.PlacesService(dummyDiv);

                    const request = {
                        query: reversedAddress,
                        fields: ['geometry']
                    };

                    service.findPlaceFromQuery(request, (results: any, status: any) => {
                        console.log('[Auto-geocode] Places status:', status);
                        if (status === gm.places.PlacesServiceStatus.OK && results?.[0]?.geometry?.location) {
                            const loc = results[0].geometry.location;
                            console.log('[Auto-geocode] Found coords:', loc.lat(), loc.lng());
                            setFormData(prev => ({
                                ...prev,
                                latitude: loc.lat(),
                                longitude: loc.lng()
                            }));
                        } else {
                            console.warn('[Auto-geocode] Places lookup failed, trying AutocompleteService...');
                            // Fallback: use AutocompleteService to get a prediction then get its details
                            const autocomplete = new gm.places.AutocompleteService();
                            autocomplete.getPlacePredictions({ input: reversedAddress }, (predictions: any, predStatus: any) => {
                                if (predStatus === gm.places.PlacesServiceStatus.OK && predictions?.[0]) {
                                    const placeId = predictions[0].place_id;
                                    service.getDetails({ placeId, fields: ['geometry'] }, (place: any, detailStatus: any) => {
                                        if (detailStatus === gm.places.PlacesServiceStatus.OK && place?.geometry?.location) {
                                            const ploc = place.geometry.location;
                                            console.log('[Auto-geocode] Fallback found coords:', ploc.lat(), ploc.lng());
                                            setFormData(prev => ({
                                                ...prev,
                                                latitude: ploc.lat(),
                                                longitude: ploc.lng()
                                            }));
                                        }
                                    });
                                }
                            });
                        }
                    });
                } else {
                    console.log('[Auto-geocode] Waiting for google.maps.places to load...');
                    setTimeout(tryPlacesLookup, 1000);
                }
            };
            // Give the Maps JS API a moment to load
            setTimeout(tryPlacesLookup, 2000);
        }
    }, []);

    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        description: initialData?.description || '',
        price: initialData?.price?.toString() || '',
        listingType: initialData?.listing_type || 'For Sale',
        currency: initialData?.currency || 'USD',
        propertyType: initialData?.type || 'Apartment',
        address: initialData?.address || '',
        latitude: initialData?.latitude || 44.4268, // Default to Bucharest
        longitude: initialData?.longitude || 26.1025,
        city: initialData?.location_city || '',
        state: initialData?.location_county || '',
        area: initialData?.location_area || '',
        rooms: initialData?.rooms?.toString() || '',
        beds: initialData?.bedrooms?.toString() || '',
        baths: initialData?.bathrooms?.toString() || '',
        usableArea: initialData?.area_usable?.toString() || '',
        builtArea: initialData?.area_built?.toString() || '',
        boxArea: initialData?.area_box?.toString() || '',
        terraceArea: initialData?.area_terrace?.toString() || '',
        gardenArea: initialData?.area_garden?.toString() || '',
        yearBuilt: initialData?.year_built?.toString() || new Date().getFullYear().toString(),
        totalFloors: initialData?.total_floors?.toString() || '',
        floor: initialData?.floor?.toString() || '', // For apartment unit floor
        buildingType: initialData?.building_type || '', // e.g. Detached
        interiorCondition: initialData?.interior_condition || '', // e.g. New
        furnishing: initialData?.furnishing || 'Unfurnished',
        partitioning: initialData?.partitioning || '',
        comfort: initialData?.comfort || '',
        youtubeVideoUrl: initialData?.youtube_video_url || '',
        videoUrl: initialData?.video_url || '',
        virtualTourType: 'No Virtual Tour',
        virtualTourUrl: initialData?.virtual_tour_url || '',
        socialMediaUrl: initialData?.social_media_url || '',
        personalId: initialData?.personal_property_id || '',
        noSmokingAllowed: initialData?.no_smoking_allowed || false,
        noPetsAllowed: initialData?.no_pets_allowed || false,
        noSmallKidsAllowed: initialData?.no_small_kids_allowed || false,
        // Private Fields
        privateNotes: initialData?.private_notes || '',
        documents: (initialData?.documents as string[]) || [], // Documents as array of URLs
        ownerName: initialData?.owner_name || '',
        ownerPhone: initialData?.owner_phone || '',
        features: (initialData?.features as string[]) || [],
        images: (initialData?.images as string[]) || [],
        publishImobiliare: initialData?.publish_imobiliare || false,
        publishStoria: initialData?.publish_storia || false,
        publishRomimo: initialData?.publish_romimo || false,
        promoteRomimo: initialData?.promoted || false,
        publishHomezz: initialData?.publish_homezz || false,
        publishImobiliarepret: initialData?.publish_imobiliarepret || false,
        publishWhatsappGroups: initialData?.publish_whatsapp_groups || false,
        publishFacebookGroups: initialData?.publish_facebook_groups || false,
        publishFacebookPage: initialData?.publish_facebook_page || false,
        publishInstagram: initialData?.publish_instagram || false,
        publishTiktok: initialData?.publish_tiktok || false,
        contractCountry: initialData?.contract_country || 'România',
        contractCity: initialData?.contract_city || '',
        contractStreet: initialData?.contract_street || '',
        contractBuilding: initialData?.contract_building || '',
        contractFloor: initialData?.contract_floor || '',
        contractApartment: initialData?.contract_apartment || '',
        contractCfTopo: initialData?.contract_cf_topo || '',
        contractOwnerId: initialData?.contract_owner_id || '',
        contractOwnerCnp: initialData?.contract_owner_cnp || ''
    });

    const [agentProfile, setAgentProfile] = useState<any>(null);
    const [existingContract, setExistingContract] = useState<any | null>(null);
    const [portalActivations, setPortalActivations] = useState<any[]>([]);
    const [requestingActivation, setRequestingActivation] = useState<string | null>(null);
    const [romimoStats, setRomimoStats] = useState<any | null>(null);

    const handleRequestActivation = async (portalName: string) => {
        if (!agentProfile?.id) return;
        setRequestingActivation(portalName);
        const { success, error } = await requestPortalActivation(portalName, agentProfile.id);
        if (success) {
            toast.success(`Activation request sent for ${portalName}`);
            const actRes = await getUserPortalActivations(agentProfile.id);
            if (actRes.data) setPortalActivations(actRes.data);
        } else {
            toast.error(error || `Failed to request activation for ${portalName}`);
        }
        setRequestingActivation(null);
    };

    const getActivationStatus = (portalName: string) => {
        const act = portalActivations.find((a) => a.portal_name === portalName);
        return act?.status || 'none';
    };

    const handleUnlockVirtualTour = async () => {
        if (!confirm(`Deblocare Virtual Tour: Acest lucru va consuma ${virtualTourCost} credite. Confirmați?`)) {
            return;
        }

        setUnlockTourError(null);
        setIsUnlockingTour(true);

        try {
            const res = await unlockVirtualTour(initialData?.id);
            if (res.success) {
                toast.success("Virtual Tour deblocat cu succes!");
                setIsVirtualTourUnlocked(true);
                // Deduct from agentProfile credits if profile exists
                if (agentProfile) {
                    setAgentProfile((prev: any) => ({
                        ...prev,
                        credits: res.remaining !== undefined ? res.remaining : ((prev.credits || 0) - res.cost)
                    }));
                }
            } else {
                setUnlockTourError(res.error || "A apărut o eroare la deblocare.");
                if (res.insufficient) {
                    toast.error("Fonduri insuficiente.");
                } else {
                    toast.error(res.error || "Eroare la deblocare.");
                }
            }
        } catch (err: any) {
            console.error("Error unlocking virtual tour:", err);
            setUnlockTourError("Eroare la deblocarea Virtual Tour.");
            toast.error("Eroare de rețea sau server.");
        } finally {
            setIsUnlockingTour(false);
        }
    };

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                if (data) {
                    setAgentProfile(data);
                }

                // Fetch activations
                const actRes = await getUserPortalActivations(user.id);
                if (actRes.data) {
                    setPortalActivations(actRes.data);
                }
                
                // Fetch romimo stats
                try {
                    const statsRes = await fetch('/api/export/romimo/user?email=' + encodeURIComponent(data?.email || user.email || ''));
                    if (statsRes.ok) {
                        const json = await statsRes.json();
                        setRomimoStats(json.data);
                    } else {
                        setRomimoStats({ error: true });
                    }
                } catch (e) {
                    console.error('Error fetching romimo stats', e);
                    setRomimoStats({ error: true });
                }
            }
        };
        fetchProfile();
    }, []);

    useEffect(() => {
        if (propertyId) {
            getCollaborationContractForProperty(propertyId).then((res) => {
                if (res.success && res.contract) {
                    setExistingContract(res.contract);
                }
            });
        }
    }, [propertyId]);

    const handleScrapeSuccess = (data: any) => {
        setFormData(prev => ({
            ...prev,
            title: data.title || prev.title,
            description: data.description || prev.description,
            price: data.price?.toString() || prev.price,
            currency: data.currency || prev.currency,
            listingType: data.listing_type || prev.listingType,
            propertyType: data.type || prev.propertyType,
            address: data.address || prev.address,
            rooms: data.rooms?.toString() || prev.rooms,
            beds: data.bedrooms?.toString() || prev.beds,
            baths: data.bathrooms?.toString() || prev.baths,
            usableArea: data.area_usable?.toString() || prev.usableArea,
            builtArea: data.area_built?.toString() || prev.builtArea,
            yearBuilt: data.year_built?.toString() || prev.yearBuilt,
            features: (data.features as string[]) || prev.features,
            images: (data.images as string[]) || prev.images,
            totalFloors: data.total_floors?.toString() || prev.totalFloors,
            floor: data.floor?.toString() || prev.floor,
            partitioning: data.partitioning || prev.partitioning,
            comfort: data.comfort || prev.comfort,
            interiorCondition: data.interior_condition || prev.interiorCondition,
            furnishing: data.furnishing || prev.furnishing,
            buildingType: data.building_type || prev.buildingType,
            city: data.location_city || prev.city,
            state: data.location_county || prev.state,
            area: data.location_area || prev.area,
            latitude: data.latitude || prev.latitude,
            longitude: data.longitude || prev.longitude,
            ownerName: data.owner_name || prev.ownerName,
            ownerPhone: data.owner_phone || prev.ownerPhone,
            privateNotes: data.private_notes || prev.privateNotes,
        }));
        setIsImportModalOpen(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLocationSelect = (lat: number, lng: number) => {
        setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
    };

    const toggleFeature = (feature: string) => {
        setFormData(prev => ({
            ...prev,
            features: prev.features.includes(feature)
                ? prev.features.filter(f => f !== feature)
                : [...prev.features, feature]
        }));
    };

    const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploadingDocs(true);
        const newUrls: string[] = [];
        const maxFileSize = 10 * 1024 * 1024; // 10MB for documents

        try {
            const uploadPromises = Array.from(files).map(async (file) => {
                // Strict size check
                if (file.size > maxFileSize) {
                    throw new Error(`File ${file.name} is too large (max 10MB)`);
                }

                const fileExt = file.name.split('.').pop();
                const fileName = `documents/doc_${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('property-images') // Reusing existing bucket
                    .upload(fileName, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('property-images')
                    .getPublicUrl(fileName);

                console.log('Uploaded document:', publicUrl);
                return publicUrl;
            });

            const uploadedUrls = await Promise.all(uploadPromises);
            newUrls.push(...uploadedUrls);

            setFormData(prev => ({
                ...prev,
                documents: [...prev.documents, ...newUrls]
            }));

        } catch (error) {
            console.error('Error uploading documents:', error);
            alert('Failed to upload some documents. Please try again.');
        } finally {
            setIsUploadingDocs(false);
            // Reset input
            if (e.target) e.target.value = '';
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLLabelElement>) => {
        let files: File[] = [];

        if ('dataTransfer' in e) {
            e.preventDefault();
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                files = Array.from(e.dataTransfer.files);
            }
        } else if (e.target.files && e.target.files.length > 0) {
            files = Array.from(e.target.files);
        }

        if (files.length === 0) return;

        setUploading(true);
        const newUrls: string[] = [];
        const maxFileSize = 5 * 1024 * 1024; // 5MB

        try {
            const uploadPromises = files.map(async (originalFile) => {
                // Apply watermark overlay if active/configured
                const file = await applyWatermark(originalFile);

                // strict size check
                if (file.size > maxFileSize) {
                    throw new Error(`File ${file.name} is too large (max 5MB)`);
                }

                const fileExt = file.name.split('.').pop();
                const fileName = `property_${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
                const filePath = `listings/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('property-images')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('property-images')
                    .getPublicUrl(filePath);

                return publicUrl;
            });

            const results = await Promise.all(uploadPromises);
            setFormData(prev => ({ ...prev, images: [...prev.images, ...results] }));
        } catch (err: any) {
            console.error('Upload failed:', err);
            alert(`Failed to upload images: ${err.message || 'Unknown error'}`);
        } finally {
            setUploading(false);
        }
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

        const newImages = [...formData.images];
        const [draggedImg] = newImages.splice(sourceIndex, 1);
        newImages.splice(targetIndex, 0, draggedImg);

        setFormData(prev => ({
            ...prev,
            images: newImages
        }));

        setDraggedPhotoIndex(null);
        setHoveredPhotoIndex(null);
    };

    const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.add('border-violet-500', 'bg-slate-900/80');
    };

    const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('border-violet-500', 'bg-slate-900/80');
    };

    const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('border-violet-500', 'bg-slate-900/80');
        handleImageUpload(e);
    };

    const handleSaveDraft = async (e?: React.MouseEvent, silent = false) => {
        if (e) e.preventDefault();
        setSavingDraft(true);
        const targetStatus = initialData?.status === 'active' ? 'active' : 'draft';
        await handleSubmit(e as any, targetStatus, true);
        setSavingDraft(false);
    };

    const nextStep = async () => {
        if (step < 5) {
            const targetStatus = initialData?.status === 'active' ? 'active' : 'draft';
            await handleSaveDraft(undefined, true);
            setStep(step + 1);
        }
    };

    // Modified Submit to support silent mode
    const handleSubmit = async (e: React.FormEvent, status: 'active' | 'draft' = 'active', silent = false) => {
        if (e) e.preventDefault();
        if (!silent) setSubmitting(true);

        const formDataToSend = new FormData();
        // Core fields
        formDataToSend.append('title', formData.title || 'Untitled Draft'); // Fallback for draft
        formDataToSend.append('description', formData.description || '');
        formDataToSend.append('type', formData.propertyType); // Mapped from propertyType
        formDataToSend.append('listing_type', formData.listingType); // Mapped from listingType

        formDataToSend.append('price', formData.price || '0');
        formDataToSend.append('currency', formData.currency);

        // Location
        formDataToSend.append('address', formData.address || '');
        formDataToSend.append('location_city', formData.city || '');
        formDataToSend.append('location_county', formData.state || ''); // Using state input for county
        formDataToSend.append('location_area', formData.area || '');
        formDataToSend.append('latitude', formData.latitude.toString());
        formDataToSend.append('longitude', formData.longitude.toString());

        // Specs
        formDataToSend.append('rooms', formData.rooms || '0');
        formDataToSend.append('bedrooms', formData.beds || '0');
        formDataToSend.append('bathrooms', formData.baths || '0');
        formDataToSend.append('area_usable', formData.usableArea || '0');
        formDataToSend.append('area_built', formData.builtArea || '0');
        formDataToSend.append('area_box', formData.boxArea || '0');
        formDataToSend.append('area_terrace', formData.terraceArea || '0');
        formDataToSend.append('area_garden', formData.gardenArea || '0');

        formDataToSend.append('year_built', formData.yearBuilt || '0');
        formDataToSend.append('floor', formData.floor || '0');
        formDataToSend.append('total_floors', formData.totalFloors || '0');
        formDataToSend.append('partitioning', formData.partitioning || '');
        formDataToSend.append('comfort', formData.comfort || '');
        formDataToSend.append('building_type', formData.buildingType || '');
        formDataToSend.append('interior_condition', formData.interiorCondition || '');
        formDataToSend.append('furnishing', formData.furnishing || '');

        // Features & Media
        formDataToSend.append('features', JSON.stringify(formData.features));
        formDataToSend.append('youtube_video_url', formData.youtubeVideoUrl || '');
        formDataToSend.append('video_url', formData.videoUrl || '');
        formDataToSend.append('virtual_tour_url', formData.virtualTourUrl || '');
        formDataToSend.append('social_media_url', formData.socialMediaUrl || '');
        formDataToSend.append('personal_property_id', formData.personalId || '');
        formDataToSend.append('no_smoking_allowed', formData.noSmokingAllowed ? 'true' : 'false');
        formDataToSend.append('no_pets_allowed', formData.noPetsAllowed ? 'true' : 'false');
        formDataToSend.append('no_small_kids_allowed', formData.noSmallKidsAllowed ? 'true' : 'false');

        // Private Fields
        formDataToSend.append('private_notes', formData.privateNotes || '');
        formDataToSend.append('documents', JSON.stringify(formData.documents));
        formDataToSend.append('owner_name', formData.ownerName || '');
        formDataToSend.append('owner_phone', formData.ownerPhone || '');

        // Contract Fields
        formDataToSend.append('contract_country', formData.contractCountry || '');
        formDataToSend.append('contract_city', formData.contractCity || '');
        formDataToSend.append('contract_street', formData.contractStreet || '');
        formDataToSend.append('contract_building', formData.contractBuilding || '');
        formDataToSend.append('contract_floor', formData.contractFloor || '');
        formDataToSend.append('contract_apartment', formData.contractApartment || '');
        formDataToSend.append('contract_cf_topo', formData.contractCfTopo || '');
        formDataToSend.append('contract_owner_id', formData.contractOwnerId || '');
        formDataToSend.append('contract_owner_cnp', formData.contractOwnerCnp || '');

        // Status & Distribution
        formDataToSend.append('status', status);
        formDataToSend.append('publish_imobiliare', formData.publishImobiliare ? 'true' : 'false');
        formDataToSend.append('publish_storia', formData.publishStoria ? 'true' : 'false');
        formDataToSend.append('publish_romimo', formData.publishRomimo ? 'true' : 'false');
        formDataToSend.append('promoted', formData.promoteRomimo ? 'true' : 'false');
        formDataToSend.append('publish_homezz', formData.publishHomezz ? 'true' : 'false');
        formDataToSend.append('publish_imobiliarepret', formData.publishImobiliarepret ? 'true' : 'false');
        formDataToSend.append('publish_whatsapp_groups', formData.publishWhatsappGroups ? 'true' : 'false');
        formDataToSend.append('publish_facebook_groups', formData.publishFacebookGroups ? 'true' : 'false');
        formDataToSend.append('publish_facebook_page', formData.publishFacebookPage ? 'true' : 'false');
        formDataToSend.append('publish_instagram', formData.publishInstagram ? 'true' : 'false');
        formDataToSend.append('publish_tiktok', formData.publishTiktok ? 'true' : 'false');

        // Images
        formDataToSend.append('images', JSON.stringify(formData.images));

        try {
            let result;
            if (propertyId) {
                // Update existing draft
                result = await updateProperty(propertyId, formDataToSend);
            } else {
                // Create new property
                result = await createProperty(formDataToSend);
            }

            if (result.success) {
                if (!propertyId && result.data?.id) {
                    setPropertyId(result.data.id);
                }
                if (!silent) setSuccess(true);
            } else {
                if (!silent) alert(`Error: ${result.error}`);
                console.error('Submission error:', result.error);
            }
        } catch (error) {
            console.error(error);
            if (!silent) alert('An unexpected error occurred.');
        } finally {
            if (!silent) setSubmitting(false);
        }
    };

    const handleGenerateContract = async () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const dateStr = `${day}.${month}.${year}`;
        const timeStr = `${hours}:${minutes}`;
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const contractSerial = 'IMB';
        const contractNumber = `${year}${month}${day}-${randomNum}`;

        const agentProfileData = {
            company_name: agentProfile?.company_name || '',
            company_cui: agentProfile?.company_cui || '',
            company_reg_com: agentProfile?.company_reg_com || '',
            company_address: agentProfile?.company_address || '',
            company_representative: agentProfile?.company_representative || '',
            is_company: agentProfile?.is_company || false,
            full_name: agentProfile?.full_name || '',
            phone: agentProfile?.phone || ''
        };

        const formDataData = {
            ownerName: formData.ownerName || '',
            ownerPhone: formData.ownerPhone || '',
            contractOwnerId: formData.contractOwnerId || '',
            contractOwnerCnp: formData.contractOwnerCnp || '',
            title: formData.title || '',
            contractCountry: formData.contractCountry || 'România',
            contractCity: formData.contractCity || '',
            contractStreet: formData.contractStreet || '',
            contractBuilding: formData.contractBuilding || '',
            contractFloor: formData.contractFloor || '',
            contractApartment: formData.contractApartment || '',
            contractCfTopo: formData.contractCfTopo || '',
            price: formData.price || '',
            currency: formData.currency || 'EUR'
        };

        try {
            const res = await createCollaborationContract({
                agentProfile: agentProfileData,
                formData: formDataData,
                contractSerial,
                contractNumber,
                dateStr,
                timeStr,
                lang: contractLanguage,
                propertyId: propertyId || undefined
            });

            if (!res.success || !res.contractId) {
                throw new Error(res.error || 'Failed to save contract');
            }

            const contractRes = await getCollaborationContract(res.contractId);
            if (contractRes.success && contractRes.contract) {
                setExistingContract(contractRes.contract);
            }

            const previewUrl = `/properties/contract-preview?id=${res.contractId}`;
            window.open(previewUrl, '_blank');
        } catch (error) {
            console.error('Eroare la generarea contractului:', error);
            alert('A apărut o eroare la generarea contractului. Te rugăm să verifici datele introduse.');
        }
    };

    const checkKeyDown = (e: React.KeyboardEvent) => {
        const target = e.target as HTMLElement;
        if (e.key === 'Enter' && target.tagName !== 'TEXTAREA') {
            e.preventDefault();
        }
    };

    if (success) {
        const hasSocialChecked = formData.publishWhatsappGroups || formData.publishFacebookGroups || formData.publishFacebookPage || formData.publishInstagram || formData.publishTiktok;
        
        const SocialSharePanel = () => {
            const [socialLinks, setSocialLinks] = useState<Record<string, string[]>>({});
            const [loadingLinks, setLoadingLinks] = useState(true);
            const [copied, setCopied] = useState(false);

            useEffect(() => {
                const load = async () => {
                    const res = await getSocialLinks();
                    if (res.links) setSocialLinks(res.links);
                    setLoadingLinks(false);
                };
                load();
            }, []);

            const propertyUrl = typeof window !== 'undefined' ? `${window.location.origin}/properties/${propertyId}` : '';
            const listingText = `🏠 ${formData.title}\n💰 ${formData.price} ${formData.currency}\n📍 ${formData.city}${formData.area ? ', ' + formData.area : ''}\n🛏️ ${formData.rooms} rooms • ${formData.usableArea} mp\n\n🔗 ${propertyUrl}`;

            const handleCopyText = async () => {
                try {
                    await navigator.clipboard.writeText(listingText);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2500);
                } catch { /* fallback */ }
            };

            const checkedChannels = [
                formData.publishWhatsappGroups && { key: 'whatsapp_groups', label: 'WhatsApp Groups', color: 'emerald' },
                formData.publishFacebookGroups && { key: 'facebook_groups', label: 'Facebook Groups', color: 'blue' },
                formData.publishFacebookPage && { key: 'facebook_page', label: 'Facebook Page', color: 'sky' },
                formData.publishInstagram && { key: 'instagram', label: 'Instagram Page', color: 'pink' },
                formData.publishTiktok && { key: 'tiktok', label: 'TikTok Page', color: 'slate' },
            ].filter(Boolean) as { key: string; label: string; color: string }[];

            if (loadingLinks) {
                return (
                    <div className="flex items-center justify-center py-6 gap-2 text-slate-500">
                        <Loader2 className="w-4 h-4 animate-spin" /> Loading sharing links...
                    </div>
                );
            }

            return (
                <div className="mt-6 text-left space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Share2 className="w-5 h-5 text-pink-500" />
                        <h3 className="text-lg font-bold text-white">Distribute to Selected Social Media</h3>
                    </div>

                    {/* Copy Listing Text */}
                    <button
                        onClick={handleCopyText}
                        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all border ${
                            copied
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-slate-600'
                        }`}
                    >
                        {copied ? (
                            <><CheckCircle2 className="w-4 h-4" /> Listing Message Copied!</>
                        ) : (
                            <><Copy className="w-4 h-4" /> Copy Listing Message</>
                        )}
                    </button>

                    {/* Channel-specific links */}
                    {checkedChannels.map(ch => {
                        const channelLinks = socialLinks[ch.key] || [];
                        return (
                            <div key={ch.key} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                <h4 className="text-sm font-bold text-slate-300 mb-2">{ch.label}</h4>
                                {channelLinks.length === 0 ? (
                                    <p className="text-xs text-slate-500 italic">No links configured by admin yet.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {channelLinks.map((url, i) => {
                                            const isWhatsApp = ch.key === 'whatsapp_groups';
                                            const shareUrl = isWhatsApp
                                                ? `https://api.whatsapp.com/send?text=${encodeURIComponent(listingText)}`
                                                : url;
                                            return (
                                                <a
                                                    key={i}
                                                    href={shareUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 bg-slate-900 p-2.5 rounded-lg border border-slate-700 hover:border-slate-500 transition-colors group"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-pink-400 transition-colors shrink-0" />
                                                    <span className="text-xs text-slate-400 group-hover:text-slate-200 truncate flex-1 font-mono transition-colors">{url}</span>
                                                    <span className="text-[10px] bg-pink-500/10 text-pink-400 px-2 py-0.5 rounded-full font-bold shrink-0 border border-pink-500/20">
                                                        {isWhatsApp ? 'Share' : 'Open'}
                                                    </span>
                                                </a>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            );
        };

        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
                {/* Background Blobs */}
                <div className="absolute top-0 -left-20 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl opacity-50 pointer-events-none" />
                <div className="absolute bottom-0 -right-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl opacity-50 pointer-events-none" />

                <div className={`${hasSocialChecked ? 'max-w-2xl' : 'max-w-md'} w-full bg-slate-900/50 backdrop-blur-xl p-8 rounded-3xl border border-slate-800 text-center shadow-2xl relative z-10`}>
                    <div className="w-24 h-24 bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                        <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                    </div>
                    <h1 className="text-3xl font-bold mb-3 text-white">Listing Submitted!</h1>
                    <p className="text-slate-400 mb-8 leading-relaxed">
                        Your property has been successfully listed and is now pending review.
                    </p>

                    {hasSocialChecked && <SocialSharePanel />}

                    <div className={hasSocialChecked ? 'mt-6' : ''}>
                        <button
                            onClick={() => router.push(initialData?.owner_id || propertyId ? '/dashboard/agent' : '/dashboard/owner')}
                            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-4 rounded-xl font-bold hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-600/25 border border-violet-500/20"
                        >
                            Return to Dashboard
                        </button>
                        <button
                            onClick={() => router.push(initialData?.owner_id || propertyId ? '/dashboard/agent/listings' : '/dashboard/owner/properties')}
                            className="w-full mt-3 bg-slate-800 text-white py-4 rounded-xl font-bold hover:bg-slate-700 transition-all border border-slate-700 hover:border-slate-600 shadow-lg shadow-black/20"
                        >
                            Return to My Listings
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 pt-28 pb-24 relative overflow-hidden selection:bg-violet-500/30 selection:text-white">
            {/* Ambient Background Effects */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[100px]" />
                <div className="absolute top-[30%] left-[20%] w-[300px] h-[300px] bg-fuchsia-600/5 rounded-full blur-[80px]" />
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header Section */}
                <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">Add New Property</h1>
                        <p className="text-slate-400 text-lg">Create a premium listing for your real estate asset.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsImportModalOpen(true)}
                        className="flex items-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-xl font-bold hover:bg-slate-100 transition-all shadow-lg shadow-white/10"
                    >
                        <Upload className="w-4 h-4" />
                        Import your listing
                    </button>
                    <ImportPropertiesModal
                        showDefaultButton={false}
                        forceOpen={isImportModalOpen}
                        onClose={() => setIsImportModalOpen(false)}
                        onScrapeSuccess={handleScrapeSuccess}
                    />
                </div>

                {/* Stepper Navigation */}
                <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl p-1 mb-10 shadow-xl flex items-center justify-between relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                    {[1, 2, 3, 4, 5].map((s) => (
                        <div key={s} className="flex-1 relative z-10">
                            <button
                                type="button"
                                onClick={() => setStep(s)} // Allow skipping for now, or restrict if needed
                                className={`flex items-center justify-center gap-3 w-full py-4 px-2 rounded-xl transition-all duration-300 ${step === s
                                    ? 'bg-slate-800/80 shadow-lg shadow-black/20 border border-slate-700/50'
                                    : 'hover:bg-slate-800/40'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 ${step === s
                                    ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30 scale-110'
                                    : step > s
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                                    }`}>
                                    {step > s ? <Check className="w-5 h-5" /> : s}
                                </div>
                                <div className="text-left hidden sm:block">
                                    <div className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${step === s ? 'text-violet-400' : 'text-slate-500'}`}>Step {s}</div>
                                    <div className={`text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r ${step === s ? 'from-white to-slate-200' : 'from-slate-400 to-slate-500 opacity-60'
                                        }`}>
                                        {s === 1 && 'Details & Location'}
                                        {s === 2 && 'Media'}
                                        {s === 3 && 'Amenities'}
                                        {s === 4 && 'Private Info'}
                                        {s === 5 && 'Auto-Posting'}
                                    </div>
                                </div>
                            </button>
                        </div>
                    ))}
                </div>

                <form onSubmit={handleSubmit} onKeyDown={checkKeyDown} className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative group">
                    {/* Glass Shine Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                    {/* Step 1: Basic Information */}
                    {step === 1 && (
                        <div className="p-8 md:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Basic Information Section */}
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center border border-violet-500/30 shadow-inner">
                                    <Home className="w-6 h-6 text-violet-400" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Basic Information</h2>
                                    <p className="text-slate-400 text-sm">Essential details about the property.</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* Property Title */}
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                    <label className="sm:w-40 text-sm font-medium text-slate-300 shrink-0">Property Title</label>
                                    <input
                                        type="text"
                                        name="title"
                                        required
                                        value={formData.title}
                                        onChange={handleChange}
                                        placeholder="e.g., Luxury Modern Apartment in Downtown"
                                        className="flex-1 bg-slate-950/50 border border-slate-700/80 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none transition-all text-white placeholder-slate-600 hover:border-slate-600"
                                    />
                                </div>

                                {/* Description */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium text-slate-300">Description</label>
                                    <textarea
                                        name="description"
                                        required
                                        rows={5}
                                        value={formData.description}
                                        onChange={handleChange}
                                        placeholder="Tell us more about the property..."
                                        className="w-full bg-slate-950/50 border border-slate-700/80 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none transition-all resize-y min-h-[120px] text-white placeholder-slate-600 hover:border-slate-600"
                                    />
                                </div>

                                {/* Property Type & Listing Type */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex items-center gap-4">
                                        <label className="w-28 text-sm font-medium text-slate-300 shrink-0 text-right pr-2">Property Type</label>
                                        <div className="relative flex-1">
                                            <select
                                                name="propertyType"
                                                value={formData.propertyType}
                                                onChange={handleChange}
                                                className="w-full bg-slate-950/50 border border-slate-700/80 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none appearance-none text-white hover:border-slate-600"
                                            >
                                                {PROPERTY_TYPES.map(t => <option key={t} value={t} className="bg-slate-900">{t}</option>)}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <label className="w-28 text-sm font-medium text-slate-300 shrink-0 text-right pr-2">Listing Type</label>
                                        <div className="relative flex-1">
                                            <select
                                                name="listingType"
                                                value={formData.listingType}
                                                onChange={handleChange}
                                                className="w-full bg-slate-950/50 border border-slate-700/80 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none appearance-none text-white hover:border-slate-600"
                                            >
                                                {TRANSACTION_TYPES.map(t => <option key={t} value={t} className="bg-slate-900">{t}</option>)}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Price & Currency */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex items-center gap-4">
                                        <label className="w-28 text-sm font-medium text-slate-300 shrink-0 text-right pr-2">Price</label>
                                        <div className="relative flex-1">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-violet-400 font-bold">
                                                <DollarSign className="w-5 h-5" />
                                            </div>
                                            <input
                                                type="number"
                                                name="price"
                                                required
                                                value={formData.price}
                                                onChange={handleChange}
                                                placeholder="0.00"
                                                className="w-full bg-slate-950/50 border border-slate-700/80 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none transition-all text-white placeholder-slate-600 hover:border-slate-600 font-medium"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <label className="w-28 text-sm font-medium text-slate-300 shrink-0 text-right pr-2">Currency</label>
                                        <div className="relative flex-1">
                                            <select
                                                name="currency"
                                                value={formData.currency}
                                                onChange={handleChange}
                                                className="w-full bg-slate-950/50 border border-slate-700/80 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none appearance-none text-white hover:border-slate-600"
                                            >
                                                <option value="USD" className="bg-slate-900">USD ($)</option>
                                                <option value="EUR" className="bg-slate-900">EUR (€)</option>
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Rooms, Usable Area, Floor & Total Floors */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="flex items-center gap-2 min-w-0 w-full">
                                        <label className="text-sm font-medium text-slate-300 shrink-0">Rooms</label>
                                        <input
                                            type="number"
                                            name="rooms"
                                            value={formData.rooms}
                                            onChange={handleChange}
                                            className="flex-1 min-w-0 bg-slate-950/50 border border-slate-700/80 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none transition-all text-white placeholder-slate-600 hover:border-slate-600"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 min-w-0 w-full">
                                        <label className="text-sm font-medium text-slate-300 shrink-0">Usable Area</label>
                                        <input
                                            type="number"
                                            name="usableArea"
                                            placeholder="sq ft"
                                            value={formData.usableArea}
                                            onChange={handleChange}
                                            className="flex-1 min-w-0 bg-slate-950/50 border border-slate-700/80 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none transition-all text-white placeholder-slate-600 hover:border-slate-600"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 min-w-0 w-full">
                                        <label className="text-sm font-medium text-slate-300 shrink-0">Floor</label>
                                        <input
                                            type="number"
                                            name="floor"
                                            placeholder="e.g., 5"
                                            value={formData.floor}
                                            onChange={handleChange}
                                            className="flex-1 min-w-0 bg-slate-950/50 border border-slate-700/80 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none transition-all text-white placeholder-slate-600 hover:border-slate-600"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 min-w-0 w-full">
                                        <label className="text-sm font-medium text-slate-300 shrink-0">Total Floors</label>
                                        <input
                                            type="number"
                                            name="totalFloors"
                                            placeholder="e.g., 10"
                                            value={formData.totalFloors}
                                            onChange={handleChange}
                                            className="flex-1 min-w-0 bg-slate-950/50 border border-slate-700/80 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none transition-all text-white placeholder-slate-600 hover:border-slate-600"
                                        />
                                    </div>
                                </div>

                                {/* Rental Restrictions (Only when For Rent) */}
                                {formData.listingType === 'For Rent' && (
                                    <div className="pt-4 border-t border-slate-800/80 mt-4">
                                        <h4 className="text-sm font-black uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-2">
                                            <span>Rental Restrictions & Rules</span>
                                            <span className="text-[10px] font-semibold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">AI Matching Criteria</span>
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <label className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${formData.noSmokingAllowed ? 'bg-amber-500/10 border-amber-500/50 text-amber-200' : 'bg-slate-900/50 border-slate-700/80 text-slate-300 hover:bg-slate-800/80'}`}>
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded border-slate-600 bg-slate-950 text-amber-500 focus:ring-amber-500/30 focus:ring-offset-0"
                                                    checked={formData.noSmokingAllowed}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, noSmokingAllowed: e.target.checked }))}
                                                />
                                                <span className="text-xs font-bold">No Smoking Allowed</span>
                                            </label>
                                            <label className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${formData.noPetsAllowed ? 'bg-amber-500/10 border-amber-500/50 text-amber-200' : 'bg-slate-900/50 border-slate-700/80 text-slate-300 hover:bg-slate-800/80'}`}>
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded border-slate-600 bg-slate-950 text-amber-500 focus:ring-amber-500/30 focus:ring-offset-0"
                                                    checked={formData.noPetsAllowed}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, noPetsAllowed: e.target.checked }))}
                                                />
                                                <span className="text-xs font-bold">No Pets Allowed</span>
                                            </label>
                                            <label className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${formData.noSmallKidsAllowed ? 'bg-amber-500/10 border-amber-500/50 text-amber-200' : 'bg-slate-900/50 border-slate-700/80 text-slate-300 hover:bg-slate-800/80'}`}>
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded border-slate-600 bg-slate-950 text-amber-500 focus:ring-amber-500/30 focus:ring-offset-0"
                                                    checked={formData.noSmallKidsAllowed}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, noSmallKidsAllowed: e.target.checked }))}
                                                />
                                                <span className="text-xs font-bold">No Small Kids Allowed</span>
                                            </label>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Location Section */}
                            <div className="pt-8 border-t border-slate-800">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center border border-violet-500/30 shadow-inner">
                                        <MapPin className="w-6 h-6 text-violet-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">Location</h2>
                                        <p className="text-slate-400 text-sm">Where is the property situated?</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {/* Street Address */}
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                        <label className="sm:w-32 text-sm font-medium text-slate-300 shrink-0">Street Address</label>
                                        <div className="flex-1">
                                            <AddressAutocomplete
                                                currentAddress={formData.address}
                                                className="w-full bg-slate-950/50 border border-slate-700/80 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none transition-all text-white placeholder-slate-600 hover:border-slate-600"
                                                onAddressSelect={(address) => {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        address: address.formattedAddress,
                                                        city: address.city || prev.city,
                                                        state: address.county || prev.state,
                                                        latitude: address.lat,
                                                        longitude: address.lng
                                                    }));
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Google Map Widget */}
                                    <div className="pt-2">
                                        <label className="block text-sm font-medium mb-4 text-slate-300">Drag Pin to Location</label>
                                        <div className="rounded-xl overflow-hidden border border-slate-700/80 shadow-lg shadow-black/20">
                                            <LocationMap
                                                key={`map-${formData.latitude}-${formData.longitude}`}
                                                lat={Number(formData.latitude)}
                                                lng={Number(formData.longitude)}
                                                onLocationSelect={handleLocationSelect}
                                            />
                                        </div>
                                        <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            Drag the marker to pinpoint the exact property location.
                                        </p>
                                    </div>
                                </div>
                            </div>


                            {/* Property Details Section */}
                            <div className="pt-8 border-t border-slate-800">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center border border-violet-500/30 shadow-inner">
                                        <Building2 className="w-6 h-6 text-violet-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">Property Details</h2>
                                        <p className="text-slate-400 text-sm">Specifications and characteristics.</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {/* Bedrooms, Bathrooms, Year Built */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="flex items-center gap-2 min-w-0 w-full">
                                            <label className="text-sm font-medium text-slate-300 shrink-0">Bedrooms</label>
                                            <input type="number" name="beds" value={formData.beds} onChange={handleChange} className="flex-1 min-w-0 bg-slate-950/50 border border-slate-700/80 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none transition-all text-white placeholder-slate-600 hover:border-slate-600" />
                                        </div>
                                        <div className="flex items-center gap-2 min-w-0 w-full">
                                            <label className="text-sm font-medium text-slate-300 shrink-0">Bathrooms</label>
                                            <input type="number" name="baths" value={formData.baths} onChange={handleChange} className="flex-1 min-w-0 bg-slate-950/50 border border-slate-700/80 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none transition-all text-white placeholder-slate-600 hover:border-slate-600" />
                                        </div>
                                        <div className="flex items-center gap-2 min-w-0 w-full">
                                            <label className="text-sm font-medium text-slate-300 shrink-0">Year Built</label>
                                            <input type="number" name="yearBuilt" value={formData.yearBuilt} onChange={handleChange} className="flex-1 min-w-0 bg-slate-950/50 border border-slate-700/80 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none transition-all text-white placeholder-slate-600 hover:border-slate-600" />
                                        </div>
                                    </div>

                                    {/* Built Area, Terrace Area, Garden Area, Storage Box */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium mb-2 text-slate-300">Built Area (sq ft)</label>
                                            <input type="number" name="builtArea" value={formData.builtArea} onChange={handleChange} className="w-full bg-slate-950/50 border border-slate-700/80 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none transition-all text-white placeholder-slate-600 hover:border-slate-600" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2 text-slate-300">Terrace (sq ft)</label>
                                            <input type="number" name="terraceArea" value={formData.terraceArea} onChange={handleChange} className="w-full bg-slate-950/50 border border-slate-700/80 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none transition-all text-white placeholder-slate-600 hover:border-slate-600" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2 text-slate-300">Garden (sq ft)</label>
                                            <input type="number" name="gardenArea" value={formData.gardenArea} onChange={handleChange} className="w-full bg-slate-950/50 border border-slate-700/80 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none transition-all text-white placeholder-slate-600 hover:border-slate-600" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2 text-slate-300">Storage Box</label>
                                            <input type="number" name="boxArea" value={formData.boxArea} onChange={handleChange} className="w-full bg-slate-950/50 border border-slate-700/80 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none transition-all text-white placeholder-slate-600 hover:border-slate-600" />
                                        </div>
                                    </div>

                                    {/* Partitioning & Comfort */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                        <div className="flex items-center gap-4">
                                            <label className="w-24 text-sm font-medium text-slate-300 shrink-0 text-right pr-2">Partitioning</label>
                                            <div className="relative flex-1">
                                                <select name="partitioning" value={formData.partitioning} onChange={handleChange} className="w-full bg-slate-950/50 border border-slate-700/80 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none appearance-none text-white hover:border-slate-600">
                                                    <option value="" className="bg-slate-900">Select...</option>
                                                    {PARTITIONING_TYPES.map(t => <option key={t} value={t} className="bg-slate-900">{t}</option>)}
                                                </select>
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <label className="w-24 text-sm font-medium text-slate-300 shrink-0 text-right pr-2">Comfort</label>
                                            <div className="relative flex-1">
                                                <select name="comfort" value={formData.comfort} onChange={handleChange} className="w-full bg-slate-950/50 border border-slate-700/80 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none appearance-none text-white hover:border-slate-600">
                                                    <option value="" className="bg-slate-900">Select...</option>
                                                    {COMFORT_TYPES.map(t => <option key={t} value={t} className="bg-slate-900">{t}</option>)}
                                                </select>
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Building Type, Interior, Furnishing */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                                        <div>
                                            <label className="block text-sm font-medium mb-2 text-slate-300">Building Type</label>
                                            <div className="relative">
                                                <select name="buildingType" value={formData.buildingType} onChange={handleChange} className="w-full bg-slate-950/50 border border-slate-700/80 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none appearance-none text-white hover:border-slate-600">
                                                    <option value="" className="bg-slate-900">Select..</option>
                                                    {BUILDING_TYPES.map(t => <option key={t} value={t} className="bg-slate-900">{t}</option>)}
                                                </select>
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2 text-slate-300">Interior Condition</label>
                                            <div className="relative">
                                                <select name="interiorCondition" value={formData.interiorCondition} onChange={handleChange} className="w-full bg-slate-950/50 border border-slate-700/80 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none appearance-none text-white hover:border-slate-600">
                                                    <option value="" className="bg-slate-900">Select..</option>
                                                    {INTERIOR_CONDITIONS.map(t => <option key={t} value={t} className="bg-slate-900">{t}</option>)}
                                                </select>
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2 text-slate-300">Furnishing</label>
                                            <div className="relative">
                                                <select name="furnishing" value={formData.furnishing} onChange={handleChange} className="w-full bg-slate-950/50 border border-slate-700/80 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none appearance-none text-white hover:border-slate-600">
                                                    {FURNISHING_TYPES.map(t => <option key={t} value={t} className="bg-slate-900">{t}</option>)}
                                                </select>
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Open to Collaboration Checkbox (Moved to the end) */}
                                    <div className="pt-2">
                                        <label className="flex items-center gap-3 p-4 bg-slate-900/50 border border-slate-700/80 rounded-xl cursor-pointer hover:bg-slate-800/80 transition-all group">
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 rounded border-slate-600 bg-slate-950 text-violet-500 focus:ring-violet-500/30 focus:ring-offset-0"
                                                checked={formData.features.includes('Open to Collaboration')}
                                                onChange={() => toggleFeature('Open to Collaboration')}
                                            />
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-white group-hover:text-violet-400 transition-colors">Open to Collaboration</span>
                                                <span className="text-xs text-slate-500">Enable this if you are open to working with other agents</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Media (Photos) */}
                    {
                        step === 2 && (
                            <div className="p-8 md:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                                {/* Media Links Section */}
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Camera className="w-5 h-5 text-pink-500" />
                                        <h3 className="text-lg font-bold text-white">Media Links</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium mb-2 text-slate-300">YouTube Video</label>
                                            <input
                                                type="url"
                                                name="youtubeVideoUrl"
                                                value={formData.youtubeVideoUrl}
                                                onChange={handleChange}
                                                placeholder="https://youtube.com/watch?v=..."
                                                className="w-full bg-slate-950/50 border border-slate-700/80 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500 outline-none transition-all text-white placeholder-slate-600 hover:border-slate-600"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2 text-slate-300">Video or 360 Virtual Tour Link</label>
                                            <input
                                                type="url"
                                                name="videoUrl"
                                                value={formData.videoUrl}
                                                onChange={handleChange}
                                                placeholder="https://vimeo.com/... or https://matterport.com/..."
                                                className="w-full bg-slate-950/50 border border-slate-700/80 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500 outline-none transition-all text-white placeholder-slate-600 hover:border-slate-600"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2 text-slate-300">Social Media Listing URL</label>
                                            <input
                                                type="url"
                                                name="socialMediaUrl"
                                                value={formData.socialMediaUrl}
                                                onChange={handleChange}
                                                placeholder="Instagram Reel, TikTok, YouTube Short..."
                                                className="w-full bg-slate-950/50 border border-slate-700/80 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500 outline-none transition-all text-white placeholder-slate-600 hover:border-slate-600"
                                            />
                                        </div>
                                        <div className="relative">
                                            <label className="block text-sm font-medium mb-2 text-slate-300 flex items-center gap-2">
                                                Virtual Tour
                                                {!isVirtualTourUnlocked && <Lock className="w-3 h-3 text-amber-500" />}
                                            </label>

                                            {!isVirtualTourUnlocked ? (
                                                <div
                                                    className="border border-slate-800 bg-slate-900/50 rounded-xl p-6 text-center border-dashed"
                                                >
                                                    <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                                                        <Lock className="w-5 h-5 text-slate-400" />
                                                    </div>
                                                    <h4 className="text-white font-bold mb-1">Feature Locked</h4>
                                                    <p className="text-sm text-slate-400 mb-4">
                                                        Upgrade your plan to add Virtual Tours, or unlock it for this listing with credits.
                                                    </p>
                                                    <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                                                        <button
                                                            type="button"
                                                            onClick={handleUnlockVirtualTour}
                                                            disabled={isUnlockingTour || loadingTourCost}
                                                            className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors disabled:opacity-50 text-xs shadow-lg shadow-yellow-900/20"
                                                        >
                                                            {isUnlockingTour ? (
                                                               <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                            ) : (
                                                               <Coins className="w-3.5 h-3.5" />
                                                            )}
                                                            {loadingTourCost ? 'Loading cost...' : `Deblochează cu ${virtualTourCost} ${virtualTourCost === 1 ? 'credit' : 'credite'}`}
                                                        </button>
                                                        
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowUpgradeModal(true)}
                                                            className="text-slate-400 hover:text-white px-4 py-2 rounded-lg font-bold border border-slate-700 hover:bg-slate-800/50 transition-all text-xs"
                                                        >
                                                            Upgrade to PRO
                                                        </button>
                                                    </div>
                                                    {agentProfile && (
                                                        <p className="text-slate-500 text-xs mt-3">
                                                            Balanță cont: <span className="font-semibold text-yellow-500">{agentProfile.credits || 0} credite</span>
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    <input
                                                        type="url"
                                                        name="virtualTourUrl"
                                                        value={formData.virtualTourUrl}
                                                        onChange={handleChange}
                                                        placeholder="https://my.matterport.com/show/?m=..."
                                                        className="w-full bg-slate-950/50 border border-slate-700/80 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500 outline-none transition-all text-white placeholder-slate-600 hover:border-slate-600"
                                                    />
                                                    {availableTours.length > 0 && (
                                                        <div className="relative">
                                                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                                                <div className="w-full border-t border-slate-800"></div>
                                                            </div>
                                                            <div className="relative flex justify-center text-xs uppercase">
                                                                <span className="bg-slate-950 px-2 text-slate-500">Or select internal tour</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {availableTours.length > 0 && (
                                                        <select
                                                            onChange={(e) => {
                                                                if (e.target.value) {
                                                                    // Use window.location.origin to construct full URL or just relative?
                                                                    // Backend expects full URL usually.
                                                                    const url = `${window.location.origin}/tours/${e.target.value}`;
                                                                    setFormData(prev => ({ ...prev, virtualTourUrl: url }));
                                                                }
                                                            }}
                                                            value={availableTours.find(t => formData.virtualTourUrl.includes(t.id))?.id || ''}
                                                            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-slate-300 focus:ring-2 focus:ring-pink-500/30 outline-none"
                                                        >
                                                            <option value="">-- Choose from My Tours --</option>
                                                            {availableTours.map(tour => (
                                                                <option key={tour.id} value={tour.id}>
                                                                    {tour.title}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-slate-800 my-6" />

                                {/* Internal Details Section */}
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Layout className="w-5 h-5 text-slate-400" />
                                        <h3 className="text-lg font-bold text-white">Internal Details</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium mb-2 text-slate-300">Social Media Listing URL</label>
                                            <input
                                                type="url"
                                                name="socialMediaUrl"
                                                value={formData.socialMediaUrl}
                                                onChange={handleChange}
                                                placeholder="Facebook/Instagram Post URL"
                                                className="w-full bg-slate-950/50 border border-slate-700/80 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-500/30 focus:border-slate-500 outline-none transition-all text-white placeholder-slate-600 hover:border-slate-600"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2 text-slate-300">Personal / Internal ID</label>
                                            <input
                                                type="text"
                                                name="personalId"
                                                value={formData.personalId}
                                                onChange={handleChange}
                                                placeholder="Optional internal reference"
                                                className="w-full bg-slate-950/50 border border-slate-700/80 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-slate-500/30 focus:border-slate-500 outline-none transition-all text-white placeholder-slate-600 hover:border-slate-600"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-slate-800 my-6" />

                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center border border-violet-500/30 shadow-inner">
                                        <ImageIcon className="w-6 h-6 text-violet-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">Property Photos</h2>
                                        <p className="text-slate-400 text-sm">Upload high-quality images of your property.</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {formData.images.length > 0 ? (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {formData.images.map((img, index) => (
                                                <div
                                                    key={index}
                                                    draggable
                                                    onDragStart={(e) => handlePhotoDragStart(e, index)}
                                                    onDragOver={(e) => handlePhotoDragOver(e, index)}
                                                    onDragLeave={() => handlePhotoDragLeave(index)}
                                                    onDrop={(e) => handlePhotoDrop(e, index)}
                                                    onDragEnd={handlePhotoDragEnd}
                                                    className={`relative aspect-[4/3] group rounded-xl overflow-hidden border transition-all cursor-grab active:cursor-grabbing ${
                                                        draggedPhotoIndex === index
                                                            ? 'opacity-40 border-violet-500 scale-95'
                                                            : hoveredPhotoIndex === index
                                                                ? 'border-violet-500 scale-[1.03] shadow-lg shadow-violet-500/25'
                                                                : 'border-slate-700 hover:border-slate-500'
                                                    }`}
                                                >
                                                    <img src={img} alt={`Property ${index + 1}`} className="w-full h-full object-cover select-none pointer-events-none" />
                                                    
                                                    {/* Drag Hint Overlay */}
                                                    <div className="absolute top-2 left-2 bg-slate-900/80 text-slate-300 p-1.5 rounded-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity pointer-events-none" title="Drag to reorder">
                                                        <Move size={14} />
                                                    </div>

                                                    {/* Move Left Button (Mobile/Touch Fallback) */}
                                                    {index > 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const newImages = [...formData.images];
                                                                const temp = newImages[index];
                                                                newImages[index] = newImages[index - 1];
                                                                newImages[index - 1] = temp;
                                                                setFormData(prev => ({ ...prev, images: newImages }));
                                                            }}
                                                            className="absolute bottom-2 left-2 bg-slate-900/80 text-white p-1.5 rounded-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-slate-800"
                                                            title="Move Left"
                                                        >
                                                            <ChevronLeft size={14} />
                                                        </button>
                                                    )}

                                                    {/* Move Right Button (Mobile/Touch Fallback) */}
                                                    {index < formData.images.length - 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const newImages = [...formData.images];
                                                                const temp = newImages[index];
                                                                newImages[index] = newImages[index + 1];
                                                                newImages[index + 1] = temp;
                                                                setFormData(prev => ({ ...prev, images: newImages }));
                                                            }}
                                                            className="absolute bottom-2 right-2 bg-slate-900/80 text-white p-1.5 rounded-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-slate-800"
                                                            title="Move Right"
                                                        >
                                                            <ChevronRight size={14} />
                                                        </button>
                                                    )}

                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
                                                        }}
                                                        className="absolute top-2 right-2 bg-red-500/80 text-white p-1.5 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                            <label
                                                onDragOver={handleDragOver}
                                                onDragLeave={handleDragLeave}
                                                onDrop={handleDrop}
                                                className="border-2 border-dashed border-slate-800 bg-slate-950/30 rounded-xl flex items-center justify-center aspect-[4/3] hover:bg-slate-900/50 hover:border-violet-500/50 transition-all cursor-pointer"
                                            >
                                                <div className="text-center">
                                                    <input
                                                        type="file"
                                                        multiple
                                                        accept="image/*"
                                                        onChange={handleImageUpload}
                                                        className="hidden"
                                                        disabled={uploading}
                                                    />
                                                    {uploading ? (
                                                        <Loader2 className="w-6 h-6 text-violet-500 animate-spin mx-auto mb-2" />
                                                    ) : (
                                                        <Upload className="w-6 h-6 text-slate-500 mx-auto mb-2" />
                                                    )}
                                                    <span className="text-xs text-slate-500">{uploading ? '...' : 'Add More'}</span>
                                                </div>
                                            </label>
                                        </div>
                                    ) : (
                                        <label
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                            className="border-2 border-dashed border-slate-800 bg-slate-950/30 rounded-2xl p-12 text-center hover:bg-slate-900/50 hover:border-violet-500/50 transition-all cursor-pointer group relative overflow-hidden block"
                                        >
                                            <input
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="hidden"
                                                disabled={uploading}
                                            />
                                            <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 border border-slate-800 group-hover:border-violet-500/30 z-10 relative">
                                                {uploading ? (
                                                    <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                                                ) : (
                                                    <ImageIcon className="w-8 h-8 text-slate-500 group-hover:text-violet-400 transition-colors" />
                                                )}
                                            </div>
                                            <p className="text-slate-400 font-medium z-10 relative group-hover:text-white transition-colors">
                                                {uploading ? 'Uploading...' : 'Click to upload or drag and drop photos'}
                                            </p>
                                            <p className="text-xs text-slate-600 mt-2 z-10 relative">Up to 10 images, max 5MB each</p>

                                            {/* Hover Glow */}
                                            <div className="absolute inset-0 bg-gradient-to-tr from-violet-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </label>
                                    )}
                                </div>

                                <div className="border-t border-slate-800 my-8" />

                                {/* Watermark configuration section */}
                                {adminWatermark?.is_active && adminWatermark?.override_users ? (
                                    <div className="bg-violet-950/20 border border-violet-800/30 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
                                        <div className="w-12 h-12 rounded-full bg-violet-900/50 flex items-center justify-center border border-violet-500/20 flex-shrink-0">
                                            <Info className="w-6 h-6 text-violet-400" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-white font-bold mb-1">Watermark Enforced by Admin</h4>
                                            <p className="text-sm text-slate-400">
                                                A default platform watermark logo is currently active. All listing images you upload will be stamped automatically using the platform's layout configuration.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
                                        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                                            <ImageIcon className="w-6 h-6 text-pink-500" />
                                            <div>
                                                <h3 className="text-lg font-bold text-white">Custom Image Watermark</h3>
                                                <p className="text-slate-400 text-xs mt-0.5">Stamp your own brand or logo on listing photos before uploading them.</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start justify-between gap-6">
                                            <div className="flex-1">
                                                <span className="text-sm font-semibold text-white">Enable Watermark Overlay</span>
                                                <p className="text-slate-400 text-xs mt-1">If enabled, your logo watermark will be overlaid on all new images uploaded.</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newVal = !userWatermark.is_active;
                                                    saveUserWatermark({ ...userWatermark, is_active: newVal });
                                                }}
                                                className={`relative inline-flex h-6 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${userWatermark.is_active ? 'bg-pink-500' : 'bg-slate-700'}`}
                                            >
                                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${userWatermark.is_active ? 'translate-x-6' : 'translate-x-0'}`} />
                                            </button>
                                        </div>

                                        {userWatermark.is_active && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-800/50">
                                                <div className="space-y-5">
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-300 mb-2">Watermark Logo (PNG/JPEG, max 1.5MB)</label>
                                                        <div className="flex items-center gap-4">
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                id="user-watermark-logo-input"
                                                                onChange={handleUserLogoUpload}
                                                                className="hidden"
                                                            />
                                                            <label
                                                                htmlFor="user-watermark-logo-input"
                                                                className="flex items-center gap-2 cursor-pointer bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-xs font-medium text-slate-300 transition-colors"
                                                            >
                                                                <Upload className="w-3.5 h-3.5" />
                                                                {isUploadingUserLogo ? 'Uploading...' : 'Choose Image'}
                                                            </label>
                                                            {userWatermark.logo_url && (
                                                                <span className="text-xs text-emerald-400 font-medium">Uploaded & Loaded</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-xs font-semibold text-slate-300 mb-2">
                                                                Opacity ({Math.round(userWatermark.opacity * 100)}%)
                                                            </label>
                                                            <input
                                                                type="range"
                                                                min="0.1"
                                                                max="1.0"
                                                                step="0.05"
                                                                value={userWatermark.opacity}
                                                                onChange={(e) => saveUserWatermark({ ...userWatermark, opacity: parseFloat(e.target.value) })}
                                                                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-semibold text-slate-300 mb-2">
                                                                Size ({userWatermark.size}%)
                                                            </label>
                                                            <input
                                                                type="range"
                                                                min="10"
                                                                max="50"
                                                                step="1"
                                                                value={userWatermark.size}
                                                                onChange={(e) => saveUserWatermark({ ...userWatermark, size: parseInt(e.target.value) })}
                                                                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-300 mb-2">Watermark Position</label>
                                                        <select
                                                            value={userWatermark.position}
                                                            onChange={(e) => saveUserWatermark({ ...userWatermark, position: e.target.value })}
                                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500 transition-colors"
                                                        >
                                                            <option value="center">Center</option>
                                                            <option value="top-left">Top Left</option>
                                                            <option value="top-right">Top Right</option>
                                                            <option value="bottom-left">Bottom Left</option>
                                                            <option value="bottom-right">Bottom Right</option>
                                                            <option value="tile">Tiled (Pattern)</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col">
                                                    <span className="text-xs font-semibold text-slate-300 mb-2">Watermark Preview</span>
                                                    <div className="w-full h-36 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center relative overflow-hidden">
                                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 select-none">
                                                            <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Photo Backdrop</span>
                                                        </div>

                                                        {userWatermark.logo_url ? (
                                                            userWatermark.position === 'tile' ? (
                                                                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 p-1.5 gap-1.5 pointer-events-none">
                                                                    {[...Array(9)].map((_, i) => (
                                                                        <div key={i} className="flex items-center justify-center">
                                                                            <img
                                                                                src={userWatermark.logo_url}
                                                                                alt="Watermark Tile"
                                                                                className="max-h-5 object-contain"
                                                                                style={{ opacity: userWatermark.opacity }}
                                                                            />
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <img
                                                                    src={userWatermark.logo_url}
                                                                    alt="Watermark Preview"
                                                                    className={`absolute max-h-[85%] object-contain pointer-events-none transition-all ${
                                                                        userWatermark.position === 'center' ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' :
                                                                        userWatermark.position === 'top-left' ? 'top-2.5 left-2.5' :
                                                                        userWatermark.position === 'top-right' ? 'top-2.5 right-2.5' :
                                                                        userWatermark.position === 'bottom-left' ? 'bottom-2.5 left-2.5' :
                                                                        'bottom-2.5 right-2.5'
                                                                    }`}
                                                                    style={{
                                                                        width: `${userWatermark.size}%`,
                                                                        opacity: userWatermark.opacity
                                                                    }}
                                                                />
                                                            )
                                                        ) : (
                                                            <div className="text-slate-500 text-xs italic">Choose a logo to see the watermark preview</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    }

                    {/* Step 3: Specifications & Features */}
                    {
                        step === 3 && (
                            <div className="p-8 md:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center border border-violet-500/30 shadow-inner">
                                        <CheckCircle2 className="w-6 h-6 text-violet-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">Amenities</h2>
                                        <p className="text-slate-400 text-sm">Select all features that apply.</p>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    {Object.entries(FEATURE_CATEGORIES).map(([category, features]) => {
                                        const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS['Unit Features'];
                                        return (
                                            <div key={category} className="bg-slate-950/30 rounded-2xl p-5 border border-slate-800">
                                                <h3 className={`text-xs font-bold uppercase tracking-wider ${colors.text} mb-4 flex items-center gap-2`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                                                    {category}
                                                </h3>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                    {features.map(feature => (
                                                        <button
                                                            key={feature}
                                                            type="button"
                                                            onClick={() => toggleFeature(feature)}
                                                            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-medium transition-all text-left duration-200 ${formData.features.includes(feature)
                                                                ? `${colors.bg} text-white shadow-lg ${colors.shadow} scale-[1.02] border ${colors.border}`
                                                                : 'bg-slate-900/50 text-slate-400 border border-slate-800 hover:border-slate-600 hover:text-slate-200'
                                                                }`}
                                                        >
                                                            {formData.features.includes(feature) ? (
                                                                <Check className="w-3.5 h-3.5 shrink-0 text-white" />
                                                            ) : (
                                                                <div className="w-3.5 h-3.5 rounded-full border border-slate-600 shrink-0" />
                                                            )}
                                                            <span className="truncate">{feature}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )
                    }

                    {/* Step 4: Private Info */}
                    {
                        step === 4 && (
                            <div className="p-8 md:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/30 shadow-inner">
                                        <Lock className="w-6 h-6 text-amber-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">Private Information</h2>
                                        <p className="text-slate-400 text-sm">Confidential details visible only to you and admins.</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 space-y-6">
                                        <div className="flex items-center gap-3 text-amber-500 mb-2">
                                            <AlertCircle className="w-5 h-5" />
                                            <span className="text-sm font-bold uppercase tracking-wider">Confidential Private Data</span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium mb-2 text-slate-300">Owner Name (Private)</label>
                                                <input
                                                    type="text"
                                                    name="ownerName"
                                                    value={formData.ownerName}
                                                    onChange={handleChange}
                                                    placeholder="Full Name"
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-2 text-slate-300">Owner Phone (Private)</label>
                                                <input
                                                    type="text"
                                                    name="ownerPhone"
                                                    value={formData.ownerPhone}
                                                    onChange={handleChange}
                                                    placeholder="+1 (555) 000-0000"
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
                                                />
                                            </div>
                                        </div>



                                        <div>
                                            <label className="block text-sm font-medium mb-2 text-slate-300">Private Notes</label>
                                            <textarea
                                                name="privateNotes"
                                                rows={6}
                                                value={formData.privateNotes}
                                                onChange={handleChange}
                                                placeholder="Internal notes, access codes, owner contacts, negotiation details..."
                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all resize-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2 text-slate-300">Private Documents</label>
                                            <div className="space-y-4">
                                                {/* Upload Button */}
                                                <div className="flex items-center gap-4">
                                                    <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 font-medium text-sm transition-all cursor-pointer ${isUploadingDocs ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-700 text-white hover:border-slate-600'}`}>
                                                        {isUploadingDocs ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                                        <span>{isUploadingDocs ? 'Uploading...' : 'Upload Files'}</span>
                                                        <input
                                                            type="file"
                                                            multiple
                                                            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                                                            onChange={handleDocumentUpload}
                                                            disabled={isUploadingDocs}
                                                            className="hidden"
                                                        />
                                                    </label>
                                                    <span className="text-xs text-slate-500">PDF, DOC, Images (Max 10MB)</span>
                                                </div>

                                                {/* Document List */}
                                                <div className="space-y-2">
                                                    {formData.documents.map((doc, idx) => (
                                                        <div key={idx} className="flex items-center gap-2 group">
                                                            <div className="flex-1 flex items-center gap-3 bg-slate-900/50 border border-slate-700 rounded-lg p-3">
                                                                <FileText className="w-4 h-4 text-violet-400 shrink-0" />
                                                                <input
                                                                    type="text"
                                                                    value={doc}
                                                                    readOnly
                                                                    className="flex-1 bg-transparent border-none p-0 text-slate-300 text-sm focus:ring-0 truncate"
                                                                />
                                                                <a href={doc} target="_blank" rel="noopener noreferrer" className="text-xs text-violet-400 hover:text-violet-300 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    View
                                                                </a>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => setFormData(prev => ({ ...prev, documents: prev.documents.filter((_, i) => i !== idx) }))}
                                                                className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Manual URL Input */}
                                                <div className="flex gap-2">
                                                    <input
                                                        type="url"
                                                        placeholder="Or paste document URL (Dropbox, Google Drive, etc.)"
                                                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all text-sm"
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                const input = e.currentTarget;
                                                                if (input.value) {
                                                                    setFormData(prev => ({ ...prev, documents: [...prev.documents, input.value] }));
                                                                    input.value = '';
                                                                }
                                                            }
                                                        }}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="bg-slate-800 hover:bg-slate-700 text-white px-4 rounded-lg text-sm font-medium transition-colors border border-slate-700"
                                                        onClick={(e) => {
                                                            const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                                            if (input.value) {
                                                                setFormData(prev => ({ ...prev, documents: [...prev.documents, input.value] }));
                                                                input.value = '';
                                                            }
                                                        }}
                                                    >
                                                        Add URL
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="border-t border-slate-700/50 pt-6">
                                            <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-violet-400" />
                                                Exact Location Address (For Contract)
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Country</label>
                                                    <input
                                                        type="text"
                                                        name="contractCountry"
                                                        value={formData.contractCountry}
                                                        onChange={handleChange}
                                                        placeholder="e.g. România"
                                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">City</label>
                                                    <input
                                                        type="text"
                                                        name="contractCity"
                                                        value={formData.contractCity}
                                                        onChange={handleChange}
                                                        placeholder="e.g. Timișoara"
                                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Street Address</label>
                                                    <input
                                                        type="text"
                                                        name="contractStreet"
                                                        value={formData.contractStreet}
                                                        onChange={handleChange}
                                                        placeholder="e.g. Bulevardul Revoluției"
                                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Building Nr.</label>
                                                    <input
                                                        type="text"
                                                        name="contractBuilding"
                                                        value={formData.contractBuilding}
                                                        onChange={handleChange}
                                                        placeholder="e.g. 12A"
                                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Floor Nr.</label>
                                                    <input
                                                        type="text"
                                                        name="contractFloor"
                                                        value={formData.contractFloor}
                                                        onChange={handleChange}
                                                        placeholder="e.g. 3"
                                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Apartment Nr.</label>
                                                    <input
                                                        type="text"
                                                        name="contractApartment"
                                                        value={formData.contractApartment}
                                                        onChange={handleChange}
                                                        placeholder="e.g. 14"
                                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all text-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="border-t border-slate-700/50 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium mb-2 text-slate-300">ID Number and Serial (For Contract)</label>
                                                <input
                                                    type="text"
                                                    name="contractOwnerId"
                                                    value={formData.contractOwnerId}
                                                    onChange={handleChange}
                                                    placeholder="e.g. AX 123456"
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-2 text-slate-300">CNP (For Contract)</label>
                                                <input
                                                    type="text"
                                                    name="contractOwnerCnp"
                                                    value={formData.contractOwnerCnp}
                                                    onChange={handleChange}
                                                    placeholder="e.g. 1950203xxxxxx"
                                                    maxLength={13}
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div className="border-t border-slate-700/50 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium mb-2 text-slate-300">CF/NR. Topo (For Contract)</label>
                                                <input
                                                    type="text"
                                                    name="contractCfTopo"
                                                    value={formData.contractCfTopo}
                                                    onChange={handleChange}
                                                    placeholder="e.g. CF 12345 Timișoara / Topo 678/2"
                                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
                                                />
                                            </div>
                                        </div>

                                                                        <div className="border-t border-slate-700/50 pt-6 flex justify-between items-center flex-wrap gap-4">
                                            <div className="text-slate-400 text-xs max-w-md">
                                                Generează un contract de colaborare standard conform legislației românești în vigoare, folosind datele firmei tale din profil și datele confidențiale de mai sus.
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <select
                                                        value={contractLanguage}
                                                        onChange={(e) => setContractLanguage(e.target.value as 'ro' | 'en')}
                                                        className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-300 focus:ring-2 focus:ring-violet-500/30 outline-none appearance-none pr-8 cursor-pointer"
                                                    >
                                                        <option value="ro">Română (RO)</option>
                                                        <option value="en">English (EN)</option>
                                                    </select>
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handleGenerateContract}
                                                    className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2 text-sm border border-orange-400/20 active:scale-[0.98]"
                                                >
                                                    <FileText className="w-4 h-4" />
                                                    Generate Collaboration Contract
                                                </button>
                                                {existingContract && (
                                                    <div className="flex gap-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => window.open(`/properties/contract-preview?id=${existingContract.id}`, '_blank')}
                                                            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 text-sm border border-slate-700 active:scale-[0.98]"
                                                        >
                                                            <FileText className="w-4 h-4 text-orange-400" />
                                                            {contractLanguage === 'ro' ? 'Vezi Contract existent' : 'View Existing Contract'}
                                                        </button>
                                                        {existingContract.anexa_data && (
                                                            <button
                                                                type="button"
                                                                onClick={() => window.open(`/properties/anexa1-preview?id=${existingContract.id}`, '_blank')}
                                                                className="px-6 py-3 bg-cyan-900/40 hover:bg-cyan-900/60 text-cyan-200 font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 text-sm border border-cyan-800/80 active:scale-[0.98]"
                                                            >
                                                                <FileText className="w-4 h-4 text-cyan-400" />
                                                                {contractLanguage === 'ro' ? 'Vezi Anexa 1' : 'View Annex 1'}
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Event Management Section */}
                                <div className="mt-8 pt-8 border-t border-slate-800">
                                    {propertyId ? (
                                        <EventClient propertyId={propertyId} />
                                    ) : (
                                        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="p-2 bg-violet-500/20 rounded-lg">
                                                    <Calendar className="w-5 h-5 text-violet-400" />
                                                </div>
                                                <h3 className="text-lg font-bold text-white">Property Events (Open House)</h3>
                                            </div>
                                            <p className="text-slate-400 text-sm">
                                                Save the property first to schedule open house events and manage your calendar.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Valuation Section */}
                                <div className="mt-8 pt-8 border-t border-slate-800">
                                    {propertyId ? (
                                        <>
                                            <PropertyValuationSection
                                                property={{
                                                    id: propertyId,
                                                    currency: formData.currency,
                                                    title: formData.title,
                                                    address: formData.address,
                                                    location_city: formData.city
                                                }}
                                                showMakeOffer={false}
                                                isMakeOfferLocked={false}
                                                showValuationWidget={false}
                                                darkMode={true}
                                            />
                                            <div className="mt-6 flex justify-center">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsReportSoldModalOpen(true)}
                                                    className="group relative px-8 py-4 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 hover:from-emerald-600/30 hover:to-teal-600/30 border border-emerald-500/30 rounded-2xl transition-all duration-300 shadow-lg shadow-emerald-900/10 flex items-center gap-3 overflow-hidden"
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                                                    <div className="text-left">
                                                        <p className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                                                            Ad Transaction Price
                                                            {portalCosts.price_contribution_reward > 0 && (
                                                                <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold text-[10px] flex items-center gap-0.5 border border-emerald-500/30 font-mono normal-case">
                                                                    +{portalCosts.price_contribution_reward} CR Reward
                                                                </span>
                                                            )}
                                                        </p>
                                                        <p className="text-lg font-black text-white leading-tight">Report SOLD</p>
                                                    </div>
                                                    <ArrowRight className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-emerald-500/20 rounded-lg">
                                                        <DollarSign className="w-5 h-5 text-emerald-400" />
                                                    </div>
                                                    <h3 className="text-lg font-bold text-white">Contribute to Price / Market Valuation</h3>
                                                </div>
                                                {portalCosts.price_contribution_reward > 0 && (
                                                    <span className="bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full font-bold text-xs flex items-center gap-1 border border-emerald-500/20 font-mono">
                                                        <Coins className="w-3.5 h-3.5 text-emerald-450" />
                                                        +{portalCosts.price_contribution_reward} CR Reward
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-slate-400 text-sm">
                                                Save the property first to enable market valuation and price contribution features.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    }

                    
                    {/* Step 5: Auto-Posting */}
                    {step === 5 && (
                        <div className="p-8 md:p-10 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/30 shadow-inner">
                                    <Globe className="w-6 h-6 text-indigo-400" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Export to Portals & Auto-Posting</h2>
                                    <p className="text-slate-400 text-sm">Distribute your property to multiple platforms automatically.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Imobiliare.ro */}
                                <div className={`p-5 rounded-xl border transition-all ${getActivationStatus('imobiliare') === 'active' && formData.publishImobiliare ? 'bg-blue-500/10 border-blue-500/50' : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'}`}>
                                    <div className="flex items-center justify-between gap-2 mb-3">
                                        <h4 className={`font-bold ${getActivationStatus('imobiliare') === 'active' && formData.publishImobiliare ? 'text-blue-400' : 'text-slate-300'}`}>Publish to Imobiliare.ro</h4>
                                        {portalCosts.publish_imobiliare > 0 && (
                                            <span className="bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-full font-bold text-[10px] flex items-center gap-1 border border-yellow-500/20 font-mono shrink-0">
                                                <Coins className="w-2.5 h-2.5 text-yellow-500" />
                                                {portalCosts.publish_imobiliare} CR
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-500 mb-4">Include this property in the Imobiliare XML auto-sync feed.</p>
                                    
                                    {getActivationStatus('imobiliare') === 'active' ? (
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input type="checkbox" checked={formData.publishImobiliare} onChange={(e) => setFormData({ ...formData, publishImobiliare: e.target.checked })} className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500" />
                                            <span className="text-sm font-medium text-slate-300">Enable Auto-Posting</span>
                                        </label>
                                    ) : getActivationStatus('imobiliare') === 'pending' ? (
                                        <button disabled className="w-full py-2 bg-slate-800 text-slate-400 rounded-lg text-sm font-medium border border-slate-700 flex justify-center items-center gap-2 cursor-not-allowed">
                                            <Check className="w-4 h-4" /> Request Sent for Activation
                                        </button>
                                    ) : (
                                        <button type="button" onClick={(e) => { e.preventDefault(); handleRequestActivation('imobiliare'); }} disabled={requestingActivation === 'imobiliare'} className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium shadow-lg transition-colors flex justify-center items-center gap-2">
                                            {requestingActivation === 'imobiliare' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Request Account Activation'}
                                        </button>
                                    )}
                                </div>

                                {/* Storia / OLX */}
                                <div className={`p-5 rounded-xl border transition-all ${getActivationStatus('storia') === 'active' && formData.publishStoria ? 'bg-cyan-500/10 border-cyan-500/50' : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'}`}>
                                    <div className="flex items-center justify-between gap-2 mb-3">
                                        <h4 className={`font-bold ${getActivationStatus('storia') === 'active' && formData.publishStoria ? 'text-cyan-400' : 'text-slate-300'}`}>Publish to Storia / OLX</h4>
                                        {portalCosts.publish_storia > 0 && (
                                            <span className="bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-full font-bold text-[10px] flex items-center gap-1 border border-yellow-500/20 font-mono shrink-0">
                                                <Coins className="w-2.5 h-2.5 text-yellow-500" />
                                                {portalCosts.publish_storia} CR
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-500 mb-4">Include this property in the Storia XML auto-sync feed.</p>
                                    
                                    {getActivationStatus('storia') === 'active' ? (
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input type="checkbox" checked={formData.publishStoria} onChange={(e) => setFormData({ ...formData, publishStoria: e.target.checked })} className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500" />
                                            <span className="text-sm font-medium text-slate-300">Enable Auto-Posting</span>
                                        </label>
                                    ) : getActivationStatus('storia') === 'pending' ? (
                                        <button disabled className="w-full py-2 bg-slate-800 text-slate-400 rounded-lg text-sm font-medium border border-slate-700 flex justify-center items-center gap-2 cursor-not-allowed">
                                            <Check className="w-4 h-4" /> Request Sent for Activation
                                        </button>
                                    ) : (
                                        <button type="button" onClick={(e) => { e.preventDefault(); handleRequestActivation('storia'); }} disabled={requestingActivation === 'storia'} className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium shadow-lg transition-colors flex justify-center items-center gap-2">
                                            {requestingActivation === 'storia' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Request Account Activation'}
                                        </button>
                                    )}
                                </div>

                                {/* Romimo / Publi24 */}
                                <div className={`p-5 rounded-xl border transition-all ${getActivationStatus('romimo') === 'active' && formData.publishRomimo ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'}`}>
                                    <div className="flex items-center justify-between gap-2 mb-3">
                                        <div className="flex items-center gap-2">
                                            <h4 className={`font-bold ${getActivationStatus('romimo') === 'active' && formData.publishRomimo ? 'text-indigo-400' : 'text-slate-300'}`}>Publish to Romimo / Publi24</h4>
                                            <button type="button" onClick={(e) => { e.preventDefault(); setShowRomimoInfo(true); }} className="text-slate-400 hover:text-indigo-400 transition-colors">
                                                <Info className="w-4 h-4" />
                                            </button>
                                        </div>
                                        {portalCosts.publish_romimo > 0 && (
                                            <span className="bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-full font-bold text-[10px] flex items-center gap-1 border border-yellow-500/20 font-mono shrink-0">
                                                <Coins className="w-2.5 h-2.5 text-yellow-500" />
                                                {portalCosts.publish_romimo} CR
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-500 mb-4">Direct integration with Romimo API.</p>
                                    
                                    {getActivationStatus('romimo') === 'active' ? (
                                        <div className="space-y-3">
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input type="checkbox" checked={formData.publishRomimo} onChange={(e) => setFormData({ ...formData, publishRomimo: e.target.checked })} className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500" />
                                                <span className="text-sm font-medium text-slate-300">Enable Auto-Posting</span>
                                            </label>
                                            
                                            {formData.publishRomimo && (
                                                <div className="pl-7 pt-1">
                                                    <label className="flex items-center justify-between gap-3 cursor-pointer group">
                                                        <div className="flex items-center gap-3">
                                                            <input type="checkbox" checked={formData.promoteRomimo} onChange={(e) => setFormData({ ...formData, promoteRomimo: e.target.checked })} className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-yellow-500 focus:ring-yellow-500 focus:ring-offset-slate-900 focus:ring-offset-2" />
                                                            <span className="text-xs font-semibold text-slate-400 group-hover:text-slate-300 transition-colors">Promote Listing (Use Romimo Promo Points)</span>
                                                        </div>
                                                        {(!initialData?.promoted) && portalCosts.promote_romimo > 0 && (
                                                            <span className="bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-full font-bold text-[9px] flex items-center gap-1 border border-yellow-500/20 font-mono shrink-0">
                                                                <Coins className="w-2 h-2 text-yellow-500" />
                                                                +{portalCosts.promote_romimo} CR
                                                            </span>
                                                        )}
                                                    </label>
                                                </div>
                                            )}
                                        </div>
                                    ) : getActivationStatus('romimo') === 'pending' ? (
                                        <button disabled className="w-full py-2 bg-slate-800 text-slate-400 rounded-lg text-sm font-medium border border-slate-700 flex justify-center items-center gap-2 cursor-not-allowed">
                                            <Check className="w-4 h-4" /> Request Sent for Activation
                                        </button>
                                    ) : (
                                        <button type="button" onClick={(e) => { e.preventDefault(); handleRequestActivation('romimo'); }} disabled={requestingActivation === 'romimo'} className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium shadow-lg transition-colors flex justify-center items-center gap-2">
                                            {requestingActivation === 'romimo' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Request Account Activation'}
                                        </button>
                                    )}

                                    {romimoStats && (
                                        <div className="mt-4 p-4 bg-slate-950/40 rounded-xl border border-indigo-500/20 space-y-3">
                                            <div className="text-xs font-semibold text-indigo-400 flex items-center gap-2">
                                                <Globe className="w-3.5 h-3.5" />
                                                <span>Romimo / Publi24 Package Details</span>
                                            </div>
                                            {romimoStats.error ? (
                                                <div className="text-xs text-amber-500/80 bg-amber-500/5 p-2.5 rounded-lg border border-amber-500/10">
                                                    Could not load live package stats from Romimo. Make sure your Romimo account is active.
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-2 gap-3 text-xs">
                                                    <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                                                        <div className="text-slate-500 mb-0.5">Package Status</div>
                                                        <div className={`font-bold ${romimoStats.active ? 'text-emerald-400' : 'text-red-400'}`}>
                                                            {romimoStats.active ? 'Active' : 'Inactive'}
                                                        </div>
                                                    </div>
                                                    <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                                                        <div className="text-slate-500 mb-0.5">Promo Points</div>
                                                        <div className="font-bold text-white">{romimoStats.promoPoints}</div>
                                                    </div>
                                                    <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800 col-span-2 flex justify-between items-center">
                                                        <div>
                                                            <div className="text-slate-500 mb-0.5">Active Listing Slots</div>
                                                            <div className="text-[10px] text-slate-500 font-mono">{romimoStats.email}</div>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-sm font-bold text-white">{romimoStats.activeAdsCount}</span>
                                                            <span className="text-slate-500"> / {romimoStats.activeAdsLimit} used</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* HomeZZ / LaJumate */}
                                <div className={`p-5 rounded-xl border transition-all ${getActivationStatus('homezz') === 'active' && formData.publishHomezz ? 'bg-violet-500/10 border-violet-500/50' : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'}`}>
                                    <div className="flex items-center justify-between gap-2 mb-3">
                                        <h4 className={`font-bold ${getActivationStatus('homezz') === 'active' && formData.publishHomezz ? 'text-violet-400' : 'text-slate-300'}`}>Publish to HomeZZ / LaJumate</h4>
                                        {portalCosts.publish_homezz > 0 && (
                                            <span className="bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-full font-bold text-[10px] flex items-center gap-1 border border-yellow-500/20 font-mono shrink-0">
                                                <Coins className="w-2.5 h-2.5 text-yellow-500" />
                                                {portalCosts.publish_homezz} CR
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-500 mb-4">Include this property in the HomeZZ XML auto-sync feed.</p>
                                    
                                    {getActivationStatus('homezz') === 'active' ? (
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input type="checkbox" checked={formData.publishHomezz} onChange={(e) => setFormData({ ...formData, publishHomezz: e.target.checked })} className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-violet-500 focus:ring-violet-500" />
                                            <span className="text-sm font-medium text-slate-300">Enable Auto-Posting</span>
                                        </label>
                                    ) : getActivationStatus('homezz') === 'pending' ? (
                                        <button disabled className="w-full py-2 bg-slate-800 text-slate-400 rounded-lg text-sm font-medium border border-slate-700 flex justify-center items-center gap-2 cursor-not-allowed">
                                            <Check className="w-4 h-4" /> Request Sent for Activation
                                        </button>
                                    ) : (
                                        <button type="button" onClick={(e) => { e.preventDefault(); handleRequestActivation('homezz'); }} disabled={requestingActivation === 'homezz'} className="w-full py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-medium shadow-lg transition-colors flex justify-center items-center gap-2">
                                            {requestingActivation === 'homezz' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Request Account Activation'}
                                        </button>
                                    )}
                                </div>
                                {/* ImobiliarePret.ro (No activation required) */}
                                <div className={`p-5 rounded-xl border transition-all ${formData.publishImobiliarepret ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'}`}>
                                    <div className="flex items-center justify-between gap-2 mb-3">
                                        <h4 className={`font-bold ${formData.publishImobiliarepret ? 'text-emerald-400' : 'text-slate-300'}`}>Publish to ImobiliarePret.ro</h4>
                                        {portalCosts.publish_imobiliarepret > 0 && (
                                            <span className="bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-full font-bold text-[10px] flex items-center gap-1 border border-yellow-500/20 font-mono shrink-0">
                                                <Coins className="w-2.5 h-2.5 text-yellow-500" />
                                                {portalCosts.publish_imobiliarepret} CR
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-500 mb-4">Include this property in the ImobiliarePret feed.</p>
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input type="checkbox" checked={formData.publishImobiliarepret} onChange={(e) => setFormData({ ...formData, publishImobiliarepret: e.target.checked })} className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500" />
                                        <span className="text-sm font-medium text-slate-300">Enable Auto-Posting</span>
                                    </label>
                                </div>

                                {/* All Social Media Platforms and Groups */}
                                <div className={`p-5 rounded-xl border transition-all col-span-1 md:col-span-2 ${(formData.publishWhatsappGroups || formData.publishFacebookGroups || formData.publishFacebookPage || formData.publishInstagram || formData.publishTiktok) ? 'bg-pink-500/5 border-pink-500/30' : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'}`}>
                                    <div className="flex items-center justify-between gap-2 mb-3">
                                        <div className="flex items-center gap-2">
                                            <Share2 className="w-5 h-5 text-pink-500 animate-pulse" />
                                            <h4 className="font-bold text-pink-400">Publish on All Social Media Platforms and Groups</h4>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-500 mb-4">Auto-post property listing directly to social networks and chat groups.</p>
                                    
                                    {(
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-slate-800/50">
                                            {/* WhatsApp Groups */}
                                            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors">
                                                <label className="flex items-center gap-3 cursor-pointer select-none w-full">
                                                    <div className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded">
                                                        <WhatsAppIcon className="w-4.5 h-4.5" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-semibold text-slate-300">WhatsApp Groups</span>
                                                        <span className="text-[10px] text-slate-500">Auto-push to client groups</span>
                                                    </div>
                                                </label>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    {(!initialData?.publish_whatsapp_groups) && portalCosts.publish_whatsapp_groups > 0 && (
                                                        <span className="text-[10px] text-yellow-500 font-mono font-bold">{portalCosts.publish_whatsapp_groups} CR</span>
                                                    )}
                                                    <input type="checkbox" checked={formData.publishWhatsappGroups} onChange={(e) => setFormData({ ...formData, publishWhatsappGroups: e.target.checked })} className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-pink-500 focus:ring-pink-500" />
                                                </div>
                                            </div>

                                            {/* Facebook Groups */}
                                            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors">
                                                <label className="flex items-center gap-3 cursor-pointer select-none w-full">
                                                    <div className="p-1.5 bg-blue-600/10 text-blue-500 rounded">
                                                        <Facebook className="w-4.5 h-4.5" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-semibold text-slate-300">Facebook Groups</span>
                                                        <span className="text-[10px] text-slate-500">Post in real estate groups</span>
                                                    </div>
                                                </label>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    {(!initialData?.publish_facebook_groups) && portalCosts.publish_facebook_groups > 0 && (
                                                        <span className="text-[10px] text-yellow-500 font-mono font-bold">{portalCosts.publish_facebook_groups} CR</span>
                                                    )}
                                                    <input type="checkbox" checked={formData.publishFacebookGroups} onChange={(e) => setFormData({ ...formData, publishFacebookGroups: e.target.checked })} className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-pink-500 focus:ring-pink-500" />
                                                </div>
                                            </div>

                                            {/* Facebook Page */}
                                            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors">
                                                <label className="flex items-center gap-3 cursor-pointer select-none w-full">
                                                    <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded">
                                                        <Facebook className="w-4.5 h-4.5" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-semibold text-slate-300">Facebook Page</span>
                                                        <span className="text-[10px] text-slate-500">Publish on agency page</span>
                                                    </div>
                                                </label>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    {(!initialData?.publish_facebook_page) && portalCosts.publish_facebook_page > 0 && (
                                                        <span className="text-[10px] text-yellow-500 font-mono font-bold">{portalCosts.publish_facebook_page} CR</span>
                                                    )}
                                                    <input type="checkbox" checked={formData.publishFacebookPage} onChange={(e) => setFormData({ ...formData, publishFacebookPage: e.target.checked })} className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-pink-500 focus:ring-pink-500" />
                                                </div>
                                            </div>

                                            {/* Instagram Page */}
                                            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors">
                                                <label className="flex items-center gap-3 cursor-pointer select-none w-full">
                                                    <div className="p-1.5 bg-pink-500/10 text-pink-500 rounded">
                                                        <Instagram className="w-4.5 h-4.5" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-semibold text-slate-300">Instagram Page</span>
                                                        <span className="text-[10px] text-slate-500">Create image post/feed</span>
                                                    </div>
                                                </label>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    {(!initialData?.publish_instagram) && portalCosts.publish_instagram > 0 && (
                                                        <span className="text-[10px] text-yellow-500 font-mono font-bold">{portalCosts.publish_instagram} CR</span>
                                                    )}
                                                    <input type="checkbox" checked={formData.publishInstagram} onChange={(e) => setFormData({ ...formData, publishInstagram: e.target.checked })} className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-pink-500 focus:ring-pink-500" />
                                                </div>
                                            </div>

                                            {/* TikTok Page */}
                                            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors">
                                                <label className="flex items-center gap-3 cursor-pointer select-none w-full">
                                                    <div className="p-1.5 bg-slate-950/20 text-slate-200 rounded border border-slate-800 flex items-center justify-center">
                                                        <TikTokIcon className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-semibold text-slate-300">TikTok Page</span>
                                                        <span className="text-[10px] text-slate-500">Generate property video</span>
                                                    </div>
                                                </label>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    {(!initialData?.publish_tiktok) && portalCosts.publish_tiktok > 0 && (
                                                        <span className="text-[10px] text-yellow-500 font-mono font-bold">{portalCosts.publish_tiktok} CR</span>
                                                    )}
                                                    <input type="checkbox" checked={formData.publishTiktok} onChange={(e) => setFormData({ ...formData, publishTiktok: e.target.checked })} className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-pink-500 focus:ring-pink-500" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                            </div>
                        </div>
                    )}

<div className="bg-slate-950/30 backdrop-blur-sm px-8 py-6 border-t border-slate-800 flex justify-between items-center relative z-20">
                        <button
                            type="button"
                            onClick={() => step > 1 ? setStep(step - 1) : router.push('/properties')}
                            className="flex items-center gap-2 bg-slate-900 border border-slate-700 text-slate-300 px-6 py-3 rounded-xl font-bold hover:bg-slate-800 hover:text-white hover:border-slate-600 transition-all shadow-lg"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            {step > 1 ? 'Previous Step' : 'Cancel'}
                        </button>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsImportModalOpen(true)}
                                className="flex items-center gap-2 bg-slate-800/50 hover:bg-slate-800 text-slate-300 px-4 py-2 rounded-xl transition-all border border-slate-700/50"
                            >
                                <Upload size={18} />
                                <span>Import</span>
                            </button>
                            <ImportPropertiesModal
                                showDefaultButton={false}
                                forceOpen={isImportModalOpen}
                                onClose={() => setIsImportModalOpen(false)}
                                onScrapeSuccess={handleScrapeSuccess}
                            />
                            <button
                                onClick={(e) => handleSaveDraft(e)} // Explicitly save draft
                                disabled={submitting || savingDraft}
                                className="flex items-center gap-2 bg-slate-800/50 hover:bg-slate-800 text-slate-300 px-4 py-2 rounded-xl font-bold hover:text-violet-200 transition-all border border-violet-500/30"
                            >
                                {savingDraft ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={18} />}
                                <span>{savingDraft ? 'Saving...' : 'Save Draft'}</span>
                            </button>
                        </div>

                        {step < 5 ? (
                            <button
                                key="next-step-btn"
                                type="button"
                                onClick={nextStep}
                                disabled={savingDraft}
                                className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:from-violet-500 hover:to-indigo-500 hover:shadow-violet-500/25 transition-all shadow-lg shadow-violet-900/20 group relative overflow-hidden disabled:opacity-70"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    Next Step
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </span>
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                            </button>
                        ) : (
                            <div className="flex flex-col items-end">
                                <button
                                    key="submit-listing-btn"
                                    type="submit"
                                    disabled={submitting}
                                    className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-10 py-3 rounded-xl font-bold hover:from-emerald-500 hover:to-teal-500 transition-all disabled:opacity-50 shadow-lg shadow-emerald-900/20 group relative overflow-hidden border border-emerald-500/20"
                                >
                                    <span className="relative z-10 flex items-center gap-2">
                                        {submitting ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                Save Property
                                                <Check className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                            </>
                                        )}
                                    </span>
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                </button>
                                {portalCosts.add_listing_reward > 0 && (
                                    <p className="text-[10px] text-emerald-400 font-bold text-right mt-2 flex items-center justify-end gap-1">
                                        <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />
                                        +{portalCosts.add_listing_reward} CR Recompensă Publicare Anunț Activ
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </form >
            </div>

            {showUpgradeModal && (
                <UpgradeModal
                    isOpen={showUpgradeModal}
                    onClose={() => setShowUpgradeModal(false)}
                    featureName="Virtual Tours"
                    description="Upload and manage 360° Virtual Tours to view interactive walkthroughs of your property."
                />
            )}

            {isReportSoldModalOpen && propertyId && (
                <ReportSoldModal
                    isOpen={isReportSoldModalOpen}
                    onClose={() => setIsReportSoldModalOpen(false)}
                    propertyId={propertyId}
                    propertyTitle={formData.title}
                    listingPrice={Number(formData.price)}
                    currency={formData.currency}
                />
            )}

            {showRomimoInfo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowRomimoInfo(false)}>
                    <div 
                        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 relative shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button 
                            type="button"
                            onClick={() => setShowRomimoInfo(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Info className="w-6 h-6 text-indigo-500" />
                            Romimo & Publi24 Auto-Posting
                        </h3>
                        <div className="space-y-4 text-slate-300 text-sm">
                            <p>
                                This feature automatically pushes your property listing to both <strong>Romimo</strong> and <strong>Publi24</strong> using their official API integration. 
                            </p>
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 space-y-2">
                                <h4 className="font-semibold text-white">How it works:</h4>
                                <ul className="list-disc pl-5 space-y-2 mt-2">
                                    <li><strong>Activation:</strong> Request a User Account Activation on Romimo&Publi24. <strong>The phone number and email adress from your profile will be used when a Property is published on Romimo and Publi24. Make shure that you have the correct email and mobile number in your Profile page, from the right top menu bar, click on User icon.</strong></li>
                                    <li><strong>Publishing:</strong> Check the box before saving to instantly push your property live on both platforms.</li>
                                    <li><strong>Updating:</strong> Any changes made here to price, description, or photos will sync automatically when you save.</li>
                                    <li><strong>Unpublishing:</strong> If you uncheck the box, change the status to Draft, or mark the property as Sold, it will be automatically removed from Romimo and Publi24.</li>
                                </ul>
                            </div>
                            <p className="text-slate-400 italic mt-4">
                                Note: Credits are only spent when initially publishing the listing. Subsequent updates are free.
                            </p>
                        </div>
                        <div className="mt-8 flex justify-end">
                            <button 
                                type="button"
                                onClick={() => setShowRomimoInfo(false)}
                                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/20"
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
