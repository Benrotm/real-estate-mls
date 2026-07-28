'use server';

import { createClient } from '../supabase/server';
import { createAdminClient } from '../supabase/admin';
import { revalidatePath } from 'next/cache';

export async function processReferral(inviteeId: string, referrerId: string) {
    const supabaseAdmin = createAdminClient();

    // 1. Prevent double referral processing
    const { data: existingTx, error: txCheckError } = await supabaseAdmin
        .from('credit_transactions')
        .select('id')
        .eq('user_id', inviteeId)
        .or('description.ilike.Bonus înregistrare%,description.ilike.Bonus invitare%')
        .limit(1);

    if (existingTx && existingTx.length > 0) {
        console.log(`Referral already processed for invitee ${inviteeId}`);
        return { error: 'Referral already processed' };
    }

    // 2. Fetch referral settings from platform_settings or admin_settings
    let referrerBonus = 15;
    let inviteeBonus = 15;

    try {
        const { data: creditConfig } = await supabaseAdmin
            .from('admin_settings')
            .select('value')
            .eq('key', 'credit_costs_config')
            .single();

        if (creditConfig?.value) {
            const parsed = typeof creditConfig.value === 'string' ? JSON.parse(creditConfig.value) : creditConfig.value;
            if (parsed.referral_gift_credits_per_friend !== undefined) referrerBonus = Number(parsed.referral_gift_credits_per_friend);
            if (parsed.client_no_agency_initial_credits !== undefined) inviteeBonus = Number(parsed.client_no_agency_initial_credits);
        }
    } catch (e) {
        console.error("Error reading credit_costs_config in processReferral:", e);
    }

    // 3. Check if invitee profile exists and already has initial credits
    const { data: inviteeProfile } = await supabaseAdmin
        .from('profiles')
        .select('credits')
        .eq('id', inviteeId)
        .single();

    // 4. Update Invitee Credits ONLY if they have not received initial registration credits
    const currentInviteeCredits = inviteeProfile?.credits || 0;
    if (inviteeBonus > 0 && currentInviteeCredits === 0) {
        const newInviteeCredits = currentInviteeCredits + inviteeBonus;

        await supabaseAdmin
            .from('profiles')
            .update({ credits: newInviteeCredits })
            .eq('id', inviteeId);

        await supabaseAdmin
            .from('credit_transactions')
            .insert({
                user_id: inviteeId,
                amount: inviteeBonus,
                description: 'Bonus înregistrare (referral)',
                metadata: { referrer_id: referrerId }
            });
    }

    // 5. Update Referrer Credits
    if (referrerBonus > 0 && referrerId) {
        const { data: referrerProfile } = await supabaseAdmin
            .from('profiles')
            .select('credits')
            .eq('id', referrerId)
            .single();

        if (referrerProfile) {
            const currentReferrerCredits = referrerProfile.credits || 0;
            const newReferrerCredits = currentReferrerCredits + referrerBonus;

            await supabaseAdmin
                .from('profiles')
                .update({ credits: newReferrerCredits })
                .eq('id', referrerId);

            await supabaseAdmin
                .from('credit_transactions')
                .insert({
                    user_id: referrerId,
                    amount: referrerBonus,
                    description: 'Bonus invitare prieten (referral)',
                    metadata: { invitee_id: inviteeId }
                });
        }
    }

    revalidatePath('/dashboard/client/ai-matching');
    revalidatePath('/cont/plati');
    revalidatePath('/cont/profil');
    revalidatePath('/dashboard');

    return { success: true };
}

export async function getReferralStats() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    // Fetch referral settings from admin_settings
    let referrerBonus = 15;
    let inviteeBonus = 15;
    let commissionPercentage = 15;

    try {
        const { data: creditConfig } = await supabase
            .from('admin_settings')
            .select('value')
            .eq('key', 'credit_costs_config')
            .single();

        if (creditConfig?.value) {
            const parsed = typeof creditConfig.value === 'string' ? JSON.parse(creditConfig.value) : creditConfig.value;
            if (parsed.referral_gift_credits_per_friend !== undefined) referrerBonus = Number(parsed.referral_gift_credits_per_friend);
            if (parsed.client_no_agency_initial_credits !== undefined) inviteeBonus = Number(parsed.client_no_agency_initial_credits);
            if (parsed.referral_client_no_agency_commission_percentage !== undefined) commissionPercentage = Number(parsed.referral_client_no_agency_commission_percentage);
        }
    } catch (e) {
        console.error("Error reading credit_costs_config:", e);
    }

    const settings = {
        referrer_bonus: referrerBonus,
        invitee_bonus: inviteeBonus,
        commission_percentage: commissionPercentage
    };

    // Get all invitees who registered using this user's link
    let invitees: any[] = [];
    try {
        const { data, error: inviteesError } = await supabase
            .from('profiles')
            .select('id, full_name, email, created_at')
            .eq('referred_by', user.id);

        if (inviteesError) {
            console.error('Error fetching invitees in getReferralStats:', inviteesError);
        } else {
            invitees = data || [];
        }
    } catch (e) {
        console.error('Exception fetching invitees in getReferralStats:', e);
    }

    // Process stats for each invitee
    const processedInvitees = [];
    let totalCommissionsEarned = 0;

    try {
        for (const invitee of invitees) {
            // Find credits consumed by this invitee (sum of negative amounts in transactions)
            const { data: consumedData } = await supabase
                .from('credit_transactions')
                .select('amount')
                .eq('user_id', invitee.id)
                .lt('amount', 0);

            const creditsConsumed = (consumedData || []).reduce((acc, curr) => acc + Math.abs(curr.amount), 0);

            // Find all referral bonuses and commissions earned by current user from this invitee
            const { data: earnedData } = await supabase
                .from('credit_transactions')
                .select('amount')
                .eq('user_id', user.id)
                .eq('metadata->>invitee_id', invitee.id)
                .gt('amount', 0);

            const totalEarnedFromInvitee = (earnedData || []).reduce((acc, curr) => acc + curr.amount, 0);
            
            // Fallback for invitees where metadata wasn't set: attribute initial referrerBonus
            const finalEarnedFromInvitee = totalEarnedFromInvitee > 0 ? totalEarnedFromInvitee : referrerBonus;

            totalCommissionsEarned += finalEarnedFromInvitee;

            processedInvitees.push({
                id: invitee.id,
                name: invitee.full_name || 'User fără nume',
                email: invitee.email || 'Fără email',
                registeredAt: invitee.created_at,
                creditsConsumed,
                commissionEarned: finalEarnedFromInvitee
            });
        }
    } catch (e) {
        console.error('Error processing invitee stats in getReferralStats:', e);
    }

    // Generate referral link
    const referralLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.imobum.com'}/auth/signup?ref=${user.id}`;

    return {
        referralLink,
        invitees: processedInvitees,
        totalCommissionsEarned,
        settings,
        userId: user.id
    };
}

export async function checkAndProcessReferral() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, referred_by')
        .eq('id', user.id)
        .single();

    if (error || !profile) return { error: error?.message || 'Profile not found' };

    if (profile.referred_by) {
        return await processReferral(profile.id, profile.referred_by);
    }

    return { success: true, message: 'No referral to process' };
}
