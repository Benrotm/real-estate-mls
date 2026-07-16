import { getSavedSearches, deleteSavedSearch } from '@/app/lib/actions/savedSearches';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { redirect } from 'next/navigation';
import SavedSearchCard from '@/app/components/dashboard/SavedSearchCard';
import { createClient } from '@/app/lib/supabase/server';
import { createAdminClient } from '@/app/lib/supabase/admin';

export default async function SavedSearchesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/auth/login');
    }

    const { success, data: searches, error } = await getSavedSearches();

    // Find or auto-create corresponding lead using adminClient to bypass client-side RLS limitations
    let leadId = '';
    if (success && user) {
        const adminClient = createAdminClient();
        let { data: lead } = await adminClient
            .from('leads')
            .select('id')
            .eq('email', user.email)
            .limit(1)
            .maybeSingle();

        if (!lead && searches && searches.length > 0) {
            // Auto create lead for existing searches
            const { data: profile } = await adminClient
                .from('profiles')
                .select('full_name, phone')
                .eq('id', user.id)
                .single();

            const { data: admins } = await adminClient
                .from('profiles')
                .select('id')
                .in('role', ['admin', 'super_admin'])
                .limit(1);
            const adminId = admins && admins.length > 0 ? admins[0].id : user.id;

            const firstSearch = searches[0];
            const queryParams = firstSearch.query_params || {};

            const { data: newLead } = await adminClient
                .from('leads')
                .insert({
                    agent_id: adminId,
                    name: profile?.full_name || user.email?.split('@')[0] || 'Client',
                    email: user.email,
                    phone: profile?.phone || null,
                    status: 'new',
                    source: 'Saved Search',
                    preference_type: queryParams.type || null,
                    preference_listing_type: queryParams.listing_type || null,
                    preference_location_city: queryParams.location_city || null,
                    preference_location_area: queryParams.location_area || null,
                    budget_min: queryParams.minPrice ? Number(queryParams.minPrice) : null,
                    budget_max: queryParams.maxPrice ? Number(queryParams.maxPrice) : null,
                    preference_rooms_min: queryParams.rooms ? Number(queryParams.rooms) : null,
                    preference_surface_min: queryParams.area ? Number(queryParams.area) : null,
                    preference_location_polygon: queryParams.location_polygon || null,
                    preference_features: queryParams.features || []
                })
                .select('id')
                .single();
            if (newLead) {
                leadId = newLead.id;
            }
        } else if (lead) {
            leadId = lead.id;
        }
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Saved Searches</h1>
                <Link
                    href="/properties"
                    className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors flex items-center gap-2"
                >
                    <Search className="w-4 h-4" />
                    New Search
                </Link>
            </div>

            {(!searches || searches.length === 0) ? (
                <div className="bg-white p-12 text-center rounded-xl border border-dashed border-slate-300">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 mb-1">No saved searches</h3>
                    <p className="text-slate-500 mb-6">Save your favorite search filters to quickly find properties later.</p>
                    <Link
                        href="/properties"
                        className="px-6 py-2 bg-orange-500 text-white rounded-lg text-sm font-bold hover:bg-orange-600 transition-colors inline-flex items-center gap-2 shadow-md hover:shadow-lg transform active:scale-95"
                    >
                        Start Searching
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {searches.map((search) => (
                        <SavedSearchCard
                            key={search.id}
                            search={search}
                            leadId={leadId}
                            onDelete={async (id) => {
                                'use server';
                                await deleteSavedSearch(id);
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
