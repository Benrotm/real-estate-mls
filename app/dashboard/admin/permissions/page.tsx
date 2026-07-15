import { getUserProfile } from '@/app/lib/auth';
import { fetchAllPlans, fetchAllFeatures, fetchUsers } from '@/app/lib/admin';
import { redirect } from 'next/navigation';
import PermissionsClient from './PermissionsClient';

export default async function PermissionsPage() {
    const profile = await getUserProfile();

    // Secure this page: only super_admin can configure capabilities & roles matrix
    if (!profile || profile.role !== 'super_admin') {
        redirect('/dashboard');
    }

    // Fetch DB records
    const [allPlans, allFeatures, allUsers] = await Promise.all([
        fetchAllPlans() || [],
        fetchAllFeatures() || [],
        fetchUsers() || []
    ]);

    return (
        <PermissionsClient 
            plans={allPlans} 
            features={allFeatures} 
            users={allUsers}
            currentUser={profile}
        />
    );
}
