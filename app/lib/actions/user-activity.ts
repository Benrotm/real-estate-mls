'use server';

import { createClient } from '@/app/lib/supabase/server';
import { createAdminClient } from '@/app/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function logUserActivity(payload: {
    event_type: string;
    page_path?: string;
    button_id?: string;
    description?: string;
    credits_used?: number;
    metadata?: Record<string, any>;
}) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'Unauthorized' };

        const adminSupabase = createAdminClient();
        const { error } = await adminSupabase
            .from('user_activity_logs')
            .insert({
                user_id: user.id,
                event_type: payload.event_type,
                page_path: payload.page_path || '',
                button_id: payload.button_id || '',
                description: payload.description || '',
                credits_used: payload.credits_used || 0,
                metadata: payload.metadata || {}
            });

        if (error) {
            console.error('Error logging user activity:', error);
            return { success: false, error: error.message };
        }
        return { success: true };
    } catch (err: any) {
        console.error('Failed to log user activity:', err);
        return { success: false, error: err.message };
    }
}

export async function recordUserSessionStart(ipAddress?: string, userAgent?: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false };

        const adminSupabase = createAdminClient();
        const { data, error } = await adminSupabase
            .from('user_sessions')
            .insert({
                user_id: user.id,
                login_at: new Date().toISOString(),
                last_active_at: new Date().toISOString(),
                ip_address: ipAddress || '',
                user_agent: userAgent || ''
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating user session:', error);
            return { success: false, error: error.message };
        }

        // Also log login event
        await logUserActivity({
            event_type: 'login',
            description: `Utilizatorul s-a autentificat în platformă`
        });

        return { success: true, sessionId: data?.id };
    } catch (err: any) {
        console.error('Failed session start:', err);
        return { success: false };
    }
}

export async function updateUserSessionPing(sessionId: string) {
    try {
        const adminSupabase = createAdminClient();
        await adminSupabase
            .from('user_sessions')
            .update({
                last_active_at: new Date().toISOString()
            })
            .eq('id', sessionId);

        return { success: true };
    } catch (err: any) {
        return { success: false };
    }
}

export async function getUserActivityDetails(userId: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Unauthorized' };

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
            return { error: 'Access denied' };
        }

        const adminSupabase = createAdminClient();

        // 1. Fetch user sessions
        const { data: sessions } = await adminSupabase
            .from('user_sessions')
            .select('*')
            .eq('user_id', userId)
            .order('login_at', { ascending: false })
            .limit(30);

        // 2. Fetch activity logs
        const { data: logs } = await adminSupabase
            .from('user_activity_logs')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(100);

        // 3. Fetch credit transactions
        const { data: creditTxns } = await adminSupabase
            .from('credit_transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50);

        // 4. Fetch target user profile
        const { data: userProfile } = await adminSupabase
            .from('profiles')
            .select('id, full_name, email, role, phone, credits, is_approved, created_at')
            .eq('id', userId)
            .single();

        return {
            success: true,
            userProfile,
            sessions: sessions || [],
            logs: logs || [],
            creditTxns: creditTxns || []
        };
    } catch (err: any) {
        console.error('Error fetching activity details:', err);
        return { error: err.message || 'Failed to fetch activity details' };
    }
}

export async function getAIPipelineData() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Unauthorized' };

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
            return { error: 'Access denied' };
        }

        const adminSupabase = createAdminClient();

        // 1. Fetch all users
        const { data: users, error: uErr } = await adminSupabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (uErr) {
            console.error('Error fetching users for AI Pipeline:', uErr);
            return { error: uErr.message };
        }

        // 2. Fetch leads to map source and direct owner / agent help flags
        const { data: leads } = await adminSupabase
            .from('leads')
            .select('*')
            .order('created_at', { ascending: false });

        const leadsMapByCreatedBy: Record<string, any> = {};
        const leadsMapByEmail: Record<string, any> = {};
        if (leads) {
            leads.forEach(l => {
                if (l.created_by && !leadsMapByCreatedBy[l.created_by]) leadsMapByCreatedBy[l.created_by] = l;
                if (l.email && !leadsMapByEmail[l.email.toLowerCase()]) leadsMapByEmail[l.email.toLowerCase()] = l;
            });
        }

        // 3. Fetch all property restrictions
        const { data: restrictions } = await adminSupabase
            .from('user_property_restrictions')
            .select('*');

        const restrictionsMap: Record<string, any> = {};
        if (restrictions) {
            restrictions.forEach(r => {
                restrictionsMap[r.user_id] = r;
            });
        }

        // 4. Fetch recommendation settings
        const { data: recSetting } = await adminSupabase
            .from('admin_settings')
            .select('value')
            .eq('key', 'ai_pipeline_recommendation')
            .single();

        const defaultRecText = `Intra de mai multe ori pe zi si da refresh la AI Matching pentru a vedea ce apare nou si a avea prima sansa sa fie al tau! Ce trebuie sa sti despre piata Imobiliara: La Chirii - 1) Proprietarii solicita plata chiriei in avans cand te muti in chirie si de obicei inca o luna de garantie, dar sunt si proprietari care solicita mai multe 2 sau 3 luni de garantie la apartamente de Lux sau Vile si Spatii comerciale. 2) Proprietarii vor inchiria in maxim 2 saptamani de la momentul cand scot proprietatea pe piata, deoarece sunt cereri multe si nu vor sa astepte 1 luna pana vine un client ca asta ar insemna sa piarda una de chirie. 3) Chiriile se iau pe un an si daca anunti cu 30 de zile inainte sa vrei sa pleci iti primesti garantia inapoi, dar exista si proprietari care nu returneaza chiria daca pleci mai repede de un an -aici iti recomandam sa vorbesti cu un Agent/Broker imobiliar de la Real Estate Hub deoarece te poate ajuta-.`;

        let recommendationConfig = { text: defaultRecText, points: 50 };
        if (recSetting?.value) {
            try {
                const parsed = typeof recSetting.value === 'string' ? JSON.parse(recSetting.value) : recSetting.value;
                recommendationConfig = {
                    text: parsed.text || defaultRecText,
                    points: parsed.points !== undefined ? Number(parsed.points) : 50
                };
            } catch (e) {
                recommendationConfig = { text: defaultRecText, points: 50 };
            }
        }

        // Auto-fix self-service profiles in database so they are approved (is_approved = true)
        await adminSupabase
            .from('profiles')
            .update({ is_approved: true })
            .eq('role', 'client_no_agency')
            .or('is_approved.is.null,is_approved.eq.false');

        // Re-fetch users to get updated status
        const { data: updatedUsers } = await adminSupabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        const activeUsersList = updatedUsers || users || [];

        // Filter profiles to ONLY include client role users (client & client_no_agency)
        const clientUsersOnly = activeUsersList.filter(u => u.role === 'client' || u.role === 'client_no_agency');

        // Combine user profiles with lead details & restrictions
        const usersWithDetails = clientUsersOnly.map(u => {
            const matchedLead = leadsMapByCreatedBy[u.id] || (u.email ? leadsMapByEmail[u.email.toLowerCase()] : null);
            const isSelfService = u.role === 'client_no_agency' || 
                (matchedLead?.source || '').toLowerCase().includes('invite') || 
                (matchedLead?.source || '').toLowerCase().includes('self-service') ||
                (u as any).source?.toLowerCase().includes('invite');

            const wantsAgentHelp = u.wants_agent_help !== undefined
                ? u.wants_agent_help
                : (matchedLead?.wants_agent_help !== undefined
                    ? matchedLead.wants_agent_help
                    : (matchedLead?.search_with_agent !== undefined ? matchedLead.search_with_agent : false));

            const findSelfFromOwner = u.find_self_from_owner !== undefined
                ? u.find_self_from_owner
                : (matchedLead?.find_self_from_owner !== undefined
                    ? matchedLead.find_self_from_owner
                    : (matchedLead?.search_direct_owner !== undefined ? matchedLead.search_direct_owner : true));

            const isApproved = isSelfService ? (u.is_approved !== false) : (u.is_approved ?? false);

            return {
                ...u,
                is_approved: isApproved,
                is_archived: u.is_archived === true || u.status === 'archived' || matchedLead?.is_archived === true || matchedLead?.status === 'archived',
                source: matchedLead?.source || (u as any).source || 'Direct Signup',
                find_self_from_owner: findSelfFromOwner,
                wants_agent_help: wantsAgentHelp,
                restrictions: restrictionsMap[u.id] || { allowed_types: [], allowed_transactions: [], allowed_cities: [] },
                lead_details: matchedLead || null
            };
        });

        // Identify un-accounted CRM leads (leads without a matching auth user profile)
        const crmOnlyLeads = (leads || [])
            .filter(l => {
                const hasCreatedByProfile = l.created_by && activeUsersList.some(u => u.id === l.created_by);
                const hasEmailProfile = l.email && activeUsersList.some(u => u.email && u.email.toLowerCase() === l.email.toLowerCase());
                return !hasCreatedByProfile && !hasEmailProfile;
            })
            .map(l => ({
                id: l.id,
                full_name: l.name || 'Lead CRM (Fără Cont)',
                email: l.email || '',
                phone: l.phone || '',
                role: 'crm_lead',
                is_crm_only_lead: true,
                is_approved: false,
                is_archived: l.is_archived === true || l.status === 'archived',
                source: l.source || 'Formular CRM (Invite New Lead)',
                find_self_from_owner: l.find_self_from_owner ?? l.search_direct_owner ?? false,
                wants_agent_help: l.wants_agent_help ?? l.search_with_agent ?? true,
                credits: 0,
                created_at: l.created_at,
                restrictions: { allowed_types: [], allowed_transactions: [], allowed_cities: [] },
                lead_details: l
            }));

        const allPipelineItems = [...usersWithDetails, ...crmOnlyLeads];

        return {
            success: true,
            users: allPipelineItems,
            recommendationConfig
        };
    } catch (err: any) {
        console.error('Error fetching AI Pipeline data:', err);
        return { error: err.message || 'Failed to load AI Pipeline data' };
    }
}

export async function deleteAIPipelineUserOrLead(targetId: string) {
    try {
        const { deleteUser } = await import('@/app/lib/admin');
        const res = await deleteUser(targetId);
        if (!res.success) {
            // Fallback for leads without auth profile
            const { createAdminClient } = await import('@/app/lib/supabase/admin');
            const adminSupabase = createAdminClient();
            await adminSupabase.from('leads').delete().eq('id', targetId);
            await adminSupabase.from('leads').delete().eq('created_by', targetId);
        }
        revalidatePath('/dashboard/admin/ai-pipeline');
        return { success: true };
    } catch (err: any) {
        console.error('Error deleting AI Pipeline card:', err);
        return { success: false, error: err.message || 'Failed to delete user' };
    }
}

export async function saveAIPipelineRecommendationSetting(text: string, points: number = 50) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Unauthorized' };

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
            return { error: 'Access denied' };
        }

        const adminSupabase = createAdminClient();
        const valObj = JSON.stringify({ text, points });

        const { error } = await adminSupabase
            .from('admin_settings')
            .upsert({
                key: 'ai_pipeline_recommendation',
                value: valObj,
                description: 'Setări recomandări client pentru AI Pipeline',
                updated_at: new Date().toISOString()
            }, { onConflict: 'key' });

        if (error) {
            console.error('Error saving recommendation setting:', error);
            return { error: error.message };
        }

        revalidatePath('/dashboard/admin/ai-pipeline');
        revalidatePath('/dashboard/client/ai-matching');
        return { success: true };
    } catch (err: any) {
        return { error: err.message };
    }
}

export async function saveClientCalendarEvent(payload: {
    property_id?: string;
    event_type: string;
    event_date: string;
    details?: string;
    property_title?: string;
    property_link?: string;
}) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Unauthorized' };

        const adminSupabase = createAdminClient();

        // 1. Insert into client_calendar_events if table exists or fallback
        const { data: evt, error } = await adminSupabase
            .from('client_calendar_events')
            .insert({
                user_id: user.id,
                property_id: payload.property_id || null,
                event_type: payload.event_type,
                event_date: payload.event_date,
                details: payload.details || '',
                property_title: payload.property_title || '',
                property_link: payload.property_link || ''
            })
            .select()
            .single();

        if (error && !error.message.includes('relation "client_calendar_events" does not exist')) {
            console.error('Error saving calendar event:', error);
        }

        // Also log action
        await logUserActivity({
            event_type: 'calendar_event_added',
            description: `Adăugat eveniment calendar [${payload.event_type}] pentru ${payload.property_title || 'proprietate'}`
        });

        return { success: true, event: evt };
    } catch (err: any) {
        return { error: err.message };
    }
}

export async function updateMatchWantToSeeAgainFlag(matchId: string, flagState: boolean) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Unauthorized' };

        const adminSupabase = createAdminClient();
        const { error } = await adminSupabase
            .from('lead_property_matches')
            .update({
                is_want_to_see_again: flagState,
                updated_at: new Date().toISOString()
            })
            .eq('id', matchId);

        if (error) {
            console.error('Error updating match flag:', error);
            return { error: error.message };
        }

        return { success: true };
    } catch (err: any) {
        return { error: err.message };
    }
}

export async function activateInstantAIMatching() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Unauthorized' };

        // Fetch cost setting
        const { data: costsRes } = await supabase
            .from('platform_settings')
            .select('setting_value')
            .eq('setting_key', 'feature_costs')
            .single();

        const costsMap = (costsRes?.setting_value as Record<string, number>) || {};
        const cost = costsMap['instant_ai_activation_cost'] !== undefined ? Number(costsMap['instant_ai_activation_cost']) : 5;

        // Deduct credits if cost > 0
        if (cost > 0) {
            const { deductUserCredits } = await import('@/app/lib/actions/credits');
            const deductRes = await deductUserCredits(cost, 'Activare Instantă AI Matching', { feature: 'instant_ai_activation' });
            if (deductRes.error) {
                return { error: deductRes.error, insufficient: deductRes.insufficient };
            }
        }

        // Approve user profile
        const adminSupabase = createAdminClient();
        const { error: appErr } = await adminSupabase
            .from('profiles')
            .update({ is_approved: true })
            .eq('id', user.id);

        if (appErr) {
            return { error: appErr.message };
        }

        // Fetch user profile for notification
        const { data: userProfile } = await adminSupabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', user.id)
            .single();

        // Trigger notification to all superadmin/admin users
        const { data: adminProfiles } = await adminSupabase
            .from('profiles')
            .select('id')
            .in('role', ['admin', 'super_admin', 'superadmin']);

        if (adminProfiles && adminProfiles.length > 0) {
            const displayName = userProfile?.full_name || userProfile?.email || 'Client Fără Nume';
            const notifications = adminProfiles.map(adm => ({
                user_id: adm.id,
                type: 'system',
                title: '⚡ Activare Instantă AI Matching',
                content: `Clientul ${displayName} și-a activat instant potrivirile AI contra ${cost} credite. A fost mutat automat în tabul/coloana Clienți Activi din AI Pipeline.`,
                link: '/dashboard/admin/ai-pipeline'
            }));

            await adminSupabase.from('notifications').insert(notifications);
        }

        await logUserActivity({
            event_type: 'instant_ai_activation',
            description: `Client a activat instant potrivirile AI contra ${cost} credite`
        });

        revalidatePath('/dashboard/admin/ai-pipeline');

        return { success: true, cost };
    } catch (err: any) {
        return { error: err.message };
    }
}
