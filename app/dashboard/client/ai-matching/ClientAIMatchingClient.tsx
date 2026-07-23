'use client';

import React, { useState, useEffect } from 'react';
import { 
    Zap, Bookmark, Phone, PhoneCall, Heart, Calendar, Clock, Handshake, 
    ThumbsDown, XCircle, Award, Sparkles, RefreshCw, ChevronDown, ChevronUp, 
    SlidersHorizontal, Search, MapPin, BedDouble, Ruler, ArrowUpRight, Flag, 
    Check, AlertCircle, Plus, ExternalLink, CalendarDays, Smartphone, Coins
} from 'lucide-react';
import { upsertMatchStatus, bulkUpsertMatchStatus } from '@/app/lib/actions/matches';
import { findMatchingProperties } from '@/app/lib/actions/scoring';
import { updateLead } from '@/app/lib/actions/leads';
import { saveClientCalendarEvent, updateMatchWantToSeeAgainFlag, logUserActivity, activateInstantAIMatching } from '@/app/lib/actions/user-activity';
import Link from 'next/link';
import { decodeHtmlEntities } from '@/app/lib/utils/string';

interface Props {
    lead: any;
    initialMatches: any[];
    recommendation: { text: string; points: number };
    instantAiCost?: number;
    userCredits?: number;
}

const TABS = [
    { 
        id: 'curate', 
        name: 'AI Matching', 
        desc: 'Selectate de AI pentru tine dupa criteriile tale - Intra zilnic sau de mai multe ori aici si da refresh sa vezi ce a aparut nou intretimp',
        color: 'text-orange-600 border-orange-600 bg-orange-50'
    },
    { 
        id: 'saved', 
        name: 'Favorite', 
        desc: 'Astea mi-ar putea place, verifica detaliile dupa ce le selectezi pe toate care ti se pare ca ar putea sa-ti placa',
        color: 'text-amber-600 border-amber-600 bg-amber-50'
    },
    { 
        id: 'to_call', 
        name: 'De Sunat', 
        desc: 'Aici sunt cele pe care le-ai verificat in detaliile din descriere si vrei sa vorbesti cu proprietarul',
        color: 'text-blue-600 border-blue-600 bg-blue-50',
        hasCalendar: true
    },
    { 
        id: 'to_recall', 
        name: 'De resunat', 
        desc: 'Aici sunt cele verificate la care nu a raspuns inca proprietarul la telefon ca sa nu uiti sa-l resuni daca nu te suna inapoi',
        color: 'text-cyan-600 border-cyan-600 bg-cyan-50',
        hasCalendar: true
    },
    { 
        id: 'interested', 
        name: 'De Interes', 
        desc: 'aici sunt cele care te intereseaza si ai reusit sa vorbesti deja cu proprietarul dar inca nu sti ce sa faci - adica le ti de backup daca nu gasesti ceva mai interesant',
        color: 'text-emerald-600 border-emerald-600 bg-emerald-50'
    },
    { 
        id: 'to_visit', 
        name: 'De Vizionat', 
        desc: 'aici le pui pe cele care sigur vrei sa le vezi dar inca nu ai stabilit vizionarea',
        color: 'text-indigo-600 border-indigo-600 bg-indigo-50',
        hasCalendar: true,
        hasFlag: true
    },
    { 
        id: 'visit_scheduled', 
        name: 'De vizionat', 
        desc: 'Aici sunt cele care le-ai programat la Vizionare',
        color: 'text-purple-600 border-purple-600 bg-purple-50',
        hasCalendar: true,
        hasFlag: true
    },
    { 
        id: 'thinking', 
        name: 'Ma mai gandesc', 
        desc: 'Aici le pui pe cele la care ai fost la vizionare dar inca te mai gandesti ca sa mai vezi si altele',
        color: 'text-slate-600 border-slate-600 bg-slate-50'
    },
    { 
        id: 'negotiation', 
        name: 'Negociere', 
        desc: 'Aici le pui pe cele la care ai fost la vizionare si vrei sa negociezi cu proprietarul sau negociezi deja',
        color: 'text-orange-600 border-orange-600 bg-orange-50'
    },
    { 
        id: 'offer_made', 
        name: 'Oferte făcute', 
        desc: 'Aici găsești proprietățile la care ai trimis o ofertă de preț sau ai negociat cu proprietarul',
        color: 'text-emerald-700 border-emerald-600 bg-emerald-50 font-bold'
    },
    { 
        id: 'not_interested', 
        name: 'Nu ma intereseaza', 
        desc: 'aici sunt cele la care ai fost la vizionare si sigur nu le vrei, dar le gasesti aici daca te razgandesti',
        color: 'text-rose-600 border-rose-600 bg-rose-50'
    },
    { 
        id: 'dismissed', 
        name: 'Nu imi plac', 
        desc: 'Aici sunt cele la care le-ai dat "Nu se potrivesc" din ce a selectat AI-ul initial',
        color: 'text-gray-600 border-gray-600 bg-gray-50'
    },
    { 
        id: 'winner', 
        name: 'Castigator', 
        desc: 'Felicitari !!! Aici e cel pe care l-ai luat, te rugam sa il pui aici pentru ca el sa fie sters din baza de date ca sa nu mai apara si la altii - ca si tu te-ai saturat sa auzi "S-a dat" :) - Iti Multumim :)',
        color: 'text-yellow-600 border-yellow-600 bg-yellow-50 font-bold'
    }
];

export default function ClientAIMatchingClient({ lead, initialMatches, recommendation, instantAiCost = 5, userCredits = 0 }: Props) {
    const [matches, setMatches] = useState<any[]>(initialMatches);
    const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [isApproved, setIsApproved] = useState<boolean>(lead.is_approved !== false);
    const [credits, setCredits] = useState<number>(userCredits);
    const [isActivatingInstant, setIsActivatingInstant] = useState(false);
    const [activeTab, setActiveTab] = useState<string>('curate');
    const [updatingIds, setUpdatingIds] = useState<string[]>([]);
    const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

    // Lead preferences editing - all fields from form
    const [prefType, setPrefType] = useState(lead.preference_type || 'Apartment');
    const [prefListingType, setPrefListingType] = useState(lead.preference_listing_type || 'For Sale');
    const [prefCity, setPrefCity] = useState(lead.preference_location_city || '');
    const [prefArea, setPrefArea] = useState(lead.preference_location_area || '');
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

    // PWA Install prompt state
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

    useEffect(() => {
        const handleBeforeInstall = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstall);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    }, []);

    const handleInstallPWA = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
            }
        } else {
            alert("Pentru a adăuga pe telefon: Apasă pe meniul browserului (⋮ sau Share) și alege 'Adaugă la ecranul de pornire' / 'Add to Home Screen'!");
        }
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
    const [calendarEventType, setCalendarEventType] = useState<'De Sunat' | 'De Resunat' | 'De Vizionat'>('De Sunat');
    const [calendarDate, setCalendarDate] = useState<string>(new Date().toISOString().slice(0, 10));
    const [calendarTime, setCalendarTime] = useState<string>('12:00');
    const [calendarDetails, setCalendarDetails] = useState<string>('');
    const [isSavingCalendar, setIsSavingCalendar] = useState(false);
    const [gcalExportUrl, setGcalExportUrl] = useState<string>('');

    // Log client page visit
    useEffect(() => {
        logUserActivity({
            event_type: 'page_view',
            page_path: '/dashboard/client/ai-matching',
            description: 'Client a accesat tabul de AI Matching Self-Service'
        });
    }, []);

    useEffect(() => {
        if (activeTab === 'curate' && aiSuggestions.length === 0 && !isLoadingAI && isApproved) {
            loadAISuggestions();
        }
    }, [activeTab, isApproved]);

    const loadAISuggestions = async () => {
        if (!isApproved) return;
        setIsLoadingAI(true);
        try {
            if (!lead.id) return;
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
    const handleOpenCalendarModal = (property: any, defaultType: 'De Sunat' | 'De Resunat' | 'De Vizionat' = 'De Sunat') => {
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 pb-24">
            {/* User AI Credits Balance Top Bar */}
            <div className="flex items-center justify-between bg-slate-900 text-white px-5 py-3 rounded-2xl border border-slate-800 shadow-md">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-500/20 text-yellow-400 rounded-xl border border-yellow-500/30">
                        <Coins className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Balanță Credite Disponibile</span>
                        <div className="text-sm font-black text-white flex items-center gap-1.5 font-mono">
                            Credite AI - CR: <span className="text-yellow-400 text-base">{credits}</span>
                        </div>
                    </div>
                </div>

                <Link
                    href="/cont/plati"
                    className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-md active:scale-95 shrink-0"
                >
                    <Coins className="w-4 h-4" /> Alimentează Credite
                </Link>
            </div>

            {/* Recommendation Message Header Box */}
            <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white rounded-2xl p-6 shadow-lg relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/20 pb-4 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                            <Sparkles className="w-6 h-6 text-yellow-300 fill-current" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                                Recomandări Imobiliare <span className="bg-yellow-400 text-slate-950 text-xs px-2.5 py-0.5 rounded-full font-black">{recommendation.points} Puncte</span>
                            </h2>
                            <p className="text-xs text-orange-100 font-medium">Sfaturi importante pentru căutarea ta pe piața imobiliară</p>
                        </div>
                    </div>

                    <button
                        onClick={() => loadAISuggestions()}
                        disabled={isLoadingAI || !isApproved}
                        title={!isApproved ? "Contul este în curs de aprobare de către un operator." : "Refresh AI Matching"}
                        className="px-4 py-2 bg-white text-orange-700 hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-xs font-black flex items-center gap-2 shadow-md transition-all shrink-0 cursor-pointer"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoadingAI ? 'animate-spin' : ''}`} />
                        {isLoadingAI ? 'Se caută...' : 'Refresh AI Matching'}
                    </button>
                </div>

                <div className="text-xs leading-relaxed text-orange-50 font-medium bg-black/20 p-4 rounded-xl backdrop-blur-sm border border-white/10 whitespace-pre-line">
                    {recommendation.text}
                </div>
            </div>

            {/* Pending Approval Banner, Instant AI Activation & PWA Button */}
            {!isApproved && (
                <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-md animate-in fade-in">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-amber-500 text-slate-950 rounded-xl font-black shrink-0">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-slate-900 text-base">Cont în Curs de Aprobare & Configurare AI</h3>
                            <p className="text-sm font-semibold text-slate-700 mt-0.5">
                                Imediat vei avea setările făcute de un operator uman. Te rugăm să revii în cel mai scurt timp!
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                        <button
                            onClick={handleInstantActivateAI}
                            disabled={isActivatingInstant}
                            className="px-5 py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg transition-all shrink-0 active:scale-95 cursor-pointer"
                        >
                            <Zap className="w-4 h-4 text-yellow-300 fill-current" />
                            {isActivatingInstant ? 'Se activează...' : `Activează instant cu AI (${instantAiCost} CR)`}
                        </button>
                        <button
                            onClick={handleInstallPWA}
                            className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black flex items-center gap-2.5 transition-all shadow-lg shrink-0 active:scale-95 cursor-pointer"
                        >
                            <Smartphone className="w-4 h-4 text-yellow-400" />
                            Adaugă / Descarcă pe Telefon (PWA)
                        </button>
                    </div>
                </div>
            )}

            {/* Dropdown / Collapsible Section: Lead Details & Preferences */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div 
                    onClick={() => setIsPreferencesOpen(!isPreferencesOpen)}
                    className="px-6 py-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between cursor-pointer select-none hover:bg-slate-100/60 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-900 text-white rounded-lg">
                            <SlidersHorizontal className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                Lead Details & Preferences (Criteriile Tale de Căutare)
                            </h3>
                            <p className="text-xs text-slate-500">Modifică-ți preferințele pentru ca AI-ul să-ți găsească exact ce cauți</p>
                        </div>
                    </div>
                    <div className="text-slate-400">
                        {isPreferencesOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                </div>

                {isPreferencesOpen && (
                    <div className="p-6 bg-white space-y-5 animate-in fade-in duration-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Vreau Să</label>
                                <select
                                    value={prefListingType}
                                    onChange={(e) => setPrefListingType(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500"
                                >
                                    <option value="For Sale" className="bg-slate-900 text-white font-bold py-1">Cumpăr (De vânzare)</option>
                                    <option value="For Rent" className="bg-slate-900 text-white font-bold py-1">Închiriez (De închiriat)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tip Proprietate</label>
                                <select
                                    value={prefType}
                                    onChange={(e) => setPrefType(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500"
                                >
                                    <option value="Apartment" className="bg-slate-900 text-white font-bold py-1">Apartament</option>
                                    <option value="House" className="bg-slate-900 text-white font-bold py-1">Casă / Vilă</option>
                                    <option value="Commercial" className="bg-slate-900 text-white font-bold py-1">Spațiu Comercial</option>
                                    <option value="Land" className="bg-slate-900 text-white font-bold py-1">Teren</option>
                                    <option value="Industrial" className="bg-slate-900 text-white font-bold py-1">Industrial</option>
                                    <option value="Business" className="bg-slate-900 text-white font-bold py-1">Afacere</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Oraș Preferat</label>
                                <input
                                    type="text"
                                    placeholder="ex. Timisoara"
                                    value={prefCity}
                                    onChange={(e) => setPrefCity(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Cartier / Zonă</label>
                                <input
                                    type="text"
                                    placeholder="ex. Aradului, Lipovei"
                                    value={prefArea}
                                    onChange={(e) => setPrefArea(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Buget Maxim (€)</label>
                                <input
                                    type="number"
                                    placeholder="ex. 80000"
                                    value={budgetMax}
                                    onChange={(e) => setBudgetMax(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Camere (Min - Max)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        value={roomsMin}
                                        onChange={(e) => setRoomsMin(e.target.value)}
                                        className="w-1/2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        value={roomsMax}
                                        onChange={(e) => setRoomsMax(e.target.value)}
                                        className="w-1/2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Suprafață Utilă Min (m²)</label>
                                <input
                                    type="number"
                                    placeholder="ex. 50"
                                    value={surfaceMin}
                                    onChange={(e) => setSurfaceMin(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">De când doriți să vă mutați?</label>
                                <input
                                    type="date"
                                    value={moveInDate}
                                    onChange={(e) => setMoveInDate(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500 cursor-pointer"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nickname / Nume</label>
                                <input
                                    type="text"
                                    value={clientName}
                                    onChange={(e) => setClientName(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Număr de Telefon</label>
                                <input
                                    type="tel"
                                    value={clientPhone}
                                    onChange={(e) => setClientPhone(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500"
                                />
                            </div>
                        </div>

                        {/* Rent-specific details & notes */}
                        {prefListingType === 'For Rent' && (
                            <div className="p-4 bg-orange-50/50 border border-orange-100 rounded-xl space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-orange-900 uppercase mb-1">Cine va locui în apartament?</label>
                                    <input
                                        type="text"
                                        placeholder="ex. Cuplu, o persoană, 2 studenți..."
                                        value={occupantsInfo}
                                        onChange={(e) => setOccupantsInfo(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500"
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-800 bg-white p-2.5 rounded-xl border border-slate-200">
                                        <input
                                            type="checkbox"
                                            checked={hasSmallKids}
                                            onChange={(e) => setHasSmallKids(e.target.checked)}
                                            className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                                        />
                                        <span>Am copii mici</span>
                                    </label>
                                    <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-800 bg-white p-2.5 rounded-xl border border-slate-200">
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
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Lasă mai jos Link cu ce ai văzut și ți-a plăcut:</label>
                                <textarea
                                    rows={2}
                                    placeholder="Link-uri de pe Facebook, TikTok, sau alte site-uri..."
                                    value={likedListingsLinks}
                                    onChange={(e) => setLikedListingsLinks(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ce te interesează?</label>
                                <textarea
                                    rows={2}
                                    placeholder="ex. Zonă liniștită, balcon mare, parcare..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200 hover:bg-slate-100/70 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={findSelfFromOwner}
                                    onChange={(e) => setFindSelfFromOwner(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                                />
                                <span>Găsește singur de la proprietar</span>
                            </label>

                            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200 hover:bg-slate-100/70 transition-colors">
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
                                className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-md shadow-orange-600/20 cursor-pointer"
                            >
                                <Check className="w-4 h-4" />
                                {isSavingPref ? 'Se salvează...' : 'Salvează Criteriile & Reîncarcă AI'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* The 12 Tabs Navigation */}
            <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
                <div className="flex min-w-max gap-1">
                    {TABS.map(tab => {
                        const count = getTabProperties(tab.id).length;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                                    isActive
                                        ? 'bg-slate-900 text-white shadow-md'
                                        : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <span>{tab.name}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                    isActive ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-700'
                                }`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Current Active Tab Explanatory Text Box */}
            <div className={`p-4 rounded-2xl border ${currentTabObj.color} text-xs font-semibold leading-relaxed shadow-sm`}>
                <span className="font-extrabold block mb-0.5 text-slate-900">
                    Stadiul: {currentTabObj.name}
                </span>
                {currentTabObj.desc}
            </div>

            {/* Properties Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentProperties.length > 0 ? (
                    currentProperties.map((item: any) => {
                        const prop = item.property || item;
                        const matchRecord = item.status ? item : null;
                        const isUpdating = updatingIds.includes(prop.id);
                        const isWantSeeAgain = matchRecord?.is_want_to_see_again || false;

                        return (
                            <div key={prop.id} className={`bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}>
                                {/* Image Container */}
                                <div className="h-48 w-full bg-slate-100 relative overflow-hidden shrink-0">
                                    <img
                                        src={prop.images && prop.images[0] ? prop.images[0] : '/placeholder-property.jpg'}
                                        alt={prop.title}
                                        className="w-full h-full object-cover"
                                    />
                                    {prop.match_score !== undefined && (
                                        <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-900/80 text-white border border-slate-700 shadow-sm backdrop-blur-sm flex items-center gap-1">
                                            <Zap className="w-3 h-3 text-orange-500 fill-current" />
                                            <span>Match: {prop.match_score}</span>
                                        </div>
                                    )}

                                    {isWantSeeAgain && (
                                        <div className="absolute top-2 right-2 px-2.5 py-1 rounded-full text-[10px] font-black bg-purple-600 text-white border border-purple-400 shadow-md backdrop-blur-sm flex items-center gap-1 animate-pulse">
                                            <Flag className="w-3 h-3 fill-current" />
                                            <span>Mai vreau să-l văd o dată</span>
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                                    <div>
                                        <h4 className="font-bold text-sm text-slate-900 line-clamp-2 leading-snug">{prop.title}</h4>
                                        <div className="flex items-center gap-1 text-slate-500 text-[10px] font-bold uppercase tracking-wider mt-1.5">
                                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                            <span className="truncate">{prop.location_city || prop.city} {prop.location_area && `• ${prop.location_area}`}</span>
                                        </div>

                                        <div className="grid grid-cols-3 gap-1 my-3">
                                            <div className="p-2 bg-slate-50 rounded-lg text-center">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase block">Camere</span>
                                                <span className="text-xs font-black text-slate-900">{prop.rooms || '-'}</span>
                                            </div>
                                            <div className="p-2 bg-slate-50 rounded-lg text-center">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase block">Suprafață</span>
                                                <span className="text-xs font-black text-slate-900">{prop.area_usable ? `${prop.area_usable} m²` : '-'}</span>
                                            </div>
                                            <div className="p-2 bg-slate-50 rounded-lg text-center">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase block">Preț</span>
                                                <span className="text-xs font-black text-orange-600">€{prop.price?.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons per Tab */}
                                    <div className="space-y-2 pt-2 border-t border-slate-100">
                                        <div className="flex items-center justify-between gap-2">
                                            <Link
                                                href={`/properties/${prop.id}`}
                                                target="_blank"
                                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1"
                                            >
                                                Detalii <ArrowUpRight className="w-3.5 h-3.5" />
                                            </Link>

                                            {/* Calendar Button (for De Sunat, De Resunat, De Vizionat, Programate) */}
                                            {currentTabObj.hasCalendar && (
                                                <button
                                                    onClick={() => handleOpenCalendarModal(prop, activeTab === 'to_call' ? 'De Sunat' : activeTab === 'to_recall' ? 'De Resunat' : 'De Vizionat')}
                                                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-sm cursor-pointer"
                                                >
                                                    <CalendarDays className="w-3.5 h-3.5" /> Calendar
                                                </button>
                                            )}

                                            {/* Flag Button (for De Vizionat & Programate) */}
                                            {currentTabObj.hasFlag && matchRecord && (
                                                <button
                                                    onClick={() => handleToggleWantToSeeAgain(matchRecord.id, isWantSeeAgain)}
                                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors ${
                                                        isWantSeeAgain
                                                            ? 'bg-purple-600 text-white'
                                                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                                                    }`}
                                                    title="Marchează dacă mai dorești o vizionare suplimentară"
                                                >
                                                    <Flag className="w-3.5 h-3.5" /> {isWantSeeAgain ? 'Bifat' : 'Mai vreau o dată'}
                                                </button>
                                            )}
                                        </div>

                                        {/* Status Transition Select Dropdown */}
                                        <div className="pt-1">
                                            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Mută în Stadiul:</label>
                                            <select
                                                value={item.status || 'curate'}
                                                onChange={(e) => handleUpdateStatus(prop.id, e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-extrabold px-2.5 py-1.5 rounded-lg outline-none cursor-pointer"
                                            >
                                                {TABS.map(t => (
                                                    <option key={t.id} value={t.id} className="bg-slate-900 text-white font-bold py-1">{t.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200 shadow-sm opacity-60 space-y-2">
                        <div className="text-sm font-bold text-slate-700">Nicio proprietate în acest stadiu ({currentTabObj.name})</div>
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
        </div>
    );
}
