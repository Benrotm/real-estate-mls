'use server';

import { createClient } from '../supabase/server';

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

    // Create transaction log for deduction
    const { data: txn, error: logTxError } = await supabase
        .from('credit_transactions')
        .insert({
            user_id: user.id,
            amount: -amount,
            description: description,
            metadata: { feature_cost: amount, ...metadata }
        })
        .select()
        .single();

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
                    await supabase
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

