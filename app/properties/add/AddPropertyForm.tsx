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
    Move
} from 'lucide-react';
import { createProperty, updateProperty } from '@/app/lib/actions/properties';
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

// FEATURE_CATEGORIES is now imported from @/app/lib/properties

// CATEGORY_COLORS is now imported from @/app/lib/properties

import UpgradeModal from '@/app/components/UpgradeModal';
import PropertyValuationSection from '@/app/components/valuation/PropertyValuationSection';
import EventClient from '@/app/components/events/EventClient';
import ReportSoldModal from '@/app/components/properties/ReportSoldModal';

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
    const [isReportSoldModalOpen, setIsReportSoldModalOpen] = useState(false);
    const [availableTours, setAvailableTours] = useState<VirtualTour[]>([]);
    const [contractLanguage, setContractLanguage] = useState<'ro' | 'en'>('ro');

    // Photo reordering states
    const [draggedPhotoIndex, setDraggedPhotoIndex] = useState<number | null>(null);
    const [hoveredPhotoIndex, setHoveredPhotoIndex] = useState<number | null>(null);

    useEffect(() => {
        getVirtualTours().then(tours => {
            if (tours) setAvailableTours(tours);
        });
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
        publishHomezz: initialData?.publish_homezz || false,
        publishImobiliarepret: initialData?.publish_imobiliarepret || false,
        contractCountry: initialData?.contract_country || 'România',
        contractCity: initialData?.contract_city || '',
        contractStreet: initialData?.contract_street || '',
        contractBuilding: initialData?.contract_building || '',
        contractFloor: initialData?.contract_floor || '',
        contractApartment: initialData?.contract_apartment || '',
        contractCfTopo: initialData?.contract_cf_topo || ''
    });

    const [agentProfile, setAgentProfile] = useState<any>(null);

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
            }
        };
        fetchProfile();
    }, []);

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
            const uploadPromises = files.map(async (file) => {
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
        await handleSubmit(e as any, 'draft', true);
        setSavingDraft(false);
    };

    const nextStep = async () => {
        if (step < 4) {
            // Auto-save draft logic if needed, currently manual only or we can trigger it
            // For better UX, let's just move next. 
            // The user requested "logic to save the property by default when pressing the NEXT STEP".
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

        // Status & Distribution
        formDataToSend.append('status', status);
        formDataToSend.append('publish_imobiliare', formData.publishImobiliare ? 'true' : 'false');
        formDataToSend.append('publish_storia', formData.publishStoria ? 'true' : 'false');
        formDataToSend.append('publish_romimo', formData.publishRomimo ? 'true' : 'false');
        formDataToSend.append('publish_homezz', formData.publishHomezz ? 'true' : 'false');
        formDataToSend.append('publish_imobiliarepret', formData.publishImobiliarepret ? 'true' : 'false');

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

    const handleGenerateContract = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Te rugăm să permiți ferestrele pop-up pentru a genera documentul.');
            return;
        }

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

        const isRo = contractLanguage === 'ro';

        const content = {
            title: isRo ? 'Contract de Colaborare Imobiliară' : 'Real Estate Collaboration Contract',
            series: isRo ? 'Seria' : 'Series',
            nr: isRo ? 'Nr' : 'No',
            date: isRo ? 'Data' : 'Date',
            hour: isRo ? 'Ora' : 'Time',
            partiesTitle: isRo ? '1. Părțile Contractante' : '1. Contracting Parties',
            providerTitle: isRo ? 'PRESTATORUL (Broker / Agenție)' : 'THE PROVIDER (Broker / Agency)',
            providerCompany: isRo ? 'Denumire Societate (Firma):' : 'Company Name (Firm):',
            providerCui: isRo ? 'CUI / CIF:' : 'Tax ID / VAT registration no:',
            providerRegCom: isRo ? 'Nr. Reg. Comerțului:' : 'Trade Register no:',
            providerAddress: isRo ? 'Sediul Social:' : 'Registered Office Address:',
            providerRep: isRo ? 'Reprezentat legal prin:' : 'Represented legally by:',
            beneficiaryTitle: isRo ? 'BENEFICIARUL (Proprietar / Client)' : 'THE BENEFICIARY (Owner / Client)',
            beneficiaryName: isRo ? 'Nume complet:' : 'Full Name:',
            beneficiaryPhone: isRo ? 'Telefon contact:' : 'Contact Phone:',
            objectTitle: isRo ? '2. Obiectul Contractului' : '2. Object of the Contract',
            objectDesc: isRo 
                ? 'Obiectul prezentului contract îl reprezintă colaborarea dintre Prestator și Beneficiar în scopul promovării, intermedierii și facilitării tranzacționării (vânzare/închiriere) a dreptului de proprietate asupra bunului imobil identificat după cum urmează:'
                : 'The object of this contract is the collaboration between the Provider and the Beneficiary for the purpose of marketing, promoting, and facilitating the transaction (sale/lease) of the property rights of the real estate asset identified below:',
            imobilTitle: isRo ? 'Identificare Imobil' : 'Property Identification',
            propTitle: isRo ? 'Titlu Proprietate:' : 'Property Title:',
            propAddress: isRo ? 'Adresă exactă (locație contract):' : 'Exact Address (Contract Location):',
            propCfTopo: isRo ? 'Carte Funciară / Topo (CF/NR. Topo):' : 'Land Registry / Topographic no (CF/No. Topo):',
            propPrice: isRo ? 'Preț Promovare Solicitat:' : 'Requested Listing Price:',
            servicesTitle: isRo ? '3. Servicii și Comisioane' : '3. Services and Commissions',
            servicesDesc1: isRo
                ? '3.1. Serviciile specifice pe care le va presta Prestatorul pentru Beneficiar, precum și valoarea și structura comisionului datorat de Beneficiar pentru aceste servicii sunt stabilite în totalitate și în exclusivitate în conformitate cu prevederile detaliate în <strong>Anexa 1</strong> la prezentul contract, care face parte integrantă din acesta.'
                : '3.1. The specific services to be performed by the Provider for the Beneficiary, as well as the value and structure of the commission owed by the Beneficiary for these services, are established entirely and exclusively in accordance with the provisions detailed in <strong>Annex 1</strong> to this contract, which forms an integral part thereof.',
            servicesDesc2: isRo
                ? '3.2. Beneficiarul se obligă să achite comisionul stabilit în conformitate cu condițiile, termenele și modalitățile de plată stipulate în <strong>Anexa 1</strong>.'
                : '3.2. The Beneficiary undertakes to pay the established commission in accordance with the conditions, deadlines, and payment methods stipulated in <strong>Annex 1</strong>.',
            rightsProviderTitle: isRo ? '4. Drepturile și Obligațiile Prestatorului' : '4. Rights and Obligations of the Provider',
            rightsProvider1: isRo
                ? '4.1. Prestatorul are dreptul de a promova imobilul în mediul online și offline prin canale proprii sau prin rețeaua MLS (Multiple Listing Service).'
                : '4.1. The Provider has the right to promote the property in online and offline media through their own channels or through the MLS (Multiple Listing Service) network.',
            rightsProvider2: isRo
                ? '4.2. Prestatorul se obligă să depună toate diligențele profesionale necesare pentru identificarea potențialilor clienți cumpărători/chiriași și să asigure asistența de specialitate pe tot parcursul negocierilor și finalizării tranzacției.'
                : '4.2. The Provider undertakes to use all professional diligence necessary to identify potential buyers/tenants and to provide professional assistance throughout the negotiations and finalization of the transaction.',
            rightsBeneficiaryTitle: isRo ? '5. Drepturile și Obligațiile Beneficiarului' : '5. Rights and Obligations of the Beneficiary',
            rightsBeneficiary1: isRo
                ? '5.1. Beneficiarul garantează că deține drepturile legale de a tranzacționa imobilul descris mai sus și că toate datele furnizate sunt reale și corecte.'
                : '5.1. The Beneficiary guarantees that they hold the legal rights to transact the property described above and that all data provided is true and correct.',
            rightsBeneficiary2: isRo
                ? '5.2. Beneficiarul se obligă să asigure accesul Prestatorului și al potențialilor clienți pentru vizionarea imobilului și să informeze Prestatorul cu privire la orice schimbări apărute.'
                : '5.2. The Beneficiary undertakes to ensure access to the Provider and potential clients for property viewings and to inform the Provider of any changes.',
            forceTitle: isRo ? '6. Forța Majoră și Litigii' : '6. Force Majeure and Disputes',
            force1: isRo
                ? '6.1. Părțile sunt exonerate de răspundere în caz de forță majoră, constatată conform legii.'
                : '6.1. The parties are exonerated from liability in case of force majeure, established by law.',
            force2: isRo
                ? '6.2. Litigiile izvorâte din interpretarea sau executarea prezentului contract se vor rezolva pe cale amiabilă, iar în caz contrar vor fi deferite instanțelor judecătorești competente de la sediul Prestatorului.'
                : '6.2. Disputes arising from the interpretation or execution of this contract shall be settled amicably, otherwise they shall be referred to the competent courts of law at the Provider\'s headquarters.',
            signProvider: isRo ? 'PRESTATOR' : 'PROVIDER',
            signBeneficiary: isRo ? 'BENEFICIAR' : 'BENEFICIARY',
            signLineProvider: isRo ? 'Semnătura și Ștampila' : 'Signature and Stamp',
            signLineBeneficiary: isRo ? 'Semnătura' : 'Signature',
            footerText: isRo
                ? 'Document generat automat prin intermediul platformei Real Estate MLS. Toate drepturile rezervate.'
                : 'Document generated automatically via the Real Estate MLS platform. All rights reserved.'
        };

        const htmlContent = `
            <!DOCTYPE html>
            <html lang="${isRo ? 'ro' : 'en'}">
            <head>
                <meta charset="UTF-8">
                <title>${content.title} - ${contractSerial} ${contractNumber}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Inter:wght@400;500;600;700&display=swap');
                    body {
                        font-family: 'Inter', sans-serif;
                        color: #0f172a;
                        line-height: 1.6;
                        margin: 0;
                        padding: 50px;
                        background-color: #ffffff;
                    }
                    .contract-container {
                        max-width: 800px;
                        margin: 0 auto;
                    }
                    .contract-header {
                        text-align: center;
                        margin-bottom: 40px;
                    }
                    .contract-title {
                        font-family: 'Cinzel', serif;
                        font-size: 22px;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        margin-bottom: 10px;
                        color: #0f172a;
                    }
                    .contract-meta {
                        font-size: 14px;
                        color: #475569;
                        border-bottom: 2px double #cbd5e1;
                        padding-bottom: 15px;
                        margin-bottom: 25px;
                    }
                    .meta-row {
                        display: flex;
                        justify-content: space-between;
                        font-weight: 600;
                    }
                    h3 {
                        font-size: 14px;
                        font-weight: 700;
                        color: #0f172a;
                        margin-top: 25px;
                        margin-bottom: 10px;
                        text-transform: uppercase;
                        border-bottom: 1px solid #e2e8f0;
                        padding-bottom: 5px;
                    }
                    p {
                        font-size: 13px;
                        margin: 0 0 12px 0;
                        text-align: justify;
                    }
                    .party-info {
                        background-color: #f8fafc;
                        border: 1px solid #e2e8f0;
                        border-radius: 8px;
                        padding: 15px;
                        margin-bottom: 15px;
                    }
                    .party-title {
                        font-weight: 700;
                        color: #0f172a;
                        margin-bottom: 10px;
                        font-size: 12px;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        border-bottom: 1px dashed #cbd5e1;
                        padding-bottom: 4px;
                    }
                    .details-grid {
                        display: grid;
                        grid-template-cols: 1fr 1fr;
                        gap: 8px 16px;
                        font-size: 13px;
                    }
                    .details-item {
                        display: flex;
                        flex-direction: column;
                    }
                    .details-label {
                        font-weight: 600;
                        color: #64748b;
                        font-size: 11px;
                        text-transform: uppercase;
                        margin-bottom: 2px;
                    }
                    .details-value {
                        color: #0f172a;
                        font-weight: 500;
                    }
                    .signatures {
                        display: flex;
                        justify-content: space-between;
                        margin-top: 50px;
                        page-break-inside: avoid;
                    }
                    .signature-block {
                        width: 45%;
                        text-align: center;
                    }
                    .signature-line {
                        border-top: 1px solid #94a3b8;
                        margin-top: 50px;
                        padding-top: 5px;
                        font-size: 12px;
                        color: #64748b;
                    }
                    .footer {
                        text-align: center;
                        font-size: 10px;
                        color: #94a3b8;
                        margin-top: 60px;
                        border-top: 1px solid #e2e8f0;
                        padding-top: 15px;
                        page-break-inside: avoid;
                    }
                    @media print {
                        body {
                            padding: 0;
                        }
                        .no-print {
                            display: none;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="contract-container">
                    <div class="contract-header">
                        <div class="contract-title">${content.title}</div>
                        <div class="contract-meta">
                            <div class="meta-row">
                                <span>${content.series}: ${contractSerial} / ${content.nr}: ${contractNumber}</span>
                                <span>${content.date}: ${dateStr} | ${content.hour}: ${timeStr}</span>
                            </div>
                        </div>
                    </div>

                    <h3>${content.partiesTitle}</h3>
                    
                    <div class="party-info">
                        <div class="party-title">${content.providerTitle}</div>
                        <div class="details-grid">
                            <div class="details-item">
                                <span class="details-label">${content.providerCompany}</span>
                                <span class="details-value">${agentProfile?.company_name || '................................................'}</span>
                            </div>
                            <div class="details-item">
                                <span class="details-label">${content.providerCui}</span>
                                <span class="details-value">${agentProfile?.company_cui || '................................................'}</span>
                            </div>
                            <div class="details-item">
                                <span class="details-label">${content.providerRegCom}</span>
                                <span class="details-value">${agentProfile?.company_reg_com || '................................................'}</span>
                            </div>
                            <div class="details-item">
                                <span class="details-label">${content.providerAddress}</span>
                                <span class="details-value">${agentProfile?.company_address || '................................................'}</span>
                            </div>
                            <div class="details-item" style="grid-column: span 2;">
                                <span class="details-label">${content.providerRep}</span>
                                <span class="details-value">${agentProfile?.full_name || '................................................'}</span>
                            </div>
                        </div>
                    </div>

                    <div class="party-info">
                        <div class="party-title">${content.beneficiaryTitle}</div>
                        <div class="details-grid">
                            <div class="details-item" style="grid-column: span 2;">
                                <span class="details-label">${content.beneficiaryName}</span>
                                <span class="details-value">${formData.ownerName || '................................................'}</span>
                            </div>
                            <div class="details-item">
                                <span class="details-label">${content.beneficiaryPhone}</span>
                                <span class="details-value">${formData.ownerPhone || '................................................'}</span>
                            </div>
                        </div>
                    </div>

                    <h3>${content.objectTitle}</h3>
                    <p>${content.objectDesc}</p>
                    
                    <div class="party-info">
                        <div class="party-title">${content.imobilTitle}</div>
                        <div class="details-grid">
                            <div class="details-item" style="grid-column: span 2;">
                                <span class="details-label">${content.propTitle}</span>
                                <span class="details-value">${formData.title || '................................................'}</span>
                            </div>
                            <div class="details-item" style="grid-column: span 2;">
                                <span class="details-label">${content.propAddress}</span>
                                <span class="details-value">
                                    ${[
                                        formData.contractCountry ? (isRo ? `Țara: ${formData.contractCountry}` : `Country: ${formData.contractCountry}`) : '',
                                        formData.contractCity ? (isRo ? `Oraș: ${formData.contractCity}` : `City: ${formData.contractCity}`) : '',
                                        formData.contractStreet ? (isRo ? `Strada: ${formData.contractStreet}` : `Street: ${formData.contractStreet}`) : '',
                                        formData.contractBuilding ? (isRo ? `Nr: ${formData.contractBuilding}` : `No: ${formData.contractBuilding}`) : '',
                                        formData.contractFloor ? (isRo ? `Et: ${formData.contractFloor}` : `Floor: ${formData.contractFloor}`) : '',
                                        formData.contractApartment ? (isRo ? `Ap: ${formData.contractApartment}` : `Apt: ${formData.contractApartment}`) : ''
                                    ].filter(Boolean).join(', ') || '................................................'}
                                </span>
                            </div>
                            <div class="details-item">
                                <span class="details-label">${content.propCfTopo}</span>
                                <span class="details-value">${formData.contractCfTopo || '................................................'}</span>
                            </div>
                            <div class="details-item">
                                <span class="details-label">${content.propPrice}</span>
                                <span class="details-value">${formData.price ? `${formData.price} ${formData.currency}` : '................................................'}</span>
                            </div>
                        </div>
                    </div>

                    <h3>${content.servicesTitle}</h3>
                    <p>${content.servicesDesc1}</p>
                    <p>${content.servicesDesc2}</p>

                    <h3>${content.rightsProviderTitle}</h3>
                    <p>${content.rightsProvider1}</p>
                    <p>${content.rightsProvider2}</p>

                    <h3>${content.rightsBeneficiaryTitle}</h3>
                    <p>${content.rightsBeneficiary1}</p>
                    <p>${content.rightsBeneficiary2}</p>

                    <h3>${content.forceTitle}</h3>
                    <p>${content.force1}</p>
                    <p>${content.force2}</p>

                    <div class="signatures">
                        <div class="signature-block">
                            <div class="party-title">${content.signProvider}</div>
                            <div style="font-size: 13px; color: #0f172a; margin-top: 15px; font-weight: bold;">${agentProfile?.company_name || '................................................'}</div>
                            <div class="signature-line">${content.signLineProvider}</div>
                        </div>
                        <div class="signature-block">
                            <div class="party-title">${content.signBeneficiary}</div>
                            <div style="font-size: 13px; color: #0f172a; margin-top: 15px; font-weight: bold;">${formData.ownerName || '................................................'}</div>
                            <div class="signature-line">${content.signLineBeneficiary}</div>
                        </div>
                    </div>

                    <div class="footer">
                        ${content.footerText}
                    </div>
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                    }
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    const checkKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') e.preventDefault();
    };

    if (success) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
                {/* Background Blobs */}
                <div className="absolute top-0 -left-20 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl opacity-50 pointer-events-none" />
                <div className="absolute bottom-0 -right-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl opacity-50 pointer-events-none" />

                <div className="max-w-md w-full bg-slate-900/50 backdrop-blur-xl p-8 rounded-3xl border border-slate-800 text-center shadow-2xl relative z-10">
                    <div className="w-24 h-24 bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                        <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                    </div>
                    <h1 className="text-3xl font-bold mb-3 text-white">Listing Submitted!</h1>
                    <p className="text-slate-400 mb-8 leading-relaxed">
                        Your property has been successfully listed and is now pending review.
                    </p>
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
                    {[1, 2, 3, 4].map((s) => (
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
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-slate-300">Property Title</label>
                                    <input
                                        type="text"
                                        name="title"
                                        required
                                        value={formData.title}
                                        onChange={handleChange}
                                        placeholder="e.g., Luxury Modern Apartment in Downtown"
                                        className="w-full bg-slate-950/50 border border-slate-700/80 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none transition-all text-white placeholder-slate-600 hover:border-slate-600"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 text-slate-300">Description</label>
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

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-slate-300">Property Type</label>
                                        <div className="relative">
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
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-slate-300">Listing Type</label>
                                        <div className="relative">
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
                            </div>


                            {/* Location & Pricing Section (Moved from old Step 2) */}
                            <div className="pt-8 border-t border-slate-800">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center border border-violet-500/30 shadow-inner">
                                        <MapPin className="w-6 h-6 text-violet-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">Location & Pricing</h2>
                                        <p className="text-slate-400 text-sm">Where is it and how much?</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium mb-2 text-slate-300">Price</label>
                                            <div className="relative">
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
                                                    className="w-full bg-slate-950/50 border border-slate-700/80 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none transition-all text-white placeholder-slate-600 hover:border-slate-600 text-lg font-medium"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2 text-slate-300">Currency</label>
                                            <div className="relative">
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

                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-slate-300">Street Address</label>
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
                                        <p className="text-xs text-slate-500 mt-2">Start typing to search with Google Maps</p>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium mb-2 text-slate-300">City</label>
                                            <input type="text" name="city" required value={formData.city} onChange={handleChange} className="w-full bg-slate-950/50 border border-slate-700/80 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none transition-all text-white placeholder-slate-600 hover:border-slate-600" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2 text-slate-300">State</label>
                                            <input type="text" name="state" required value={formData.state} onChange={handleChange} className="w-full bg-slate-950/50 border border-slate-700/80 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none transition-all text-white placeholder-slate-600 hover:border-slate-600" />
                                        </div>
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-sm font-medium mb-2 text-slate-300">Area / Neighbourhood</label>
                                            <input type="text" name="area" placeholder="e.g., Fratelia, Complex" value={formData.area} onChange={handleChange} className="w-full bg-slate-950/50 border border-slate-700/80 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none transition-all text-white placeholder-slate-600 hover:border-slate-600" />
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

                            {/* Details & Features (Moved from Step 3) */}
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

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    {/* Row 1: Rooms, Beds, Baths, Year Built */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-slate-300">Rooms</label>
                                        <input type="number" name="rooms" value={formData.rooms} onChange={handleChange} className="w-full bg-slate-950/50 border border-slate-700/80 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none transition-all text-white placeholder-slate-600 hover:border-slate-600" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-slate-300">Bedrooms</label>
                                        <input type="number" name="beds" value={formData.beds} onChange={handleChange} className="w-full bg-slate-950/50 border border-slate-700/80 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none transition-all text-white placeholder-slate-600 hover:border-slate-600" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-slate-300">Bathrooms</label>
                                        <input type="number" name="baths" value={formData.baths} onChange={handleChange} className="w-full bg-slate-950/50 border border-slate-700/80 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none transition-all text-white placeholder-slate-600 hover:border-slate-600" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-slate-300">Year Built</label>
                                        <input type="number" name="yearBuilt" value={formData.yearBuilt} onChange={handleChange} className="w-full bg-slate-950/50 border border-slate-700/80 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none transition-all text-white placeholder-slate-600 hover:border-slate-600" />
                                    </div>

                                    {/* Row 2: Usable Area, Built Area, Terrace, Garden */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-slate-300">Usable Area (sq ft)</label>
                                        <input type="number" name="usableArea" value={formData.usableArea} onChange={handleChange} className="w-full bg-slate-950/50 border border-slate-700/80 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none transition-all text-white placeholder-slate-600 hover:border-slate-600" />
                                    </div>
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

                                    {/* Row 3: Box Area, Floor, Total Floors */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-slate-300">Box (sq ft)</label>
                                        <input type="number" name="boxArea" value={formData.boxArea} onChange={handleChange} className="w-full bg-slate-950/50 border border-slate-700/80 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none transition-all text-white placeholder-slate-600 hover:border-slate-600" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-slate-300">Floor</label>
                                        <input type="number" name="floor" placeholder="e.g., 5" value={formData.floor} onChange={handleChange} className="w-full bg-slate-950/50 border border-slate-700/80 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none transition-all text-white placeholder-slate-600 hover:border-slate-600" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium mb-2 text-slate-300">Total Floors</label>
                                        <input type="number" name="totalFloors" placeholder="e.g., 10" value={formData.totalFloors} onChange={handleChange} className="w-full bg-slate-950/50 border border-slate-700/80 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none transition-all text-white placeholder-slate-600 hover:border-slate-600" />
                                    </div>

                                    {/* Open to Collaboration Checkbox */}
                                    <div className="col-span-1 md:col-span-2 mt-2">
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

                                {/* Row 3: Partitioning, Comfort */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-slate-300">Partitioning</label>
                                        <div className="relative">
                                            <select name="partitioning" value={formData.partitioning} onChange={handleChange} className="w-full bg-slate-950/50 border border-slate-700/80 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 outline-none appearance-none text-white hover:border-slate-600">
                                                <option value="" className="bg-slate-900">Select...</option>
                                                {PARTITIONING_TYPES.map(t => <option key={t} value={t} className="bg-slate-900">{t}</option>)}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-slate-300">Comfort</label>
                                        <div className="relative">
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

                                {/* Row 4: Building Type, Interior, Furnishing */}
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
                                                {!canUseVirtualTours && <Lock className="w-3 h-3 text-amber-500" />}
                                            </label>

                                            {!canUseVirtualTours ? (
                                                <div
                                                    onClick={() => setShowUpgradeModal(true)}
                                                    className="border border-slate-800 bg-slate-900/50 rounded-xl p-6 text-center cursor-pointer hover:bg-slate-800 transition-colors group"
                                                >
                                                    <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                                        <Lock className="w-5 h-5 text-slate-400" />
                                                    </div>
                                                    <h4 className="text-white font-bold mb-1">Feature Locked</h4>
                                                    <p className="text-sm text-slate-400">Upgrade your plan to add Virtual Tours</p>
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
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Portal Distribution Section */}
                                <div className="mt-8 pt-8 border-t border-slate-800">
                                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2 bg-blue-500/20 rounded-lg">
                                                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                                </svg>
                                            </div>
                                            <h3 className="text-lg font-bold text-white">Export to Portals (XML Feed)</h3>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <label className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${formData.publishImobiliare ? 'bg-blue-500/10 border-blue-500/50' : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'}`}>
                                                <div className="flex items-center h-5 mt-1">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.publishImobiliare}
                                                        onChange={(e) => setFormData({ ...formData, publishImobiliare: e.target.checked })}
                                                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
                                                    />
                                                </div>
                                                <div>
                                                    <p className={`font-semibold ${formData.publishImobiliare ? 'text-blue-400' : 'text-slate-300'}`}>Publish to Imobiliare.ro</p>
                                                    <p className="text-sm text-slate-500 mt-1">Include this property in the Imobiliare XML auto-sync feed</p>
                                                </div>
                                            </label>

                                            <label className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${formData.publishStoria ? 'bg-cyan-500/10 border-cyan-500/50' : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'}`}>
                                                <div className="flex items-center h-5 mt-1">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.publishStoria}
                                                        onChange={(e) => setFormData({ ...formData, publishStoria: e.target.checked })}
                                                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
                                                    />
                                                </div>
                                                <div>
                                                    <p className={`font-semibold ${formData.publishStoria ? 'text-cyan-400' : 'text-slate-300'}`}>Publish to Storia / OLX</p>
                                                    <p className="text-sm text-slate-500 mt-1">Include this property in the Storia XML auto-sync feed</p>
                                                </div>
                                            </label>

                                            <label className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${formData.publishRomimo ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'}`}>
                                                <div className="flex items-center h-5 mt-1">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.publishRomimo}
                                                        onChange={(e) => setFormData({ ...formData, publishRomimo: e.target.checked })}
                                                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
                                                    />
                                                </div>
                                                <div>
                                                    <p className={`font-semibold ${formData.publishRomimo ? 'text-indigo-400' : 'text-slate-300'}`}>Publish to Romimo / Publi24</p>
                                                    <p className="text-sm text-slate-500 mt-1">Include this property in the Romimo/Publi24 XML auto-sync feed</p>
                                                </div>
                                            </label>

                                            <label className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${formData.publishHomezz ? 'bg-violet-500/10 border-violet-500/50' : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'}`}>
                                                <div className="flex items-center h-5 mt-1">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.publishHomezz}
                                                        onChange={(e) => setFormData({ ...formData, publishHomezz: e.target.checked })}
                                                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-violet-500 focus:ring-violet-500"
                                                    />
                                                </div>
                                                <div>
                                                    <p className={`font-semibold ${formData.publishHomezz ? 'text-violet-400' : 'text-slate-300'}`}>Publish to HomeZZ / LaJumate</p>
                                                    <p className="text-sm text-slate-500 mt-1">Include this property in the HomeZZ/LaJumate XML auto-sync feed</p>
                                                </div>
                                            </label>

                                            <label className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${formData.publishImobiliarepret ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'}`}>
                                                <div className="flex items-center h-5 mt-1">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.publishImobiliarepret}
                                                        onChange={(e) => setFormData({ ...formData, publishImobiliarepret: e.target.checked })}
                                                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                                                    />
                                                </div>
                                                <div>
                                                    <p className={`font-semibold ${formData.publishImobiliarepret ? 'text-emerald-400' : 'text-slate-300'}`}>Publish to ImobiliarePret.ro</p>
                                                    <p className="text-sm text-slate-500 mt-1">Include this property in the ImobiliarePret XML auto-sync feed</p>
                                                </div>
                                            </label>
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
                                                        <p className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Ad Transaction Price</p>
                                                        <p className="text-lg font-black text-white leading-tight">Report SOLD</p>
                                                    </div>
                                                    <ArrowRight className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="p-2 bg-emerald-500/20 rounded-lg">
                                                    <DollarSign className="w-5 h-5 text-emerald-400" />
                                                </div>
                                                <h3 className="text-lg font-bold text-white">Contribute to Price / Market Valuation</h3>
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

                        {step < 4 ? (
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
        </div>
    );
}
