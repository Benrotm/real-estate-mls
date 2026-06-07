'use server';

import { createClient } from '../supabase/server';
import { createAdminClient } from '../supabase/admin';

export async function getUserCredits() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const { data, error } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single();
        
    if (error) return { error: error.message };
    return { credits: data.credits as number };
}

export async function deductUserCredits(amount: number, description: string = 'Consum servicii', metadata: Record<string, any> = {}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    // Get current balance and referrer
    const { data: profile, error: readError } = await supabase
        .from('profiles')
        .select('credits, referred_by, full_name')
        .eq('id', user.id)
        .single();
        
    if (readError) return { error: readError.message };
    
    const currentCredits = profile.credits || 0;
    if (currentCredits < amount) {
        return { error: 'Fonduri insuficiente', insufficient: true };
    }

    const newBalance = currentCredits - amount;
    
    // Update balance
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ credits: newBalance })
        .eq('id', user.id);

    if (updateError) return { error: updateError.message };

    // Create transaction log for deduction (using admin client to bypass RLS restrictions)
    const supabaseAdmin = createAdminClient();
    const { data: txn, error: logTxError } = await supabaseAdmin
        .from('credit_transactions')
        .insert({
            user_id: user.id,
            amount: -amount,
            description: description,
            metadata: { feature_cost: amount, ...metadata }
        })
        .select()
        .single();

    if (logTxError) {
        console.error('Error inserting credit transaction log:', logTxError);
        // Rollback balance update
        await supabase
            .from('profiles')
            .update({ credits: currentCredits })
            .eq('id', user.id);
        return { error: 'Failed to record transaction log: ' + logTxError.message };
    }

    // Check for referral commission
    if (profile.referred_by && amount > 0) {
        const referrerId = profile.referred_by;

        // Fetch referral settings
        const { data: settingsData } = await supabase
            .from('platform_settings')
            .select('setting_value')
            .eq('setting_key', 'referral_settings')
            .single();

        const settings = (settingsData?.setting_value as any) || { commission_percentage: 10 };
        const commissionPercentage = Number(settings.commission_percentage) || 0;

        if (commissionPercentage > 0) {
            const commission = Math.floor(amount * (commissionPercentage / 100));

            if (commission > 0) {
                // Fetch referrer's current balance
                const { data: referrerProfile } = await supabase
                    .from('profiles')
                    .select('credits')
                    .eq('id', referrerId)
                    .single();

                if (referrerProfile) {
                    const referrerNewBalance = (referrerProfile.credits || 0) + commission;

                    // Update referrer's credits
                    await supabase
                        .from('profiles')
                        .update({ credits: referrerNewBalance })
                        .eq('id', referrerId);

                    // Log commission transaction
                    const inviteeName = profile.full_name || 'Prieten invitat';
                    await supabaseAdmin
                        .from('credit_transactions')
                        .insert({
                            user_id: referrerId,
                            amount: commission,
                            description: `Comision consum ${inviteeName}`,
                            metadata: {
                                invitee_id: user.id,
                                invitee_name: inviteeName,
                                commission_percentage: commissionPercentage,
                                source_transaction_id: txn?.id
                            }
                        });
                }
            }
        }
    }

    return { success: true, remaining: newBalance };
}

export async function grantUserCredits(userId: string, amount: number) {
    const supabase = await createClient();
    
    // Verify admin calling the function
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };
    
    const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!adminProfile || (adminProfile.role !== 'admin' && adminProfile.role !== 'super_admin')) {
        return { error: 'Insufficient permissions' };
    }

    // Get user's current
    const { data: profile, error: readError } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();
        
    if (readError) return { error: readError.message };

    const newBalance = (profile.credits || 0) + amount;

    const { error: updateError } = await supabase
        .from('profiles')
        .update({ credits: newBalance })
        .eq('id', userId);

    if (updateError) return { error: updateError.message };

    // Log transaction
    await supabase
        .from('credit_transactions')
        .insert({
            user_id: userId,
            amount: amount,
            description: 'Credite acordate de admin',
            metadata: { approved_by: user.id }
        });

    return { success: true, newBalance };
}

export async function updateSystemFeatureDeduction(featureId: string) {
    // Utility for generic features wanting to pull out their cost dynamically and consume it.
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    // Fetch the specific cost of this feature from settings
    const { data: costData } = await supabase
        .from('platform_settings')
        .select('setting_value')
        .eq('setting_key', 'feature_costs')
        .single();
    
    const costsMap = (costData?.setting_value as Record<string, number>) || {};
    const cost = costsMap[featureId] || 0; // Default to 0 if not set

    if (cost === 0) return { success: true, deducted: 0, error: undefined };

    return await deductUserCredits(cost, `Consum feature: ${featureId}`);
}

export async function getUserCreditTransactions() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

    if (error) return { error: error.message };
    return { transactions: data || [] };
}

export async function checkValuationUnlock(propertyId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { unlocked: false, loggedIn: false };

    // 1. Check if user is owner/admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    const { data: property } = await supabase
        .from('properties')
        .select('owner_id')
        .eq('id', propertyId)
        .single();

    const isOwner = property?.owner_id === user.id;
    const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'superadmin';

    if (isOwner || isAdmin) {
        return { unlocked: true, loggedIn: true, bypass: true };
    }

    // 2. Check if a transaction exists
    const { data: txn, error } = await supabase
        .from('credit_transactions')
        .select('id')
        .eq('user_id', user.id)
        .contains('metadata', { property_id: propertyId, feature_key: 'valuation_reports' })
        .limit(1);

    if (error) {
        console.error('Error checking valuation unlock:', error);
        return { unlocked: false, loggedIn: true, error: error.message };
    }

    return { unlocked: txn && txn.length > 0, loggedIn: true };
}

export async function unlockValuation(propertyId: string, propertyTitle: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    // Fetch cost
    const { data: settingsData } = await supabase
        .from('platform_settings')
        .select('setting_value')
        .eq('setting_key', 'feature_costs')
        .single();

    const costsMap = (settingsData?.setting_value as Record<string, number>) || {};
    const cost = costsMap['valuation_reports'] !== undefined ? costsMap['valuation_reports'] : 1;

    if (cost === 0) {
        return { success: true, cost: 0 };
    }

    // Perform deduction
    const res = await deductUserCredits(
        cost,
        `Unlock Smart Valuation: ${propertyTitle}`,
        { property_id: propertyId, feature_key: 'valuation_reports' }
    );

    if (res.error) {
        return { error: res.error, insufficient: res.insufficient };
    }

    return { success: true, cost, remaining: res.remaining };
}


