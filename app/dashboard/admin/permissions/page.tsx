import { getUserProfile } from '@/app/lib/auth';
import { fetchAllPlans, fetchAllFeatures, fetchUsers } from '@/app/lib/admin';
import { redirect } from 'next/navigation';
import PermissionsClient from './PermissionsClient';
import { createClient } from '@/app/lib/supabase/server';

export default async function PermissionsPage() {
    const profile = await getUserProfile();

    // Secure this page: only super_admin can configure capabilities & roles matrix
    if (!profile || profile.role !== 'super_admin') {
        redirect('/dashboard');
    }

    const supabase = await createClient();

    // Fetch DB records
    const [allPlans, allFeatures, allUsers, cityRes, restrictionsRes] = await Promise.all([
        fetchAllPlans() || [],
        fetchAllFeatures() || [],
        fetchUsers() || [],
        supabase
            .from('properties')
            .select('location_city')
            .not('location_city', 'is', null)
            .neq('location_city', ''),
        supabase
            .from('user_property_restrictions')
            .select('*')
    ]);

    const cities = Array.from(new Set(cityRes.data?.map((c: any) => c.location_city) || []))
        .filter(Boolean)
        .sort((a: any, b: any) => a.localeCompare(b));

    return (
        <PermissionsClient 
            plans={allPlans} 
            features={allFeatures} 
            users={allUsers}
            currentUser={profile}
            cities={cities}
            initialRestrictions={restrictionsRes.data || []}
        />
    );
}
