import { getUserProfile } from '@/app/lib/auth';
import { redirect } from 'next/navigation';
import DeletionRequestsClient from './DeletionRequestsClient';

export default async function AdminContractDeletionsPage() {
    const profile = await getUserProfile();
    
    // Security check - super_admin or admin roles only
    if (!profile || (profile.role !== 'super_admin' && profile.role !== 'admin')) {
        redirect('/dashboard'); // Redirect unauthorized users
    }
    
    return <DeletionRequestsClient isAdmin={true} />;
}
