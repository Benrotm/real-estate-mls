'use server';

import { createClient } from '../supabase/server';
import { revalidatePath } from 'next/cache';

export async function processReferral(inviteeId: string, referrerId: string) {
    const supabase = await createClient();

    // 1. Prevent double referral processing
    const { data: existingTx, error: txCheckError } = await supabase
        .from('credit_transactions')
        .select('id')
        .eq('user_id', inviteeId)
        .ilike('description', 'Bonus înregistrare%')
        .limit(1);

    if (existingTx && existingTx.length > 0) {
        console.log(`Referral already processed for invitee ${inviteeId}`);
        return { error: 'Referral already processed' };
    }

    // 2. Fetch referral settings from platform_settings
    const { data: settingsData } = await supabase
        .from('platform_settings')
        .select('setting_value')
        .eq('setting_key', 'referral_settings')
        .single();

    const settings = (settingsData?.setting_value as any) || {
        referrer_bonus: 15,
        invitee_bonus: 10,
        commission_percentage: 10
    };

    const referrerBonus = Number(settings.referrer_bonus) || 0;
    const inviteeBonus = Number(settings.invitee_bonus) || 0;

    // 3. Update Invitee Credits
    if (inviteeBonus > 0) {
        const { data: inviteeProfile } = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', inviteeId)
            .single();

        const currentInviteeCredits = inviteeProfile?.credits || 0;
        const newInviteeCredits = currentInviteeCredits + inviteeBonus;

        await supabase
            .from('profiles')
            .update({ credits: newInviteeCredits })
            .eq('id', inviteeId);

        await supabase
            .from('credit_transactions')
            .insert({
                user_id: inviteeId,
                amount: inviteeBonus,
                description: 'Bonus înregistrare (referral)',
                metadata: { referrer_id: referrerId }
            });
    }

    // 4. Update Referrer Credits
    if (referrerBonus > 0) {
        const { data: referrerProfile } = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', referrerId)
            .single();

        if (referrerProfile) {
            const currentReferrerCredits = referrerProfile.credits || 0;
            const newReferrerCredits = currentReferrerCredits + referrerBonus;

            await supabase
                .from('profiles')
                .update({ credits: newReferrerCredits })
                .eq('id', referrerId);

            await supabase
                .from('credit_transactions')
                .insert({
                    user_id: referrerId,
                    amount: referrerBonus,
                    description: 'Bonus invitare prieten (referral)',
                    metadata: { invitee_id: inviteeId }
                });
        }
    }

    return { success: true };
}

export async function getReferralStats() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    // Fetch referral settings to show user what the current rewards are
    const { data: settingsData } = await supabase
        .from('platform_settings')
        .select('setting_value')
        .eq('setting_key', 'referral_settings')
        .single();

    const settings = (settingsData?.setting_value as any) || {
        referrer_bonus: 15,
        invitee_bonus: 10,
        commission_percentage: 10
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

            // Find commissions earned by current user from this invitee
            // We filter user's credit_transactions where metadata->>'invitee_id' = invitee.id and amount > 0 (excluding initial referral bonus)
            const { data: commissionData } = await supabase
                .from('credit_transactions')
                .select('amount')
                .eq('user_id', user.id)
                .eq('metadata->>invitee_id', invitee.id)
                .ilike('description', 'Comision%');

            const commissionEarned = (commissionData || []).reduce((acc, curr) => acc + curr.amount, 0);
            totalCommissionsEarned += commissionEarned;

            processedInvitees.push({
                id: invitee.id,
                name: invitee.full_name || 'User fără nume',
                email: invitee.email || 'Fără email',
                registeredAt: invitee.created_at,
                creditsConsumed,
                commissionEarned
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
