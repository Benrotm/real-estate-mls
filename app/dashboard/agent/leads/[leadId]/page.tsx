import { fetchLead, fetchNotes, fetchActivities } from '@/app/lib/actions/leads';
import { getLeadMatches } from '@/app/lib/actions/matches';
import { notFound } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';
import LeadDetailsClient from './LeadDetailsClient';

export default async function LeadDetailsPage({ params }: { params: Promise<{ leadId: string }> }) {
    const { leadId } = await params;
    const lead = await fetchLead(leadId);
    const notes = (await fetchNotes(leadId)) || [];
    const activities = (await fetchActivities(leadId)) || [];
    const { matches } = (await getLeadMatches(leadId)) || { matches: [] };

    if (!lead) {
        notFound();
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let isReadOnly = true;
    if (user) {
        if (user.id === lead.agent_id) {
            isReadOnly = false;
        } else {
            const { data: viewerProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
            if (viewerProfile?.role === 'super_admin' || viewerProfile?.role === 'admin') {
                isReadOnly = false;
            } else {
                const { data: ownerProfile } = await supabase.from('profiles').select('agency_id').eq('id', lead.agent_id).single();
                if (ownerProfile?.agency_id === user.id) {
                    isReadOnly = false;
                }
            }
        }
    }

    return (
        <LeadDetailsClient
            lead={lead}
            notes={notes}
            activities={activities}
            matches={matches}
            isReadOnly={isReadOnly}
            currentUserId={user?.id}
        />
    );
}
