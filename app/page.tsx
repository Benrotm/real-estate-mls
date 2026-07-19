import Hero from "./components/Hero";
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, Plus, BadgeCheck } from 'lucide-react';
import PropertyCard from "./components/PropertyCard";
import RoleSelector from "./components/RoleSelector";
import TrustStats from "./components/TrustStats";
import InviteLeadForm from "./invite/[agentId]/InviteLeadForm";
import { getProperties } from "./lib/actions/properties";
import { bulkCheckUserFeatureAccess, SYSTEM_FEATURES } from '@/app/lib/auth/features';

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

  // Bulk check for "Make an Offer" feature for all property owners
  const allPropertiesForOfferCheck = [...bestRatedProperties, ...recentProperties];
  const ownerIds = Array.from(new Set(allPropertiesForOfferCheck.map(p => p.owner_id).filter(Boolean)));
  const makeOfferAccessMap = await bulkCheckUserFeatureAccess(ownerIds, SYSTEM_FEATURES.MAKE_AN_OFFER);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">

      {/* Hero Section */}
      <Hero />

      {/* Role Selection - Quick Action */}
      {/* Role Selection - Quick Action */}

      {/* Premium Listings Section */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-end mb-12">
          <div>
            <div className="flex items-center gap-2 text-secondary font-bold uppercase tracking-wider text-sm mb-2 bg-orange-100 w-fit px-3 py-1 rounded-full text-orange-700">
              <BadgeCheck className="w-4 h-4" />
              Best Price Property Listings
            </div>
          </div>
          <Link href="/properties" className="hidden md:flex items-center gap-2 text-orange-600 font-bold hover:text-orange-700 transition-colors">
            View All <ArrowRight className="w-5 h-5" />
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
        <div className="flex justify-between items-center mb-10">
          <div>
            <div className="text-secondary font-bold uppercase tracking-wider text-sm mb-2 bg-blue-100 w-fit px-3 py-1 rounded-full text-blue-700">Just Added</div>

          </div>
          <Link href="/properties" className="text-sm font-semibold text-slate-500 hover:text-primary">
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
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6">Ready to sell Your Property?</h2>
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
        </div>
      </section>

      {/* Quick Property Finder Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-100 border-t border-slate-200">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Explanation Text */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-750 rounded-full text-xs font-extrabold uppercase tracking-wider">
              <span>Quick Match</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
              No time to search? Let us find the perfect match for you!
            </h2>
            <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
              If you are busy or can't find properties matching your requirements, simply submit your preferences here. Our team will analyze your request and send matching properties directly to your WhatsApp or email!
            </p>
            <div className="space-y-4 pt-4">
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

      {/* Trust Stats Section */}
      < TrustStats />
    </div >
  );
}
