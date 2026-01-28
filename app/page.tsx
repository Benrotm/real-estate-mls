import Hero from "./components/Hero";
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, Plus, BadgeCheck } from 'lucide-react';
import PropertyCard from "./components/PropertyCard";
import RoleSelector from "./components/RoleSelector";
import TrustStats from "./components/TrustStats";
import { getProperties } from "./lib/actions/properties";

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

  // Fetch real properties
  const allProperties = await getProperties();

  // Filter for featured/promoted (if we had a promoted flag, otherwise just take some)
  // For now, let's say "Best Price" = cheapest or just the first few
  const featuredProperties = allProperties.slice(0, 3);

  // Recent = just the most recent ones (getProperties orders by created_at desc by default)
  const recentProperties = allProperties.slice(0, 6); // Take first 6 as recent

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
          {featuredProperties.slice(0, 3).map((property) => (
            <div key={property.id} className="h-full">
              <PropertyCard property={property} />
            </div>
          ))}
          {featuredProperties.length === 0 && (
            <p className="text-gray-500 col-span-3 text-center">No featured properties found.</p>
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
              <PropertyCard property={property} />
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
            <Link href="/dashboard/owner" className="bg-orange-800/30 backdrop-blur border border-white/30 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-orange-800/50 transition-all flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create Free Listing
            </Link>
            <Link href="/pricing" className="bg-white text-orange-600 px-8 py-4 rounded-xl font-bold text-lg hover:shadow-xl hover:scale-105 transition-all">
              Free Property Price Evaluation
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Stats Section */}
      < TrustStats />
    </div >
  );
}
