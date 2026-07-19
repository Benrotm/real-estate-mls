import Hero from "./components/Hero";
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, Plus, BadgeCheck, Target, TrendingUp, Users, Video, Shield } from 'lucide-react';
import PropertyCard from "./components/PropertyCard";
import RoleSelector from "./components/RoleSelector";
import TrustStats from "./components/TrustStats";
import InviteLeadForm from "./invite/[agentId]/InviteLeadForm";
import { getProperties } from "./lib/actions/properties";
import { bulkCheckUserFeatureAccess, SYSTEM_FEATURES } from '@/app/lib/auth/features';
import { fetchAllFeatures } from '@/app/lib/admin';
import { getServiceCategories } from '@/app/lib/actions/services-marketplace';
import { FileText, Calculator, Compass, Truck, Sparkles, Hammer, Palette, Armchair, ChevronRight, Briefcase } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const code = params?.code;

  if (code) {
    const codeValue = Array.isArray(code) ? code[0] : code;
    redirect(`/auth/callback?code=${codeValue}`);
  }

  // Fetch properties for different sections
  const { properties: bestRatedProperties } = await getProperties({ sort: 'score_desc', per_page: 3 });
  const { properties: recentProperties } = await getProperties({ sort: 'newest', per_page: 3 });
  
  // Fetch service categories
  const { categories: serviceCategories } = await getServiceCategories();

  // Bulk check for "Make an Offer" feature for all property owners
  const allPropertiesForOfferCheck = [...bestRatedProperties, ...recentProperties];
  const ownerIds = Array.from(new Set(allPropertiesForOfferCheck.map(p => p.owner_id).filter(Boolean)));
  const makeOfferAccessMap = await bulkCheckUserFeatureAccess(ownerIds, SYSTEM_FEATURES.MAKE_AN_OFFER);

  // Fetch plan features
  const allFeatures = await fetchAllFeatures();

  // Deduplicate and process features list for homepage section
  const uniqueFeatures = Array.from(new Set((allFeatures || []).map(f => f.feature_key)))
    .map(key => {
      const match = allFeatures.find(f => f.feature_key === key);
      return {
        key: key,
        label: match?.feature_label || key,
        desc: "Funcționalitate avansată integrată în platforma imobiliară Imobum.com."
      };
    });

  const brokerFeaturesKeys = Array.from(new Set(
    (allFeatures || [])
      .filter(f => (f.role === 'agent' || f.role === 'developer') && f.is_included)
      .map(f => f.feature_key)
  ));

  const defaultBrokerFeatures = [
    {
      key: 'leads_access',
      title: 'Leads, Matching & CRM System',
      desc: 'Identifică și conectează-te cu clienți calificați instant.',
      icon: 'Users',
      items: [
        'Matching automat între proprietățile tale și căutările active din MLS.',
        'Pipeline vizual pentru monitorizarea tranzacțiilor și stadiului lead-urilor.',
        'Distribuire inteligentă a contactelor către agenții din echipa ta.'
      ]
    },
    {
      key: 'virtual_tour',
      title: 'Virtual Tours & AI Staging Studio',
      desc: 'Oferă tururi 3D imersive și design virtual de top.',
      icon: 'Video',
      items: [
        'Tururi virtuale interactive hostate direct în platformă.',
        'Instrumente AI pentru mobilarea virtuală a spațiilor goale din browser.',
        'Atrage cu 70% mai mulți cumpărători online prin prezentări ultra-realiste.'
      ]
    },
    {
      key: 'market_insights',
      title: 'Real-time Market Insights & Valuations',
      desc: 'Accesează statistici avansate despre piața locală.',
      icon: 'TrendingUp',
      items: [
        'Rapoarte detaliate de evaluare bazate pe tranzacții reale.',
        'Date analitice despre concurență și timpii medii de tranzacționare.',
        'Alerte automate pentru modificări de preț în zonele de interes.'
      ]
    },
    {
      key: 'agency_team',
      title: 'Agency Teams & ROI Performance',
      desc: 'Gestionează-ți echipa de brokeri dintr-o consolă centralizată.',
      icon: 'Shield',
      items: [
        'Monitorizare activități zilnice și performanță individuală agenți.',
        'Analiză ROI detaliată pe campanii, proprietăți și bugete.',
        'Roluri și permisiuni personalizate pentru managementul agenției.'
      ]
    }
  ];

  const activeBrokerFeatures = defaultBrokerFeatures.filter(feat => {
    if (brokerFeaturesKeys.length > 0) {
      return brokerFeaturesKeys.includes(feat.key);
    }
    return true;
  });

  const getFeatureIcon = (iconName: string) => {
    switch (iconName) {
      case 'Users': return <Users className="w-4 h-4" />;
      case 'Video': return <Video className="w-4 h-4" />;
      case 'TrendingUp': return <TrendingUp className="w-4 h-4" />;
      case 'Shield': return <Shield className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getServiceIcon = (iconName: string, colorClass: string = 'text-orange-500') => {
    const cls = `w-5 h-5 ${colorClass}`;
    switch (iconName) {
      case 'FileText': return <FileText className={cls} />;
      case 'Calculator': return <Calculator className={cls} />;
      case 'Shield': return <Shield className={cls} />;
      case 'Compass': return <Compass className={cls} />;
      case 'TrendingUp': return <TrendingUp className={cls} />;
      case 'Truck': return <Truck className={cls} />;
      case 'Sparkles': return <Sparkles className={cls} />;
      case 'Hammer': return <Hammer className={cls} />;
      case 'Palette': return <Palette className={cls} />;
      case 'Armchair': return <Armchair className={cls} />;
      case 'Video': return <Video className={cls} />;
      case 'Users': return <Users className={cls} />;
      default: return <Target className={cls} />;
    }
  };

  const getFeatureIconComponent = (idx: number, colorClass: string) => {
    const icons = [Sparkles, Target, Shield, Compass, TrendingUp, Users, Video, BadgeCheck];
    const Icon = icons[idx % icons.length] || Sparkles;
    return <Icon className={`w-5 h-5 ${colorClass}`} />;
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">

      {/* Hero Section */}
      <Hero />

      {/* Role Selection - Quick Action */}
      {/* Role Selection - Quick Action */}

      {/* Premium Listings Section */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col items-center justify-center text-center mb-12">
          <div className="flex items-center gap-2 text-secondary font-bold uppercase tracking-wider text-sm mb-2 bg-orange-100 w-fit px-3 py-1 rounded-full text-orange-700">
            <BadgeCheck className="w-4 h-4" />
            Best Price Property Listings
          </div>
          <Link href="/properties" className="flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors uppercase tracking-wider mt-1">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {bestRatedProperties.map((property) => (
            <div key={property.id} className="h-full">
              <PropertyCard
                property={property}
              />
            </div>
          ))}
          {bestRatedProperties.length === 0 && (
            <p className="text-gray-500 col-span-3 text-center">No properties found.</p>
          )}
        </div>

        <div className="mt-12 text-center md:hidden">
          <Link href="/properties" className="inline-flex items-center gap-2 text-white bg-primary px-6 py-3 rounded-lg font-bold">
            View All Properties <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Recent Properties Section (Another Row) */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full border-t border-gray-200">
        <div className="flex flex-col items-center justify-center text-center mb-10">
          <div className="text-secondary font-bold uppercase tracking-wider text-sm mb-2 bg-blue-100 w-fit px-3 py-1 rounded-full text-blue-700">Just Added</div>
          <Link href="/properties" className="text-xs font-bold text-slate-500 hover:text-primary uppercase tracking-wider mt-1">
            View All
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {recentProperties.slice(0, 3).map((property) => (
            <div key={`recent-${property.id}`} className="h-full">
              <PropertyCard
                property={property}
              />
            </div>
          ))}
          {recentProperties.length === 0 && (
            <p className="text-gray-500 col-span-3 text-center">No recent properties found.</p>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-orange-500 to-orange-600 py-24 text-white relative overflow-hidden">
        {/* Abstract shapes */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3"></div>

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to sell Your Property?</h2>
          <p className="text-xl text-orange-100 mb-10 max-w-2xl mx-auto">
            Join thousands of property owners, clients and agents on the Imobum.com Real Estate Platform. Get maximum experience with virtual tours or direct contact, AI tools, targeted marketing, market insights, Automatic Price Evaluation feature and professional dashboards with chat between the platform users.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/properties" className="bg-orange-800/30 backdrop-blur border border-white/30 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-orange-800/50 transition-all flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create Free Listing
            </Link>
            <Link href="/properties" className="bg-white text-orange-600 px-8 py-4 rounded-xl font-bold text-lg hover:shadow-xl hover:scale-105 transition-all">
              Free Property Price Evaluation
            </Link>
          </div>

          <div className="mt-8 pt-4 flex flex-col items-center gap-2">
            <p className="text-xs text-orange-100 font-semibold uppercase tracking-wider">Daca vrei sa lucrezi cu un profesionist</p>
            <Link 
              href="/calculator-comisioane"
              className="px-6 py-3 bg-white text-orange-600 font-bold rounded-xl shadow-lg transition-all text-xs uppercase tracking-wider hover:bg-slate-50 transform hover:-translate-y-0.5 active:scale-95"
            >
              Calculator Servicii &amp; Comisioane
            </Link>
          </div>
        </div>
      </section>

      {/* Brokers, Agencies & Developers Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="bg-gradient-to-br from-violet-800 via-purple-800 to-indigo-950 border border-purple-500/20 text-white rounded-3xl p-8 lg:p-12 shadow-2xl relative overflow-hidden transition-all duration-300 hover:shadow-indigo-500/20 hover:-translate-y-0.5 group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="space-y-3 text-center flex flex-col items-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white border border-white/30 uppercase tracking-widest">
                <Target className="w-3.5 h-3.5 text-white" />
                For Real Estate Brokers, Agency and Developers
              </span>
              <h3 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight text-white max-w-3xl mx-auto">
                Optimizează-ți afacerea imobiliară cu cel mai avansat sistem MLS &amp; AI!
              </h3>
              <p className="text-indigo-100 text-sm font-semibold leading-relaxed max-w-2xl mx-auto">
                Colaborează, accesează lead-uri calificate, generează tururi virtuale și utilizează instrumentele noastre premium dedicate brokerilor și dezvoltatorilor.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 text-left">
              {activeBrokerFeatures.map((feat) => (
                <div key={feat.key} className="bg-white/10 backdrop-blur-md border border-white/10 p-5 rounded-2xl space-y-2 hover:bg-white/15 transition-colors">
                  <span className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white mb-2">
                    {getFeatureIcon(feat.icon)}
                  </span>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">{feat.title}</h4>
                  <div className="text-xs text-indigo-50/90 leading-relaxed font-medium">
                    {feat.desc}
                    {feat.items.map((item, idx) => (
                      <span key={idx} className="block mt-1.5 pl-3 relative before:content-['+'] before:absolute before:left-0 before:text-indigo-300 font-normal">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Actions Container */}
            <div className="pt-4 flex items-center justify-center w-full">
              <div className="flex flex-col items-center gap-2 text-center w-full lg:w-auto">
                <p className="text-xs text-indigo-200 font-semibold">Alătură-te celei mai avansate platforme MLS</p>
                <Link 
                  href="/auth/signup"
                  className="w-full lg:w-auto px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-xl shadow-lg transition-all text-center text-sm uppercase tracking-wider transform hover:-translate-y-0.5"
                >
                  Creează Cont de Broker / Dezvoltator
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Quick Property Finder Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-100 border-t border-slate-200">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Explanation Text */}
          <div className="lg:col-span-5 space-y-6 flex flex-col items-center text-center justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-750 rounded-full text-xs font-extrabold uppercase tracking-wider">
              <span>Quick Match</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">
              No time to search? Let us find the perfect match for you!
            </h2>
            <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
              If you are busy or can't find properties matching your requirements, simply submit your preferences here. Our team will analyze your request and send matching properties directly to your WhatsApp or email!
            </p>
            <div className="space-y-4 pt-4 text-left w-full max-w-md">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-orange-500 text-white rounded-lg shrink-0 shadow-lg shadow-orange-500/10">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.39-4.836c1.674.993 3.348 1.517 5.561 1.518 5.485 0 9.948-4.468 9.95-9.956.002-2.659-1.03-5.158-2.906-7.036C17.177 1.813 14.67 .78 12.005.78c-5.49 0-9.954 4.469-9.956 9.958-.001 2.032.536 4.02 1.55 5.768L2.57 20.3l3.877-1.136z"/>
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">WhatsApp Alerts</h4>
                  <p className="text-sm text-slate-500">Receive customized property matching links straight to your chat.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-orange-500 text-white rounded-lg shrink-0 shadow-lg shadow-orange-500/10">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">Save Search Time</h4>
                  <p className="text-sm text-slate-500">Skip browsing hundreds of listings; let our systems filter them for you.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Invite Form Container */}
          <div className="lg:col-span-7 bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200/60">
            {/* Form Header */}
            <div className="bg-gradient-to-r from-orange-500 to-rose-500 p-6 sm:p-8 text-white text-center space-y-2">
              <h3 className="text-lg sm:text-xl font-bold tracking-tight">
                Let me know what property you are looking for so I can find the perfect match!
              </h3>
              <p className="text-xs sm:text-sm text-orange-100 font-medium">
                You will receive back a link with all properties matching your needs.
              </p>
            </div>
            
            <div className="p-6 sm:p-8 bg-white">
              <InviteLeadForm agentId="430ed9f0-3164-4346-a7e3-8124f35b5053" />
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Services Preview Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="bg-gradient-to-br from-emerald-800 via-teal-800 to-cyan-950 border border-emerald-500/20 text-white rounded-3xl p-8 lg:p-12 shadow-2xl relative overflow-hidden transition-all duration-300 hover:shadow-emerald-500/10 hover:-translate-y-0.5 group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-8">
            <div className="space-y-3 text-left">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white border border-white/30 uppercase tracking-widest">
                <Briefcase className="w-3.5 h-3.5 text-white" />
                Real Estate HUB Services
              </span>
              <h3 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight text-white">
                Servicii Imobiliare Premium
              </h3>
              <p className="text-emerald-100 text-sm font-semibold leading-relaxed">
                Tot ce ai nevoie pentru a cumpăra, vinde sau administra o proprietate în mod eficient. Colaborează cu experți verificați din domeniu.
              </p>
            </div>

            <div className="flex flex-row overflow-x-auto gap-6 pt-2 pb-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent snap-x snap-mandatory">
              {serviceCategories && serviceCategories.map((cat: any, idx: number) => {
                const PALETTES = [
                  {
                    hoverBorder: 'hover:border-emerald-400/50',
                    iconText: 'text-emerald-400',
                    hoverIconBg: 'group-hover:bg-emerald-500',
                    titleText: 'group-hover:text-emerald-400',
                    linkText: 'text-emerald-400'
                  },
                  {
                    hoverBorder: 'hover:border-orange-400/50',
                    iconText: 'text-orange-400',
                    hoverIconBg: 'group-hover:bg-orange-500',
                    titleText: 'group-hover:text-orange-400',
                    linkText: 'text-orange-400'
                  },
                  {
                    hoverBorder: 'hover:border-cyan-400/50',
                    iconText: 'text-cyan-400',
                    hoverIconBg: 'group-hover:bg-cyan-500',
                    titleText: 'group-hover:text-cyan-400',
                    linkText: 'text-cyan-400'
                  },
                  {
                    hoverBorder: 'hover:border-amber-400/50',
                    iconText: 'text-amber-400',
                    hoverIconBg: 'group-hover:bg-amber-500',
                    titleText: 'group-hover:text-amber-400',
                    linkText: 'text-amber-400'
                  },
                  {
                    hoverBorder: 'hover:border-pink-400/50',
                    iconText: 'text-pink-400',
                    hoverIconBg: 'group-hover:bg-pink-500',
                    titleText: 'group-hover:text-pink-400',
                    linkText: 'text-pink-400'
                  },
                  {
                    hoverBorder: 'hover:border-sky-400/50',
                    iconText: 'text-sky-400',
                    hoverIconBg: 'group-hover:bg-sky-500',
                    titleText: 'group-hover:text-sky-400',
                    linkText: 'text-sky-400'
                  },
                  {
                    hoverBorder: 'hover:border-teal-400/50',
                    iconText: 'text-teal-400',
                    hoverIconBg: 'group-hover:bg-teal-500',
                    titleText: 'group-hover:text-teal-400',
                    linkText: 'text-teal-400'
                  },
                  {
                    hoverBorder: 'hover:border-rose-400/50',
                    iconText: 'text-rose-400',
                    hoverIconBg: 'group-hover:bg-rose-500',
                    titleText: 'group-hover:text-rose-400',
                    linkText: 'text-rose-400'
                  }
                ];
                const palette = PALETTES[idx % PALETTES.length];
                return (
                  <Link
                    key={cat.slug}
                    href={`/services?category=${cat.slug}`}
                    className={`group bg-white/5 hover:bg-white/10 rounded-2xl p-6 border border-white/10 ${palette.hoverBorder} transition-all duration-300 flex flex-col justify-between items-start text-left text-white shadow-lg w-[280px] sm:w-[320px] shrink-0 snap-start`}
                  >
                    <div className="space-y-4">
                      <span className={`w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center transition-colors ${palette.hoverIconBg}`}>
                        {getServiceIcon(cat.icon, palette.iconText)}
                      </span>
                      <h4 className={`text-sm font-bold text-white transition-colors ${palette.titleText}`}>
                        {cat.title}
                      </h4>
                      <p className="text-slate-300 text-xs leading-relaxed line-clamp-2">
                        {cat.description || 'Găsește specialiști parteneri verificați pentru acest serviciu.'}
                      </p>
                    </div>
                    <div className={`flex items-center text-xs font-bold mt-6 group-hover:gap-1.5 transition-all ${palette.linkText}`}>
                      Vezi Oferte <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-4 w-full">
              <Link
                href="/services"
                className="w-full sm:w-auto px-6 py-3.5 bg-white/5 hover:bg-white/10 border border-white/20 text-white font-bold rounded-xl text-center text-xs uppercase tracking-wider transition-all"
              >
                Explorează Toate Serviciile
              </Link>
              <Link
                href="/services/register"
                className="w-full sm:w-auto px-6 py-3.5 bg-white text-emerald-700 font-bold rounded-xl text-center text-xs uppercase tracking-wider transition-all shadow-lg hover:bg-slate-50 transform hover:-translate-y-0.5"
              >
                Înregistrează-te ca Furnizor (Devino Partener)
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Features Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="bg-gradient-to-br from-violet-800 via-purple-800 to-indigo-950 border border-purple-500/20 text-white rounded-3xl p-8 lg:p-12 shadow-2xl relative overflow-hidden transition-all duration-300 hover:shadow-indigo-500/10 hover:-translate-y-0.5 group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-8">
            <div className="space-y-3 text-left">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white border border-white/30 uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5 text-white" />
                Real Estate HUB Features
              </span>
              <h3 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight text-white">
                Platform Features &amp; System Capabilities
              </h3>
              <p className="text-indigo-100 text-sm font-semibold leading-relaxed">
                Descoperă tool-urile și instrumentele disponibile utilizatorilor platformei noastre.
              </p>
            </div>

            <div className="flex flex-row overflow-x-auto gap-6 pt-2 pb-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent snap-x snap-mandatory">
              {uniqueFeatures.map((feat, idx) => {
                const PALETTES = [
                  {
                    hoverBorder: 'hover:border-violet-400/50',
                    iconText: 'text-violet-400',
                    hoverIconBg: 'group-hover:bg-violet-500',
                    titleText: 'group-hover:text-violet-400'
                  },
                  {
                    hoverBorder: 'hover:border-indigo-400/50',
                    iconText: 'text-indigo-400',
                    hoverIconBg: 'group-hover:bg-indigo-500',
                    titleText: 'group-hover:text-indigo-400'
                  },
                  {
                    hoverBorder: 'hover:border-purple-400/50',
                    iconText: 'text-purple-400',
                    hoverIconBg: 'group-hover:bg-purple-500',
                    titleText: 'group-hover:text-purple-400'
                  },
                  {
                    hoverBorder: 'hover:border-fuchsia-400/50',
                    iconText: 'text-fuchsia-400',
                    hoverIconBg: 'group-hover:bg-fuchsia-500',
                    titleText: 'group-hover:text-fuchsia-400'
                  },
                  {
                    hoverBorder: 'hover:border-sky-400/50',
                    iconText: 'text-sky-400',
                    hoverIconBg: 'group-hover:bg-sky-500',
                    titleText: 'group-hover:text-sky-400'
                  },
                  {
                    hoverBorder: 'hover:border-blue-400/50',
                    iconText: 'text-blue-400',
                    hoverIconBg: 'group-hover:bg-blue-500',
                    titleText: 'group-hover:text-blue-400'
                  },
                  {
                    hoverBorder: 'hover:border-pink-400/50',
                    iconText: 'text-pink-400',
                    hoverIconBg: 'group-hover:bg-pink-500',
                    titleText: 'group-hover:text-pink-400'
                  },
                  {
                    hoverBorder: 'hover:border-cyan-400/50',
                    iconText: 'text-cyan-400',
                    hoverIconBg: 'group-hover:bg-cyan-500',
                    titleText: 'group-hover:text-cyan-400'
                  }
                ];
                const palette = PALETTES[idx % PALETTES.length];
                return (
                  <div
                    key={feat.key}
                    className={`group bg-white/5 hover:bg-white/10 rounded-2xl p-6 border border-white/10 ${palette.hoverBorder} transition-all duration-300 flex flex-col justify-between items-start text-left text-white shadow-lg w-[280px] sm:w-[320px] shrink-0 snap-start`}
                  >
                    <div className="space-y-4 w-full">
                      <span className={`w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center transition-colors ${palette.hoverIconBg}`}>
                        {getFeatureIconComponent(idx, palette.iconText)}
                      </span>
                      <h4 className={`text-sm font-bold text-white transition-colors ${palette.titleText}`}>
                        {feat.label}
                      </h4>
                      <p className="text-slate-300 text-xs leading-relaxed line-clamp-2">
                        {feat.desc}
                      </p>
                    </div>
                    <span className="inline-flex items-center text-[10px] uppercase font-bold text-white/50 border border-white/10 px-2.5 py-0.5 rounded-full mt-6">
                      Sistem Activ
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Trust Stats Section */}
      <TrustStats />
    </div>
  );
}
