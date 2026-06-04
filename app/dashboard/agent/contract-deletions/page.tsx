import { getUserProfile } from '@/app/lib/auth';
import { redirect } from 'next/navigation';
import DeletionRequestsClient from '../../admin/contract-deletions/DeletionRequestsClient';

export default async function AgentContractDeletionsPage() {
    const profile = await getUserProfile();
    
    // Team Leader is modeled as an agent whose profile plan_tier is 'enterprise' (Agency Manager)
    const isTeamLeader = profile?.role === 'agent' && profile?.plan_tier === 'enterprise';
    
    if (!profile || (!isTeamLeader && profile.role !== 'super_admin' && profile.role !== 'admin')) {
        redirect('/dashboard'); // Redirect unauthorized users
    }
    
    return <DeletionRequestsClient isAdmin={false} />;
}
