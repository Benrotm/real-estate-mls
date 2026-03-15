import { getUserProfile } from '@/app/lib/auth';
import { redirect } from 'next/navigation';

export default async function ChatRedirectPage({ searchParams }: { searchParams: { id?: string } }) {
    const user = await getUserProfile();
    const conversationId = searchParams.id;

    if (!user) {
        redirect('/auth/login');
    }

    const query = conversationId ? `?id=${conversationId}` : '';
    
    // Redirect based on role
    if (user.role === 'agent') redirect(`/dashboard/agent/chat${query}`);
    if (user.role === 'owner') redirect(`/dashboard/owner/chat${query}`);
    if (user.role === 'client') redirect(`/dashboard/client/chat${query}`);
    if (user.role === 'developer') redirect(`/dashboard/developer/chat${query}`);
    if (user.role === 'super_admin' || user.role === 'admin') redirect(`/dashboard/admin/chat${query}`);

    // If no specific role path matches, try to go to the base dashboard which will handle its own redirect
    redirect(`/dashboard${query}`);
}
