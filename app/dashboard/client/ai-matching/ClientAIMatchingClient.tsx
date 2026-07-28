'use client';

import React, { useState, useEffect } from 'react';
import { 
    Zap, Bookmark, Phone, PhoneCall, Heart, Calendar, Clock, Handshake, 
    ThumbsDown, XCircle, Award, Sparkles, RefreshCw, ChevronDown, ChevronUp, 
    SlidersHorizontal, Search, MapPin, BedDouble, Ruler, ArrowUpRight, Flag, 
    Check, AlertCircle, Plus, ExternalLink, CalendarDays, Smartphone, Coins, ChevronLeft, ChevronRight, Eye, Download, X, Key, User, ShieldCheck, Scan, UserPlus
} from 'lucide-react';
import { upsertMatchStatus, bulkUpsertMatchStatus } from '@/app/lib/actions/matches';
import { findMatchingProperties } from '@/app/lib/actions/scoring';
import { updateLead } from '@/app/lib/actions/leads';
import { saveClientCalendarEvent, updateMatchWantToSeeAgainFlag, logUserActivity, activateInstantAIMatching } from '@/app/lib/actions/user-activity';
import DrawAreaSelector from '@/app/components/DrawAreaSelector';
import MultiSearchableSelect from '@/app/components/MultiSearchableSelect';
import { ROMANIAN_CITIES, TIMISOARA_AREAS, formatCityList, cleanCityName, normalizeText } from '@/app/lib/constants/locations';
import { getSystemLocations } from '@/app/lib/actions/admin-settings';
import Link from 'next/link';
import { decodeHtmlEntities } from '@/app/lib/utils/string';

interface Props {
    lead: any;
    initialMatches: any[];
    recommendation: { text: string; points: number };
    instantAiCost?: number;
    lowCreditThreshold?: number;
    userCredits?: number;
}

const TABS = [
    { 
        id: 'curate', 
        name: 'AI Matching', 
        icon: Sparkles,
        desc: `1. AI cauta pentru tine. - Intră zilnic de mai multe ori aici și vezi ce a apărut nou între timp.\n2. Apasă pe icoana Nu îmi Plac sau Favorite (pentru ca data viitoare când vrei să verifici ce a apărut nou pe piață să le vezi mai ușor.)\n3. Important ! Poti adauga link-ul de pe orice alt website de la alte proprietati de pe butonul ADAUGA MANUAL, ca sa gestionezi totul dintr-un singur loc.`,
        color: 'text-orange-600 border-orange-600 bg-orange-50 font-semibold'
    },
    { 
        id: 'saved', 
        name: 'Favorite', 
        icon: Heart,
        desc: 'Astea mi-ar putea plăcea, verifică detaliile după ce le selectezi pe toate care ți se par interesante.',
        color: 'text-rose-600 border-rose-600 bg-rose-50 font-semibold'
    },
    { 
        id: 'to_visit', 
        name: 'De Văzut', 
        icon: Eye,
        desc: 'Aici le pui pe cele care sigur vrei să le vezi.',
        color: 'text-indigo-600 border-indigo-600 bg-indigo-50 font-semibold',
        hasCalendar: true,
        hasFlag: true
    },
    { 
        id: 'offer_made', 
        name: 'Oferte făcute', 
        icon: Coins,
        desc: 'Aici găsești proprietățile la care ai trimis o ofertă de preț sau ai negociat cu proprietarul.',
        color: 'text-emerald-700 border-emerald-600 bg-emerald-50 font-semibold'
    },
    { 
        id: 'not_interested', 
        name: 'Mă mai gândesc', 
        icon: Clock,
        desc: 'Aici sunt cele la care ai fost la vizionare și încă te mai gândești, dar le găsești aici dacă te răzgândești.',
        color: 'text-blue-600 border-blue-600 bg-blue-50 font-semibold'
    },
    { 
        id: 'dismissed', 
        name: 'Nu îmi plac', 
        icon: ThumbsDown,
        desc: 'Aici sunt cele la care le-ai dat "Nu se potrivesc" din ce a selectat AI-ul inițial.',
        color: 'text-gray-600 border-gray-600 bg-gray-50 font-semibold'
    },
    { 
        id: 'winner', 
        name: 'Câștigător', 
        icon: Award,
        desc: 'Felicitări! Aici este proprietatea pe care ai ales-o.',
        color: 'text-yellow-700 border-yellow-500 bg-yellow-50 font-semibold'
    }
];

const TAB_COLORS: Record<string, { active: string; inactive: string; badgeActive: string; badgeInactive: string; iconActive: string; iconInactive: string }> = {
    curate: {
        active: 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-600/30 border-orange-500 font-semibold',
        inactive: 'bg-orange-50 hover:bg-orange-100/80 text-orange-950 border-orange-200 font-semibold',
        badgeActive: 'bg-white/30 text-white font-semibold',
        badgeInactive: 'bg-orange-200 text-orange-950 font-semibold',
        iconActive: 'text-yellow-300 fill-current',
        iconInactive: 'text-orange-600'
    },
    saved: {
        active: 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md shadow-rose-600/30 border-rose-500 font-semibold',
        inactive: 'bg-rose-50 hover:bg-rose-100/80 text-rose-950 border-rose-200 font-semibold',
        badgeActive: 'bg-white/30 text-white font-semibold',
        badgeInactive: 'bg-rose-200 text-rose-950 font-semibold',
        iconActive: 'text-rose-100 fill-current',
        iconInactive: 'text-rose-600'
    },
    to_visit: {
        active: 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-600/30 border-violet-500 font-semibold',
        inactive: 'bg-violet-50 hover:bg-violet-100/80 text-violet-950 border-violet-200 font-semibold',
        badgeActive: 'bg-white/30 text-white font-semibold',
        badgeInactive: 'bg-violet-200 text-violet-950 font-semibold',
        iconActive: 'text-violet-100',
        iconInactive: 'text-violet-600'
    },
    offer_made: {
        active: 'bg-gradient-to-r from-teal-700 to-emerald-800 text-white shadow-md border-teal-600 font-semibold',
        inactive: 'bg-teal-50 hover:bg-teal-100/80 text-teal-950 border-teal-200 font-semibold',
        badgeActive: 'bg-white/30 text-white font-semibold',
        badgeInactive: 'bg-teal-200 text-teal-950 font-semibold',
        iconActive: 'text-teal-100',
        iconInactive: 'text-teal-700'
    },
    not_interested: {
        active: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30 border-blue-500 font-semibold',
        inactive: 'bg-blue-50 hover:bg-blue-100/80 text-blue-950 border-blue-200 font-semibold',
        badgeActive: 'bg-white/30 text-white font-semibold',
        badgeInactive: 'bg-blue-200 text-blue-950 font-semibold',
        iconActive: 'text-blue-100',
        iconInactive: 'text-blue-600'
    },
    dismissed: {
        active: 'bg-gradient-to-r from-gray-700 to-slate-800 text-white shadow-md border-gray-600 font-semibold',
        inactive: 'bg-gray-100 hover:bg-gray-200/80 text-gray-800 border-gray-200 font-semibold',
        badgeActive: 'bg-white/30 text-white font-semibold',
        badgeInactive: 'bg-gray-300 text-gray-900 font-semibold',
        iconActive: 'text-gray-100',
        iconInactive: 'text-gray-600'
    },
    winner: {
        active: 'bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-slate-950 shadow-md shadow-yellow-400/40 border-yellow-300 font-semibold',
        inactive: 'bg-yellow-50 hover:bg-yellow-100/80 text-yellow-950 border-yellow-300 font-semibold',
        badgeActive: 'bg-slate-950/20 text-slate-950 font-semibold',
        badgeInactive: 'bg-yellow-300 text-yellow-950 font-semibold',
        iconActive: 'text-slate-950 fill-current',
        iconInactive: 'text-yellow-600'
    }
};

function PropertyCardImageSlider({ images, title, matchScore }: { images?: string[]; title: string; matchScore?: number }) {
    const [currentIdx, setCurrentIdx] = useState(0);
    const imgList = (images && images.length > 0) ? images : ['/placeholder-property.jpg'];

    const handlePrev = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setCurrentIdx(prev => (prev === 0 ? imgList.length - 1 : prev - 1));
    };

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setCurrentIdx(prev => (prev === imgList.length - 1 ? 0 : prev + 1));
    };

    return (
        <div className="h-48 w-full bg-slate-100 relative overflow-hidden shrink-0 group/img">
            <img
                src={imgList[currentIdx]}
                alt={title}
                className="w-full h-full object-cover transition-all duration-300"
            />
            {matchScore !== undefined && (
                <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-900/85 text-white border border-slate-700 shadow-sm backdrop-blur-sm flex items-center gap-1 z-10">
                    <Zap className="w-3 h-3 text-orange-500 fill-current" />
                    <span>Match: {matchScore}</span>
                </div>
            )}
            {imgList.length > 1 && (
                <>
                    <button
                        onClick={handlePrev}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-sm opacity-90 sm:opacity-0 group-hover/img:opacity-100 transition-opacity z-10 cursor-pointer shadow-md"
                        title="Poza anterioară"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleNext}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-sm opacity-90 sm:opacity-0 group-hover/img:opacity-100 transition-opacity z-10 cursor-pointer shadow-md"
                        title="Poza următoare"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-black px-2 py-0.5 rounded-full z-10 border border-slate-700">
                        {currentIdx + 1} / {imgList.length}
                    </div>
                </>
            )}
        </div>
    );
}

export default function ClientAIMatchingClient({ lead, initialMatches, recommendation, instantAiCost = 5, lowCreditThreshold = 5, userCredits = 0 }: Props) {
    const [matches, setMatches] = useState<any[]>(initialMatches);
    const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [isApproved, setIsApproved] = useState<boolean>(lead.is_approved !== false);
    const [credits, setCredits] = useState<number>(userCredits);
    const [isActivatingInstant, setIsActivatingInstant] = useState(false);
    const [activeTab, setActiveTab] = useState<string>('curate');
    const [updatingIds, setUpdatingIds] = useState<string[]>([]);
    const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
    const [isRecommendationOpen, setIsRecommendationOpen] = useState(false);
    const [isAiStepOpen, setIsAiStepOpen] = useState(true);

    // Lead preferences editing - all fields from form
    const [prefType, setPrefType] = useState(lead.preference_type || 'Apartment');
    const [prefListingType, setPrefListingType] = useState(lead.preference_listing_type || 'For Sale');
    const [prefCity, setPrefCity] = useState(lead.preference_location_city || '');
    const [prefArea, setPrefArea] = useState(lead.preference_location_area || '');
    const [budgetMin, setBudgetMin] = useState(lead.budget_min || '');
    const [budgetMax, setBudgetMax] = useState(lead.budget_max || '');
    const [roomsMin, setRoomsMin] = useState(lead.preference_rooms_min || '');
    const [roomsMax, setRoomsMax] = useState(lead.preference_rooms_max || '');
    const [surfaceMin, setSurfaceMin] = useState(lead.preference_surface_min || '');
    const [moveInDate, setMoveInDate] = useState(lead.move_in_date || '');
    const [occupantsInfo, setOccupantsInfo] = useState(lead.occupants_info || '');
    const [hasSmallKids, setHasSmallKids] = useState<boolean>(lead.has_small_kids || false);
    const [hasPets, setHasPets] = useState<boolean>(lead.has_pets || false);
    const [notes, setNotes] = useState(lead.notes || lead.social_notes || '');
    const [likedListingsLinks, setLikedListingsLinks] = useState(lead.liked_listings_links || '');
    const [clientName, setClientName] = useState(lead.name || '');
    const [clientPhone, setClientPhone] = useState(lead.phone || '');
    const [isSavingPref, setIsSavingPref] = useState(false);

    // Checkboxes (Both defaulted to true)
    const [findSelfFromOwner, setFindSelfFromOwner] = useState<boolean>(lead.find_self_from_owner !== false);
    const [wantsAgentHelp, setWantsAgentHelp] = useState<boolean>(lead.wants_agent_help !== false);

    // System locations state for multi-select & map draw
    const [citiesList, setCitiesList] = useState<string[]>(ROMANIAN_CITIES);
    const [citiesListFull, setCitiesListFull] = useState<{ id: string; name: string }[]>([]);
    const [allRawAreas, setAllRawAreas] = useState<{ name: string; parent_id: string | null }[]>([]);
    const [polygon, setPolygon] = useState<{ lat: number; lng: number }[] | undefined>(lead.preference_location_polygon || undefined);
    const [showMap, setShowMap] = useState(false);

    useEffect(() => {
        getSystemLocations().then(res => {
            if (res.cities?.length) {
                setCitiesListFull(res.cities);
                const formatted = formatCityList(res.cities, res.counties || []);
                setCitiesList(formatted);
            }
            if (res.areas?.length) {
                setAllRawAreas(res.areas);
            }
        });
    }, []);

    const filteredAreasList = React.useMemo(() => {
        const selectedCityNames = prefCity
            ? prefCity.split(',').map((c: string) => cleanCityName(c).trim()).filter(Boolean)
            : [];

        if (selectedCityNames.length === 0) {
            return [];
        }

        const normalizedSelected = selectedCityNames.map((name: string) => normalizeText(name));

        const selectedCityIds = citiesListFull
            .filter((c: any) => normalizedSelected.includes(normalizeText(c.name)))
            .map((c: any) => c.id);

        const matchedAreas = allRawAreas.filter((a: any) => a.parent_id && selectedCityIds.includes(a.parent_id));
        
        if (matchedAreas.length > 0) {
            return Array.from(new Set(matchedAreas.map((a: any) => a.name))).sort((a: string, b: string) => a.localeCompare(b, 'ro'));
        }

        if (normalizedSelected.some((n: string) => n.includes('timi'))) {
            return TIMISOARA_AREAS;
        }

        return [];
    }, [prefCity, citiesListFull, allRawAreas]);

    // PWA Install prompt & Device states
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showPWAInstructions, setShowPWAInstructions] = useState(false);
    const [showPWAModal, setShowPWAModal] = useState(false);
    const [isIOSDevice, setIsIOSDevice] = useState(false);
    const [isStandaloneApp, setIsStandaloneApp] = useState(false);
    const [showWelcomeModal, setShowWelcomeModal] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
            setIsIOSDevice(isIOS);
            setIsStandaloneApp(isStandalone);

            const storageKey = `seen_imobum_welcome_${lead.id || lead.phone || 'client'}`;
            const seen = localStorage.getItem(storageKey);
            if (!seen) {
                setShowWelcomeModal(true);
            }
        }
    }, [lead.id, lead.phone]);

    const handleDismissWelcomeModal = () => {
        if (typeof window !== 'undefined') {
            const storageKey = `seen_imobum_welcome_${lead.id || lead.phone || 'client'}`;
            localStorage.setItem(storageKey, 'true');
        }
        setShowWelcomeModal(false);
    };

    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(err => {
                console.log('SW registration:', err);
            });
        }

        const handleBeforeInstall = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstall);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    }, []);

    const handleInstallPWA = async () => {
        if (deferredPrompt) {
            try {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    setDeferredPrompt(null);
                    setShowPWAModal(false);
                    return;
                }
            } catch (e) {
                console.error("PWA Install prompt error:", e);
            }
        }
        setShowPWAModal(true);
    };

    const handleInstantActivateAI = async () => {
        if (!confirm(`Dorești să activezi instant potrivirile AI pentru ${instantAiCost} credite?`)) return;
        setIsActivatingInstant(true);
        try {
            const res = await activateInstantAIMatching();
            if (res.error) {
                if (res.insufficient) {
                    alert('Fonduri insuficiente! Te rugăm să îți alimentezi soldul de credite.');
                } else {
                    alert('Eroare la activare: ' + res.error);
                }
            } else {
                alert(`Felicitări! Potrivirile AI au fost activate instant. Cost: ${res.cost || instantAiCost} credite.`);
                setIsApproved(true);
                setCredits(prev => Math.max(0, prev - (res.cost || instantAiCost)));
                // Load AI suggestions
                setIsLoadingAI(true);
                if (lead.id) {
                    const results = await findMatchingProperties(lead.id);
                    const existingIds = matches.map(m => m.property_id || m.property?.id);
                    const newSuggestions = results.filter((p: any) => !existingIds.includes(p.id));
                    setAiSuggestions(newSuggestions);
                }
                setIsLoadingAI(false);
            }
        } catch (err: any) {
            alert('Eroare la activarea instantă: ' + err.message);
        } finally {
            setIsActivatingInstant(false);
        }
    };

    // Calendar Modal State
    const [calendarModalProperty, setCalendarModalProperty] = useState<any>(null);
    const [calendarEventType, setCalendarEventType] = useState<'De Sunat' | 'De Resunat' | 'De Vizionat' | 'De Văzut'>('De Sunat');
    const [calendarDate, setCalendarDate] = useState<string>(new Date().toISOString().slice(0, 10));
    const [calendarTime, setCalendarTime] = useState<string>('12:00');
    const [calendarDetails, setCalendarDetails] = useState<string>('');
    const [isSavingCalendar, setIsSavingCalendar] = useState(false);
    const [gcalExportUrl, setGcalExportUrl] = useState<string>('');

    // Log client page visit and sync live credit balance from database
    useEffect(() => {
        let isMounted = true;

        const syncLiveCredits = async () => {
            try {
                const { getUserCredits } = await import('@/app/lib/actions/credits');
                const res = await getUserCredits();
                if (isMounted && res && 'credits' in res && typeof res.credits === 'number') {
                    setCredits(res.credits);
                }
            } catch (err) {
                console.error("Error syncing live credits:", err);
            }
        };

        syncLiveCredits();

        const handleFocus = () => {
            syncLiveCredits();
        };

        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', handleFocus);

        logUserActivity({
            event_type: 'page_view',
            page_path: '/dashboard/client/ai-matching',
            description: 'Client a accesat tabul de AI Matching Self-Service'
        });

        return () => {
            isMounted = false;
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleFocus);
        };
    }, []);

    const loadAISuggestions = async () => {
        if (!isApproved) return;
        setIsLoadingAI(true);
        try {
            if (!lead.id) return;

            // Perform credit deduction for AI Matching Search
            const { deductUserCredits } = await import('@/app/lib/actions/credits');
            const deductRes = await deductUserCredits(instantAiCost, 'Consum Căutare cu AI (Matching)', { feature: 'ai_matching_search' });

            if (deductRes.error) {
                if (deductRes.insufficient) {
                    alert('Fonduri insuficiente! Te rugăm să îți alimentezi soldul de credite.');
                } else {
                    alert('Eroare la procesare credite: ' + deductRes.error);
                }
                return;
            }

            // Deduct credits immediately in UI state
            if (typeof deductRes.remaining === 'number') {
                setCredits(deductRes.remaining);
            } else {
                setCredits(prev => Math.max(0, prev - instantAiCost));
            }

            const results = await findMatchingProperties(lead.id);
            const existingIds = matches.map(m => m.property_id || m.property?.id);
            const newSuggestions = results.filter((p: any) => !existingIds.includes(p.id));
            setAiSuggestions(newSuggestions);
        } catch (error) {
            console.error('Failed to load AI suggestions:', error);
        } finally {
            setIsLoadingAI(false);
        }
    };

    const handleSavePreferences = async () => {
        setIsSavingPref(true);
        try {
            const updatedData = {
                ...lead,
                name: clientName.trim() || lead.name,
                phone: clientPhone.trim() || lead.phone,
                preference_listing_type: prefListingType,
                preference_type: prefType,
                preference_location_city: prefCity,
                preference_location_area: prefArea,
                preference_location_polygon: polygon || null,
                budget_min: budgetMin ? Number(budgetMin) : null,
                budget_max: budgetMax ? Number(budgetMax) : null,
                preference_rooms_min: roomsMin ? Number(roomsMin) : null,
                preference_rooms_max: roomsMax ? Number(roomsMax) : null,
                preference_surface_min: surfaceMin ? Number(surfaceMin) : null,
                move_in_date: moveInDate || null,
                occupants_info: occupantsInfo || null,
                has_small_kids: hasSmallKids,
                has_pets: hasPets,
                notes: notes || null,
                social_notes: notes || null,
                liked_listings_links: likedListingsLinks || null,
                find_self_from_owner: findSelfFromOwner,
                wants_agent_help: wantsAgentHelp
            };
            const res = await updateLead(lead.id, updatedData);
            if (res?.error) {
                alert('Eroare la salvarea preferințelor: ' + res.error);
            } else {
                alert('Criteriile au fost actualizate! Se reîncarcă sugestiile AI...');
                setIsPreferencesOpen(false);
                if (lead.is_approved !== false) {
                    loadAISuggestions();
                }
            }
        } catch (err: any) {
            alert('Eroare la salvare: ' + err.message);
        } finally {
            setIsSavingPref(false);
        }
    };

    const handleUpdateStatus = async (propertyId: string, status: string) => {
        if (!lead.id) return;
        setUpdatingIds(prev => [...prev, propertyId]);
        logUserActivity({
            event_type: 'status_change',
            description: `Client a schimbat stadiul proprietății ${propertyId} în ${status}`,
            metadata: { property_id: propertyId, new_status: status }
        });

        try {
            const res = await upsertMatchStatus(lead.id, propertyId, status);
            if (res.error) throw new Error(res.error);

            setMatches(prev => {
                const existing = prev.find(m => (m.property_id || m.property?.id) === propertyId);
                if (existing) {
                    return prev.map(m => (m.property_id || m.property?.id) === propertyId ? { ...m, status } : m);
                } else {
                    const prop = aiSuggestions.find(s => s.id === propertyId);
                    return [{ id: res.data?.id, property_id: propertyId, status, property: prop, created_at: new Date().toISOString() }, ...prev];
                }
            });

            setAiSuggestions(prev => prev.filter(s => s.id !== propertyId));
        } catch (error) {
            console.error('Failed to update status:', error);
            alert('A apărut o eroare la actualizarea stadiului.');
        } finally {
            setUpdatingIds(prev => prev.filter(id => id !== propertyId));
        }
    };

    const handleToggleWantToSeeAgain = async (matchId: string, currentState: boolean) => {
        const newState = !currentState;
        setMatches(prev => prev.map(m => m.id === matchId ? { ...m, is_want_to_see_again: newState } : m));
        await updateMatchWantToSeeAgainFlag(matchId, newState);
    };

    // Open Calendar Modal
    const handleOpenCalendarModal = (property: any, defaultType: 'De Sunat' | 'De Resunat' | 'De Vizionat' | 'De Văzut' = 'De Sunat') => {
        setCalendarModalProperty(property);
        setCalendarEventType(defaultType);
        setCalendarDate(new Date().toISOString().slice(0, 10));
        setCalendarTime('12:00');
        setCalendarDetails(`Eveniment [${defaultType}] pentru proprietatea ${property.title || property.friendly_id}`);
        setGcalExportUrl('');
    };

    const handleSaveCalendarEvent = async () => {
        if (!calendarModalProperty) return;
        setIsSavingCalendar(true);
        try {
            const dateObj = new Date(`${calendarDate}T${calendarTime}:00`);
            const propTitle = calendarModalProperty.title || `Proprietate ${calendarModalProperty.friendly_id || ''}`;
            const propLink = `${window.location.origin}/properties/${calendarModalProperty.id}`;

            const res = await saveClientCalendarEvent({
                property_id: calendarModalProperty.id,
                event_type: calendarEventType,
                event_date: dateObj.toISOString(),
                details: calendarDetails,
                property_title: propTitle,
                property_link: propLink
            });

            // Generate Google Calendar Link
            const startISO = dateObj.toISOString().replace(/-|:|\.\d\d\d/g, '');
            const endDateObj = new Date(dateObj.getTime() + 30 * 60000);
            const endISO = endDateObj.toISOString().replace(/-|:|\.\d\d\d/g, '');

            const titleText = `[${calendarEventType}] ${propTitle}`;
            const detailsText = `${calendarDetails}\n\nLink Proprietate: ${propLink}`;
            const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(titleText)}&dates=${startISO}/${endISO}&details=${encodeURIComponent(detailsText)}`;

            setGcalExportUrl(url);
            alert(`Evenimentul [${calendarEventType}] a fost salvat cu succes în calendar!`);
        } catch (err: any) {
            alert('Eroare la salvarea evenimentului: ' + err.message);
        } finally {
            setIsSavingCalendar(false);
        }
    };

    const currentTabObj = TABS.find(t => t.id === activeTab) || TABS[0];

    // Filter properties per tab
    const getTabProperties = (tabId: string) => {
        if (tabId === 'curate') return aiSuggestions;
        if (tabId === 'winner') return matches.filter(m => m.status === 'winner' || m.status === 'sold');
        return matches.filter(m => m.status === tabId);
    };

    const currentProperties = getTabProperties(activeTab);

    return (
        <div className="max-w-7xl mx-auto px-1 sm:px-4 lg:px-6 pt-2 md:pt-4 pb-24 space-y-3.5">
            {/* First Time Welcome Pop-up Modal for Client Login */}
            {/* First Time Welcome Pop-up Modal for Client Login */}
            {showWelcomeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-900 border-2 border-amber-500/50 text-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative overflow-hidden text-left">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
                        
                        <div className="relative border-b border-slate-800 pb-4">
                            <button
                                onClick={handleDismissWelcomeModal}
                                className="absolute top-0 right-0 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-colors shrink-0 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            
                            <div className="text-center space-y-2 pr-8">
                                <div className="flex items-center justify-center gap-2">
                                    <div className="p-2 bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 rounded-xl font-black shadow-lg">
                                        <Sparkles className="w-5 h-5 fill-current" />
                                    </div>
                                    <h3 className="font-extrabold text-base sm:text-lg text-white">
                                        Bine ai venit pe Imobum.com!
                                    </h3>
                                </div>
                                <p className="text-xs text-slate-300 font-medium max-w-sm mx-auto">
                                    Salvează datele și adaugă aplicația pe telefon pentru acces rapid
                                </p>
                                
                                {/* 1) Centered larger Fă Screenshot Acum button with Scan icon */}
                                <div className="pt-2 flex justify-center">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            alert('Fă o captură de ecran (screenshot) pe telefonul tău pentru a salva aceste date!');
                                        }}
                                        className="px-5 py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 border border-amber-300/80 transition-all cursor-pointer transform hover:scale-105 active:scale-95"
                                    >
                                        <Scan className="w-4 h-4 text-slate-950" />
                                        <span>Fă Screenshot Acum</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 2) Credentials Card inside Modal (Username : & Parolă : in 2 columns) */}
                        <div className="bg-slate-950 border border-indigo-500/30 rounded-2xl p-4 space-y-3 text-left">
                            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                                <Key className="w-4 h-4 text-yellow-400" />
                                <span>Datele Tale de Conectare</span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 bg-black/60 p-3 rounded-xl border border-white/10 font-mono text-xs">
                                <div>
                                    <span className="text-[10px] text-slate-400 block font-sans font-bold uppercase mb-0.5">Username :</span>
                                    <span className="text-white font-bold select-all break-all">{lead.email || `${lead.phone?.replace(/\D/g, '')}@client.imobum.com`}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-400 block font-sans font-bold uppercase mb-0.5">Parolă :</span>
                                    <span className="text-yellow-400 font-bold select-all">{lead.phone || 'Numărul tău de telefon'}</span>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs text-slate-300 font-sans">
                                <p className="text-[11px] leading-relaxed text-slate-300">
                                    💡 <strong>Schimbare Parolă:</strong> Îți poți schimba sau vedea parola oricând accesând profilul tău din meniul superior (dreapta sus).
                                </p>
                                <Link
                                    href="/cont/profil"
                                    className="px-3 py-1.5 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white rounded-xl border border-slate-700/80 font-bold text-[11px] flex items-center gap-2 shadow-sm transition-all shrink-0 cursor-pointer"
                                >
                                    <div className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px] font-black border border-orange-400">
                                        <User className="w-3 h-3" />
                                    </div>
                                    <span>Dreapta sus ➔ Profilul Tău</span>
                                </Link>
                            </div>
                        </div>

                        {/* 3) & 4) App Shortcut Instructions (Title: Adaugă Pe Ecranul Telefonului Aplicatia) */}
                        <div className="bg-slate-950 border border-orange-500/30 rounded-2xl p-4 space-y-3 text-left">
                            <h4 className="font-extrabold text-xs text-orange-400 flex items-center gap-2">
                                <Smartphone className="w-4 h-4 text-orange-400" /> Adaugă Pe Ecranul Telefonului Aplicatia
                            </h4>

                            {isStandaloneApp ? (
                                <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 bg-emerald-950/40 p-3 rounded-xl border border-emerald-500/20">
                                    <Check className="w-4 h-4 text-emerald-400" /> Aplicația este deja adăugată pe ecranul principal al telefonului tău!
                                </p>
                            ) : (
                                <div className="space-y-2 text-xs text-slate-200">
                                    {deferredPrompt && (
                                        <button
                                            type="button"
                                            onClick={handleInstallPWA}
                                            className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-500 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md mb-2 transition-all cursor-pointer"
                                        >
                                            <Smartphone className="w-4 h-4" /> Adaugă Pe Ecran Cu Un Click
                                        </button>
                                    )}

                                    <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-2">
                                        <p className="font-bold text-amber-300 text-xs">Cum adaugi pe Ecran?</p>
                                        
                                        {isIOSDevice ? (
                                            <ol className="space-y-1.5 text-[11px] text-slate-300 font-medium">
                                                <li className="flex items-start gap-1.5">
                                                    <span className="font-bold text-amber-400 shrink-0">1)</span>
                                                    <span>Apasă pe meniul browserului — butonul <strong className="text-white bg-slate-800 px-1 py-0.5 rounded border border-slate-700">Partajare / Share ⎋</strong> din Safari.</span>
                                                </li>
                                                <li className="flex items-start gap-1.5">
                                                    <span className="font-bold text-amber-400 shrink-0">2)</span>
                                                    <span>Derulează și selectează <strong className="text-amber-300 font-bold">„Add to Home Screen / Adaugă la ecranul de pornire ⊕”</strong>.</span>
                                                </li>
                                                <li className="flex items-start gap-1.5">
                                                    <span className="font-bold text-amber-400 shrink-0">3)</span>
                                                    <span>Apasă pe <strong className="text-white font-bold">„Adaugă”</strong> în colțul dreapta sus.</span>
                                                </li>
                                            </ol>
                                        ) : (
                                            <ol className="space-y-1.5 text-[11px] text-slate-300 font-medium">
                                                <li className="flex items-start gap-1.5">
                                                    <span className="font-bold text-amber-400 shrink-0">1)</span>
                                                    <span>Apasă pe meniul browserului — cele <strong className="text-white font-bold">3 puncte (⋮)</strong> din colțul dreapta sus.</span>
                                                </li>
                                                <li className="flex items-start gap-1.5">
                                                    <span className="font-bold text-amber-400 shrink-0">2)</span>
                                                    <span>Selectează: <strong className="text-orange-400 font-bold">Adaugă pe ecranul principal / Add to Home Screen</strong>.</span>
                                                </li>
                                            </ol>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action Dismiss Button */}
                        <button
                            onClick={handleDismissWelcomeModal}
                            className="w-full py-3.5 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer"
                        >
                            <Check className="w-4.5 h-4.5" /> Am înțeles & Am salvat datele
                        </button>
                    </div>
                </div>
            )}

            {/* Collapsible Recommendation Message Header Box */}
            <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white rounded-2xl px-5 py-3 shadow-md relative overflow-hidden transition-all space-y-3">
                <div 
                    onClick={() => setIsRecommendationOpen(!isRecommendationOpen)}
                    className="flex items-center justify-between cursor-pointer select-none"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                            <Sparkles className="w-5 h-5 text-yellow-300 fill-current" />
                        </div>
                        <div>
                            <h2 className="text-sm sm:text-base font-semibold tracking-tight flex items-center gap-2">
                                Recomandări & Acces Rapid Cont
                            </h2>
                            <p className="text-[11px] text-orange-100 font-medium">Datele de autentificare, shortcut-ul aplicației și sfaturile AI</p>
                        </div>
                    </div>

                    <div className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-white shrink-0">
                        {isRecommendationOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                </div>

                {isRecommendationOpen && (
                    <div className="space-y-2.5 pt-1 animate-in fade-in duration-200">
                        {/* Upper Section 1: Datele Tale de Autentificare */}
                        <div className="bg-slate-950/80 border border-amber-400/30 text-white rounded-xl p-3 shadow-md space-y-2">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-amber-500/20 text-yellow-400 rounded-lg border border-amber-500/30">
                                        <Key className="w-3.5 h-3.5 text-yellow-300" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-xs sm:text-sm text-white">
                                            Datele Tale de Autentificare
                                        </h4>
                                        <p className="text-[10px] text-slate-300">Păstrează aceste date pentru a te reconecta oricând pe Imobum.com</p>
                                    </div>
                                </div>
                                <div className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[9px] font-semibold uppercase shrink-0">
                                    📸 Fă Screenshot
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-black/50 p-2.5 rounded-lg border border-white/10 font-mono text-xs">
                                <div>
                                    <span className="text-[9px] text-slate-400 block font-sans font-semibold uppercase">User / Email Autentificare</span>
                                    <span className="text-white font-semibold select-all">{lead.email || `${lead.phone?.replace(/\D/g, '')}@client.imobum.com`}</span>
                                </div>
                                <div>
                                    <span className="text-[9px] text-slate-400 block font-sans font-semibold uppercase">Parolă Autentificare</span>
                                    <span className="text-yellow-400 font-semibold select-all">{lead.phone || 'Numărul tău de telefon'}</span>
                                </div>
                            </div>

                            <div className="pt-1.5 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-300 font-sans">
                                <p className="text-[10px] leading-relaxed text-slate-300">
                                    💡 <strong>Schimbare Parolă:</strong> Îți poți schimba sau vedea parola oricând accesând profilul tău din meniul superior (dreapta sus).
                                </p>
                                <Link
                                    href="/cont/profil"
                                    className="px-2.5 py-1 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white rounded-xl border border-slate-700/80 font-semibold text-[10px] flex items-center gap-1.5 shadow-sm transition-all shrink-0 cursor-pointer"
                                >
                                    <div className="w-4 h-4 rounded-full bg-orange-500 text-white flex items-center justify-center text-[9px] font-semibold border border-orange-400">
                                        <User className="w-2.5 h-2.5" />
                                    </div>
                                    <span>Dreapta sus ➔ Profilul Tău</span>
                                </Link>
                            </div>
                        </div>

                        {/* Upper Section 2: Adaugă Aplicația pe Ecranul Telefonului Tău */}
                        <div className="bg-slate-950/80 border border-orange-500/30 text-white rounded-xl p-3 shadow-md space-y-2">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-orange-600/30 text-orange-400 rounded-lg border border-orange-500/30">
                                        <Smartphone className="w-3.5 h-3.5 text-orange-300" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-xs sm:text-sm text-white">
                                            Adaugă Aplicația pe Ecranul Telefonului
                                        </h4>
                                        <p className="text-[10px] text-slate-300">Acces instant cu o singură atingere pentru a verifica noile potriviri AI</p>
                                    </div>
                                </div>

                                {!isStandaloneApp && (
                                    <button
                                        onClick={handleInstallPWA}
                                        className="px-3 py-1.5 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 rounded-lg text-[11px] font-semibold flex items-center gap-1 shadow-md active:scale-95 cursor-pointer shrink-0"
                                    >
                                        <Smartphone className="w-3.5 h-3.5 fill-current" /> Adaugă Shortcut pe Ecran
                                    </button>
                                )}
                            </div>

                            {/* Device specific instruction text inside section */}
                            {isStandaloneApp ? (
                                <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
                                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                    <span>Aplicația este deja adăugată pe ecranul principal al telefonului tău!</span>
                                </div>
                            ) : isIOSDevice ? (
                                <div className="p-2.5 bg-indigo-950/80 border border-indigo-500/30 rounded-lg text-xs text-indigo-100 space-y-1">
                                    <p className="font-semibold text-amber-300 text-[11px] flex items-center gap-1">
                                        📱 Instrucțiuni pentru iPhone (Safari):
                                    </p>
                                    <ol className="list-decimal list-inside space-y-0.5 text-[10px] text-slate-200">
                                        <li>Apasă pe butonul <strong className="text-white bg-slate-800 px-1 py-0.5 rounded border border-slate-700 font-semibold">Partajare / Share ⎋</strong> din josul ecranului Safari.</li>
                                        <li>Selectează opțiunea <strong className="text-amber-300 font-semibold">„Add to Home Screen / Adaugă la ecranul de pornire ⊕”</strong>.</li>
                                        <li>Apasă pe <strong className="text-white font-semibold">„Adaugă”</strong> în dreapta sus.</li>
                                    </ol>
                                </div>
                            ) : (
                                <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 space-y-1">
                                    <p className="font-semibold text-amber-300 text-[11px]">📱 Pași pentru Android (Chrome / Browser):</p>
                                    <p className="text-[10px] text-slate-300">
                                        Apasă pe cele <strong className="text-white">3 puncte (⋮)</strong> din colțul dreapta sus al browserului și alege <strong className="text-orange-400 font-semibold">"Add to Home Screen / Install app"</strong>.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Lower Section 3: Recomandări imobiliare */}
                        <div className="text-[11px] leading-relaxed text-orange-50 font-medium bg-black/30 p-3 rounded-xl backdrop-blur-sm border border-white/10 whitespace-pre-line">
                            {recommendation.text}
                        </div>
                    </div>
                )}
            </div>

            {/* Collapsible Section: Criteriile Tale de Căutare */}
            <div className="bg-white rounded-2xl shadow-md border border-indigo-200 overflow-hidden">
                <div 
                    onClick={() => setIsPreferencesOpen(!isPreferencesOpen)}
                    className="px-5 py-3 bg-gradient-to-r from-indigo-700 via-blue-700 to-indigo-800 text-white flex items-center justify-between cursor-pointer select-none hover:from-indigo-600 hover:to-blue-700 transition-all"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 backdrop-blur-md text-yellow-300 rounded-xl border border-white/20 font-semibold shrink-0">
                            <SlidersHorizontal className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white text-sm sm:text-base flex items-center gap-2 tracking-tight">
                                Criteriile Tale de Căutare
                            </h3>
                            <p className="text-[11px] text-blue-100 font-medium">De aici modifici criteriile tale de cautare pentru AI</p>
                        </div>
                    </div>
                    <div className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-white shrink-0">
                        {isPreferencesOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                </div>

                {isPreferencesOpen && (
                    <div className="p-6 bg-white space-y-5 animate-in fade-in duration-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Vreau Să</label>
                                <select
                                    value={prefListingType}
                                    onChange={(e) => setPrefListingType(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                                >
                                    <option value="For Sale" className="bg-slate-900 text-white font-semibold py-1">Cumpăr (De vânzare)</option>
                                    <option value="For Rent" className="bg-slate-900 text-white font-semibold py-1">Închiriez (De închiriat)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Tip Proprietate</label>
                                <select
                                    value={prefType}
                                    onChange={(e) => setPrefType(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                                >
                                    <option value="Apartment" className="bg-slate-900 text-white font-semibold py-1">Apartament</option>
                                    <option value="House" className="bg-slate-900 text-white font-semibold py-1">Casă / Vilă</option>
                                    <option value="Commercial" className="bg-slate-900 text-white font-semibold py-1">Spațiu Comercial</option>
                                    <option value="Land" className="bg-slate-900 text-white font-semibold py-1">Teren</option>
                                    <option value="Industrial" className="bg-slate-900 text-white font-semibold py-1">Industrial</option>
                                    <option value="Business" className="bg-slate-900 text-white font-semibold py-1">Afacere</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Oraș</label>
                                <MultiSearchableSelect
                                    values={prefCity ? prefCity.split(',').map((c: string) => c.trim()).filter(Boolean) : []}
                                    options={citiesList}
                                    onChange={(vals) => setPrefCity(vals.join(', '))}
                                    placeholder="Scrie sau selectează orașe..."
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Cartier / Zonă</label>
                                <MultiSearchableSelect
                                    values={prefArea ? prefArea.split(',').map((a: string) => a.trim()).filter(Boolean) : []}
                                    options={filteredAreasList}
                                    onChange={(vals) => setPrefArea(vals.join(', '))}
                                    placeholder={filteredAreasList.length ? "Scrie sau selectează zone..." : "Selectează mai întâi orașul..."}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                                />
                            </div>

                            <div className="col-span-full space-y-1.5 pt-1">
                                <label className="block text-xs font-semibold text-slate-700 uppercase">Desenează pe hartă zona exactă</label>
                                <button
                                    type="button"
                                    onClick={() => setShowMap(true)}
                                    className={`w-full flex items-center justify-center gap-1.5 px-4 py-2.5 border rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer ${polygon?.length ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'}`}
                                >
                                    <MapPin className="w-4 h-4 text-violet-600 shrink-0" />
                                    {polygon?.length ? 'Editează zona pe hartă' : 'Desenează zona pe hartă'}
                                </button>
                                {polygon?.length ? (
                                    <div className="text-[10px] text-green-600 font-semibold flex items-center gap-1 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
                                        ✓ Zone specifice desenate pe hartă ({polygon.length} puncte)
                                    </div>
                                ) : null}
                            </div>

                            {/* Map Selector Modal */}
                            {showMap && (
                                <DrawAreaSelector
                                    city={prefCity}
                                    value={polygon}
                                    onChange={(poly) => setPolygon(poly || undefined)}
                                    onClose={() => setShowMap(false)}
                                />
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Buget (Min - Max €)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        placeholder="Min (€)"
                                        value={budgetMin}
                                        onChange={(e) => setBudgetMin(e.target.value)}
                                        className="w-1/2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Max (€)"
                                        value={budgetMax}
                                        onChange={(e) => setBudgetMax(e.target.value)}
                                        className="w-1/2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Camere (Min - Max)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        value={roomsMin}
                                        onChange={(e) => setRoomsMin(e.target.value)}
                                        className="w-1/2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        value={roomsMax}
                                        onChange={(e) => setRoomsMax(e.target.value)}
                                        className="w-1/2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Suprafață Utilă Min (m²)</label>
                                <input
                                    type="number"
                                    placeholder="ex. 50"
                                    value={surfaceMin}
                                    onChange={(e) => setSurfaceMin(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">De când doriți să vă mutați?</label>
                                <input
                                    type="date"
                                    value={moveInDate}
                                    onChange={(e) => setMoveInDate(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500 cursor-pointer"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Nickname / Nume</label>
                                <input
                                    type="text"
                                    value={clientName}
                                    onChange={(e) => setClientName(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Număr de Telefon</label>
                                <input
                                    type="tel"
                                    value={clientPhone}
                                    onChange={(e) => setClientPhone(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                                />
                            </div>
                        </div>

                        {/* Rent-specific details & notes */}
                        {prefListingType === 'For Rent' && (
                            <div className="p-4 bg-orange-50/50 border border-orange-100 rounded-xl space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold text-orange-900 uppercase mb-1">Cine va locui în apartament?</label>
                                    <input
                                        type="text"
                                        placeholder="ex. Cuplu, o persoană, 2 studenți..."
                                        value={occupantsInfo}
                                        onChange={(e) => setOccupantsInfo(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-800 bg-white p-2.5 rounded-xl border border-slate-200">
                                        <input
                                            type="checkbox"
                                            checked={hasSmallKids}
                                            onChange={(e) => setHasSmallKids(e.target.checked)}
                                            className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                                        />
                                        <span>Am copii mici</span>
                                    </label>
                                    <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-800 bg-white p-2.5 rounded-xl border border-slate-200">
                                        <input
                                            type="checkbox"
                                            checked={hasPets}
                                            onChange={(e) => setHasPets(e.target.checked)}
                                            className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                                        />
                                        <span>Am animal de companie</span>
                                    </label>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Lasă mai jos Link cu ce ai văzut și ți-a plăcut:</label>
                                <textarea
                                    rows={2}
                                    placeholder="Link-uri de pe Facebook, TikTok, sau alte site-uri..."
                                    value={likedListingsLinks}
                                    onChange={(e) => setLikedListingsLinks(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Ce te interesează?</label>
                                <textarea
                                    rows={2}
                                    placeholder="ex. Zonă liniștită, balcon mare, parcare..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200 hover:bg-slate-100/70 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={findSelfFromOwner}
                                    onChange={(e) => setFindSelfFromOwner(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                                />
                                <span>Găsește singur de la proprietar</span>
                            </label>

                            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200 hover:bg-slate-100/70 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={wantsAgentHelp}
                                    onChange={(e) => setWantsAgentHelp(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span>Vreau ajutor de la un Agent / Broker Imobiliar</span>
                            </label>
                        </div>

                        <div className="flex justify-end pt-2 border-t border-slate-100">
                            <button
                                onClick={handleSavePreferences}
                                disabled={isSavingPref}
                                className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md shadow-orange-600/20 cursor-pointer"
                            >
                                <Check className="w-4 h-4" />
                                {isSavingPref ? 'Se salvează...' : 'Salvează Criteriile & Reîncarcă AI'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* User AI Credits Balance Bar - Positioned AFTER Criteriile Tale de Căutare */}
            <div className="flex items-center justify-between bg-slate-900 text-white px-5 py-3 rounded-2xl border border-slate-800 shadow-md">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-500/20 text-yellow-400 rounded-xl border border-yellow-500/30">
                        <Coins className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Credite Disponibile</span>
                        <div className="text-sm font-semibold text-white flex items-center gap-1.5 font-mono">
                            Credite AI - CR: <span className="text-yellow-400 text-base font-semibold">{credits}</span>
                        </div>
                    </div>
                </div>

                <Link
                    href="/cont/plati"
                    className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-950 font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-md active:scale-95 shrink-0"
                >
                    <Coins className="w-4 h-4" /> Adaugă Credite
                </Link>
            </div>

            {/* Low Credit Warning Banner */}
            {credits <= lowCreditThreshold && (
                <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border-2 border-amber-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md animate-in fade-in">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-amber-500 text-slate-950 rounded-xl font-semibold shrink-0">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-amber-950 text-xs sm:text-sm">
                                Atenție: Sold scăzut de credite! (Mai ai doar {credits} {credits === 1 ? 'credit' : 'credite'})
                            </h4>
                            <p className="text-xs font-semibold text-slate-700 mt-0.5">
                                Reîncarcă soldul sau obține <strong>CREDITE GRATUIT</strong> recomandând un prieten sau distribuind link-ul tău pe Social Media pentru ca și alții să se înregistreze!
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/cont/profil"
                        className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-semibold shrink-0 shadow-md transition-all active:scale-95 flex items-center gap-1.5 border border-emerald-400/30"
                    >
                        <UserPlus className="w-4 h-4" /> Invită un prieten 🎁
                    </Link>
                </div>
            )}

            {/* Section Header & Explanatory Text for Tabs */}
            <div className="px-1 mb-1 space-y-1">
                <p className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 tracking-wide">
                    <Sparkles className="w-4 h-4 text-orange-500 shrink-0 fill-current" />
                    Salveaza proprietatile in categoriile de mai jos in functie de interes:
                </p>
            </div>

            {/* The Tabs Navigation with Icons & Custom Colored Badges (Wrapped on 2 rows) */}
            <div className="bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex flex-wrap gap-1 sm:gap-1.5 items-center justify-start">
                    {TABS.map(tab => {
                        const count = getTabProperties(tab.id).length;
                        const isActive = activeTab === tab.id;
                        const IconComponent = (tab as any).icon;
                        const colors = TAB_COLORS[tab.id] || {
                            active: 'bg-slate-900 text-white border-slate-800 shadow-md',
                            inactive: 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200',
                            badgeActive: 'bg-orange-500 text-white font-black',
                            badgeInactive: 'bg-slate-200 text-slate-700 font-bold',
                            iconActive: 'text-orange-400',
                            iconInactive: 'text-slate-500'
                        };

                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-2 sm:px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer border ${
                                    isActive ? colors.active : colors.inactive
                                }`}
                            >
                                {IconComponent && <IconComponent className={`w-3.5 h-3.5 ${isActive ? colors.iconActive : colors.iconInactive}`} />}
                                <span>{tab.name}</span>
                                <span className={`px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] ${
                                    isActive ? colors.badgeActive : colors.badgeInactive
                                }`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Current Active Tab Explanatory Text Box (Collapsible Dropdown with Header Button) */}
            <div className={`rounded-2xl border ${currentTabObj.color} text-xs font-semibold leading-relaxed shadow-sm transition-all overflow-hidden`}>
                {/* Always-visible Header Bar with Action Button */}
                <div className="p-3 sm:p-3.5 flex items-center justify-between gap-3 bg-white/40">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        {activeTab === 'curate' ? (
                            <button
                                onClick={async () => {
                                    setIsAiStepOpen(false);
                                    await loadAISuggestions();
                                }}
                                disabled={isLoadingAI || !isApproved}
                                title={!isApproved ? "Contul este în curs de aprobare de către un operator." : `Cauta cu AI (${instantAiCost} CR)`}
                                className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white disabled:opacity-50 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md shadow-orange-600/30 transition-all shrink-0 cursor-pointer active:scale-95 border border-orange-400/40"
                            >
                                <Sparkles className={`w-4 h-4 text-yellow-300 fill-current ${isLoadingAI ? 'animate-spin' : ''}`} />
                                <span>{isLoadingAI ? 'Se caută cu AI...' : `Cauta cu AI (${instantAiCost} CR)`}</span>
                            </button>
                        ) : (
                            <span className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                                {React.createElement((currentTabObj as any).icon || Sparkles, { className: "w-4 h-4 text-orange-600" })}
                                Stadiul: {currentTabObj.name}
                            </span>
                        )}
                    </div>

                    {/* Instructions Toggle Chevron */}
                    <button
                        onClick={() => setIsAiStepOpen(!isAiStepOpen)}
                        className="p-1.5 bg-white/80 hover:bg-white rounded-lg transition-colors text-slate-700 shrink-0 flex items-center gap-1 cursor-pointer border border-slate-200"
                        title={isAiStepOpen ? "Ascunde instrucțiunile" : "Vezi instrucțiunile"}
                    >
                        <span className="text-[10px] text-slate-600 font-semibold hidden sm:inline">Instrucțiuni</span>
                        {isAiStepOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                </div>

                {/* Collapsible Instructions Content */}
                {isAiStepOpen && (
                    <div className="p-3.5 pt-1.5 border-t border-orange-200/60 animate-in fade-in duration-200 space-y-1.5">
                        {activeTab === 'curate' && (
                            <span className="font-semibold text-slate-900 text-xs block mb-1">
                                Primul pas: Cauta cu AI
                            </span>
                        )}
                        <p className="whitespace-pre-line leading-relaxed text-slate-800">{currentTabObj.desc}</p>
                    </div>
                )}
            </div>

            {/* Properties Grid (2-Column Mobile, 3-Column Desktop Layout) */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                {currentProperties.length > 0 ? (
                    currentProperties.map((item: any) => {
                        const prop = item.property || item;
                        const matchRecord = item.status ? item : null;
                        const isUpdating = updatingIds.includes(prop.id);
                        const isWantSeeAgain = matchRecord?.is_want_to_see_again || false;

                        return (
                            <div key={prop.id} className={`bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col relative group ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}>
                                {/* Image Container with Photo Carousel */}
                                <div className="relative">
                                    <PropertyCardImageSlider
                                        images={prop.images}
                                        title={prop.title}
                                        matchScore={prop.match_score}
                                    />

                                    {/* Quick Thumbs Down & Favorite Overlay Action Buttons */}
                                    <div className="absolute top-2 right-2 flex items-center gap-1.5 z-20">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleUpdateStatus(prop.id, 'saved');
                                            }}
                                            className="p-2 bg-rose-600/90 hover:bg-rose-600 text-white rounded-full shadow-lg backdrop-blur-sm transition-transform active:scale-90 cursor-pointer"
                                            title="Favorite (Adaugă la favorite)"
                                        >
                                            <Heart className="w-3.5 h-3.5 fill-current" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleUpdateStatus(prop.id, 'dismissed');
                                            }}
                                            className="p-2 bg-slate-900/90 hover:bg-rose-600 text-white rounded-full shadow-lg backdrop-blur-sm transition-transform active:scale-90 cursor-pointer"
                                            title="Thumbs Down (Nu îmi place)"
                                        >
                                            <ThumbsDown className="w-3.5 h-3.5" />
                                        </button>
                                    </div>

                                    {isWantSeeAgain && (
                                        <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-purple-600 text-white border border-purple-400 shadow-md backdrop-blur-sm flex items-center gap-1 animate-pulse z-10">
                                            <Flag className="w-3 h-3 fill-current" />
                                            <span>Mai vreau să-l văd o dată</span>
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                                    <div>
                                        <h4 className="font-semibold text-sm text-slate-900 line-clamp-2 leading-snug">{prop.title}</h4>
                                        <div className="flex items-center gap-1 text-slate-500 text-[10px] font-semibold uppercase tracking-wider mt-1.5">
                                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                            <span className="truncate">{prop.location_city || prop.city} {prop.location_area && `• ${prop.location_area}`}</span>
                                        </div>

                                        <div className="grid grid-cols-3 gap-1.5 mt-3 mb-2">
                                            <div className="p-2 bg-slate-50 rounded-xl text-center border border-slate-100">
                                                <BedDouble className="w-3.5 h-3.5 text-slate-400 mx-auto mb-0.5" />
                                                <span className="text-[9px] font-semibold text-slate-400 uppercase block">Camere</span>
                                                <span className="text-xs font-semibold text-slate-900">{prop.rooms || '-'}</span>
                                            </div>
                                            <div className="p-2 bg-slate-50 rounded-xl text-center border border-slate-100">
                                                <Ruler className="w-3.5 h-3.5 text-slate-400 mx-auto mb-0.5" />
                                                <span className="text-[9px] font-semibold text-slate-400 uppercase block">Suprafață</span>
                                                <span className="text-xs font-semibold text-slate-900">{prop.area_usable ? `${prop.area_usable} m²` : '-'}</span>
                                            </div>
                                            <div className="p-2 bg-slate-50 rounded-xl text-center border border-slate-100">
                                                <Coins className="w-3.5 h-3.5 text-orange-500 mx-auto mb-0.5" />
                                                <span className="text-[9px] font-semibold text-slate-400 uppercase block">Preț</span>
                                                <span className="text-xs font-semibold text-orange-600">€{prop.price?.toLocaleString()}</span>
                                            </div>
                                        </div>

                                        {/* Vezi Detalii & Calendar/Flag Action Buttons directly under metrics */}
                                        <div className="flex items-center justify-between gap-1.5 pt-1">
                                            <Link
                                                href={`/properties/${prop.id}`}
                                                target="_blank"
                                                className="w-full py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 shadow-sm transition-all cursor-pointer"
                                            >
                                                Vezi Detalii <ArrowUpRight className="w-3.5 h-3.5 text-slate-950" />
                                            </Link>

                                            {/* Calendar & Flag buttons if applicable */}
                                            {currentTabObj.hasCalendar && (
                                                <button
                                                    onClick={() => handleOpenCalendarModal(prop, 'De Văzut')}
                                                    className="px-2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1 shadow-sm cursor-pointer shrink-0"
                                                >
                                                    <CalendarDays className="w-3.5 h-3.5" /> Calendar
                                                </button>
                                            )}

                                            {currentTabObj.hasFlag && matchRecord && (
                                                <button
                                                    onClick={() => handleToggleWantToSeeAgain(matchRecord.id, isWantSeeAgain)}
                                                    className={`px-2 py-2 text-xs font-semibold rounded-xl flex items-center gap-1 transition-colors shrink-0 ${
                                                        isWantSeeAgain
                                                            ? 'bg-purple-600 text-white'
                                                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                                                    }`}
                                                    title="Marchează dacă mai dorești o vizionare suplimentară"
                                                >
                                                    <Flag className="w-3.5 h-3.5" /> {isWantSeeAgain ? 'Bifat' : 'Mai vreau'}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Stage Action Pill Buttons with "Salvează în :" Label */}
                                    <div className="space-y-1.5 pt-2.5 border-t border-slate-100">
                                        <span className="text-xs font-semibold text-slate-700 block">Salvează în :</span>
                                        <div className="grid grid-cols-2 gap-1.5">
                                            {TABS.filter(t => t.id !== 'curate').map(tab => {
                                                const isCurrentStatus = (item.status || 'curate') === tab.id;
                                                const colors = TAB_COLORS[tab.id];

                                                return (
                                                    <button
                                                        key={tab.id}
                                                        onClick={() => handleUpdateStatus(prop.id, tab.id)}
                                                        className={`py-1.5 px-2 text-xs font-medium rounded-xl text-center justify-center transition-all cursor-pointer border truncate ${colors.active} ${
                                                            isCurrentStatus
                                                                ? 'ring-2 ring-slate-900/50 shadow-md font-semibold scale-[1.02]'
                                                                : 'opacity-85 hover:opacity-100 active:scale-95'
                                                        }`}
                                                        title={`Mută în stadiul ${tab.name}`}
                                                    >
                                                        <span className="truncate">{tab.name}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : activeTab === 'curate' ? (
                    <div className="col-span-full bg-white rounded-2xl border-2 border-dashed border-orange-200 p-8 text-center space-y-4 shadow-sm">
                        <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                            <Sparkles className="w-7 h-7 text-orange-600 fill-current" />
                        </div>
                        <div className="max-w-md mx-auto space-y-2">
                            <h4 className="font-semibold text-slate-900 text-base">Gestioneaza cautarile tale cu AI dintr-un singur loc</h4>
                            <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                                Apasă pe butonul <strong className="text-orange-600 font-semibold">"Cauta cu AI ({instantAiCost} CR)"</strong> din caseta portocalie de mai sus pentru a porni algoritmul AI care va analiza piața și va selecta cele mai potrivite oferte pentru tine.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200 shadow-sm opacity-60 space-y-2">
                        <div className="text-sm font-bold text-slate-700">Nicio proprietate în stadiul "{currentTabObj.name}"</div>
                        <p className="text-xs text-slate-500">Vizitează tabul AI Matching sau schimbă criteriile din panoul de preferințe.</p>
                    </div>
                )}
            </div>

            {/* CALENDAR EVENT MODAL */}
            {calendarModalProperty && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
                    <div className="bg-white text-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-600 text-white rounded-xl">
                                    <CalendarDays className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-base text-slate-900">Prograemează în Calendar</h3>
                                    <p className="text-xs text-slate-500 truncate max-w-[280px]">
                                        {calendarModalProperty.title || calendarModalProperty.friendly_id}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setCalendarModalProperty(null)}
                                className="p-2 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4 text-xs">
                            <div>
                                <label className="block font-bold text-slate-700 uppercase mb-1">Tip Eveniment</label>
                                <select
                                    value={calendarEventType}
                                    onChange={(e) => setCalendarEventType(e.target.value as any)}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                                >
                                    <option value="De Sunat" className="bg-slate-900 text-white font-bold py-1">De Sunat proprietarul</option>
                                    <option value="De Resunat" className="bg-slate-900 text-white font-bold py-1">De Resunat (nu a răspuns)</option>
                                    <option value="De Vizionat" className="bg-slate-900 text-white font-bold py-1">De Vizionat (Vizionare stabilită)</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 uppercase mb-1">Data</label>
                                    <input
                                        type="date"
                                        value={calendarDate}
                                        onChange={(e) => setCalendarDate(e.target.value)}
                                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 uppercase mb-1">Ora</label>
                                    <input
                                        type="time"
                                        value={calendarTime}
                                        onChange={(e) => setCalendarTime(e.target.value)}
                                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 uppercase mb-1">Detalii / Notițe Eveniment</label>
                                <textarea
                                    rows={3}
                                    value={calendarDetails}
                                    onChange={(e) => setCalendarDetails(e.target.value)}
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                                />
                            </div>

                            {gcalExportUrl && (
                                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                                    <div className="font-bold text-emerald-800 flex items-center gap-1.5">
                                        <Check className="w-4 h-4 text-emerald-600" /> Adăugat în baza de date!
                                    </div>
                                    <a
                                        href={gcalExportUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg inline-flex items-center gap-2"
                                    >
                                        Adaugă în Google Calendar <ExternalLink className="w-4 h-4" />
                                    </a>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <button
                                onClick={() => setCalendarModalProperty(null)}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                            >
                                Închide
                            </button>
                            <button
                                onClick={handleSaveCalendarEvent}
                                disabled={isSavingCalendar}
                                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs shadow-md shadow-indigo-600/20"
                            >
                                {isSavingCalendar ? 'Se salvează...' : 'Salvează Eveniment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PWA INSTALL NATIVE-STYLE MODAL */}
            {showPWAModal && (
                <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
                    <div className="bg-slate-900 text-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-700/80 text-center space-y-5 relative">
                        <button
                            onClick={() => setShowPWAModal(false)}
                            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 cursor-pointer transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        {/* App Icon */}
                        <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl mx-auto flex items-center justify-center shadow-xl p-3 border-2 border-amber-400/40">
                            <img src="/icon-192.png" alt="Imobum AI Logo" className="w-full h-full object-contain rounded-xl" />
                        </div>

                        <div className="space-y-1">
                            <h3 className="text-lg font-black text-white">Imobum AI Real Estate</h3>
                            <p className="text-xs font-bold text-orange-400">Aplicație Mobilă Oficială</p>
                        </div>

                        <p className="text-xs text-slate-300 font-medium leading-relaxed bg-slate-950/50 p-3 rounded-2xl border border-slate-800">
                            Adaugă aplicația pe ecranul principal al telefonului pentru acces rapid instant la proprietăți și potriviri AI.
                        </p>

                        {deferredPrompt ? (
                            <button
                                onClick={() => {
                                    if (deferredPrompt) {
                                        deferredPrompt.prompt();
                                        deferredPrompt.userChoice.then((choice: any) => {
                                            if (choice.outcome === 'accepted') {
                                                setDeferredPrompt(null);
                                                setShowPWAModal(false);
                                            }
                                        });
                                    }
                                }}
                                className="w-full py-3.5 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 text-slate-950 rounded-2xl text-sm font-black shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95 border border-yellow-300/80"
                            >
                                <Download className="w-5 h-5 text-slate-950" />
                                SALVEAZĂ / INSTALEAZĂ ACUM
                            </button>
                        ) : (
                            <div className="space-y-3 pt-1">
                                <div className="text-left bg-slate-950/70 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-2.5">
                                    <p className="font-extrabold text-amber-400 flex items-center gap-1.5 text-xs">
                                        <Sparkles className="w-4 h-4 fill-current shrink-0" /> Instrucțiuni rapide de adăugare:
                                    </p>
                                    <ul className="space-y-2 list-disc list-inside text-[11px] font-medium text-slate-200 leading-relaxed">
                                        <li>Pe <strong className="text-white">Android (Chrome / Brave)</strong>: Apasă pe butonul de meniu (<strong>⋮</strong>) ➔ Alege <strong className="text-amber-300 font-bold">"Install and create shortcut"</strong> sau <strong className="text-amber-300 font-bold">"Adaugă la ecranul de pornire"</strong>.</li>
                                        <li>Pe <strong className="text-white">iPhone (Safari)</strong>: Apasă butonul <strong className="text-white">Share (Partajare ⎘)</strong> ➔ Alege <strong className="text-amber-300 font-bold">"Adaugă pe ecranul principal"</strong>.</li>
                                    </ul>
                                </div>

                                <button
                                    onClick={() => setShowPWAModal(false)}
                                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-extrabold cursor-pointer"
                                >
                                    Am Înțeles / Închide
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
