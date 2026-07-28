'use server';

import { createClient } from '../supabase/server';
import { createAdminClient } from '../supabase/admin';
import { revalidatePath } from 'next/cache';

export async function getUserCredits() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single();
        
    if (error) return { error: error.message };

    // Ledger Reconciliation: calculate exact sum from credit_transactions to ensure profiles.credits is ALWAYS 100% accurate!
    const { data: txs } = await supabaseAdmin
        .from('credit_transactions')
        .select('amount')
        .eq('user_id', user.id);

    if (txs && txs.length > 0) {
        const calculatedCredits = txs.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
        const actualCredits = Math.max(0, calculatedCredits);

        if (data?.credits !== actualCredits) {
            await supabaseAdmin
                .from('profiles')
                .update({ credits: actualCredits })
                .eq('id', user.id);
            return { credits: actualCredits };
        }
    }

    return { credits: (data?.credits ?? 0) as number };
}

export async function deductUserCredits(amount: number, description: string = 'Consum servicii', metadata: Record<string, any> = {}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const supabaseAdmin = createAdminClient();

    // Get current balance, referrer, role using admin client to bypass RLS
    const { data: profile, error: readError } = await supabaseAdmin
        .from('profiles')
        .select('credits, referred_by, full_name, role')
        .eq('id', user.id)
        .single();
        
    if (readError) return { error: readError.message };
    
    const currentCredits = profile.credits || 0;
    if (currentCredits < amount) {
        return { error: 'Fonduri insuficiente', insufficient: true };
    }

    const newBalance = currentCredits - amount;
    
    // Update balance using admin client to ensure database state is ALWAYS updated!
    const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ credits: newBalance })
        .eq('id', user.id);

    if (updateError) return { error: updateError.message };

    // Create transaction log for deduction
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
        await supabaseAdmin
            .from('profiles')
            .update({ credits: currentCredits })
            .eq('id', user.id);
        return { error: 'Failed to record transaction log: ' + logTxError.message };
    }

    // Check for referral commission
    if (profile.referred_by && amount > 0) {
        const referrerId = profile.referred_by;

        let commissionPercentage = 15;
        try {
            const { data: creditConfig } = await supabaseAdmin
                .from('admin_settings')
                .select('value')
                .eq('key', 'credit_costs_config')
                .single();

            if (creditConfig?.value) {
                const parsed = typeof creditConfig.value === 'string' ? JSON.parse(creditConfig.value) : creditConfig.value;
                if (parsed.referral_client_no_agency_commission_percentage !== undefined) {
                    commissionPercentage = Number(parsed.referral_client_no_agency_commission_percentage);
                }
            }
        } catch (e) {
            console.error("Error reading credit_costs_config in deductUserCredits:", e);
        }

        if (commissionPercentage > 0) {
            const rawCommission = amount * (commissionPercentage / 100);
            const commission = rawCommission >= 1 ? Math.floor(rawCommission) : Math.max(1, Math.round(rawCommission));

            if (commission > 0) {
                // Fetch referrer's current balance
                const { data: referrerProfile } = await supabaseAdmin
                    .from('profiles')
                    .select('credits')
                    .eq('id', referrerId)
                    .single();

                if (referrerProfile) {
                    const referrerNewBalance = (referrerProfile.credits || 0) + commission;

                    // Update referrer's credits
                    await supabaseAdmin
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
                            description: `Comision recomandare (${inviteeName})`,
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

    revalidatePath('/dashboard/client/ai-matching');
    revalidatePath('/cont/plati');
    revalidatePath('/cont/profil');
    revalidatePath('/dashboard');

    return { success: true, remaining: newBalance };
}

export async function grantUserCredits(userId: string, amount: number, customDescription?: string) {
    const supabase = await createClient();
    
    // Verify admin calling the function
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };
    
    const supabaseAdmin = createAdminClient();
    const { data: adminProfile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
    if (!adminProfile || (adminProfile.role !== 'admin' && adminProfile.role !== 'super_admin')) {
        return { error: 'Permisiuni insuficiente pentru a aloca credite.' };
    }

    // 1. Idempotency Guard: Block rapid duplicate requests within 10 seconds
    const tenSecondsAgo = new Date(Date.now() - 10000).toISOString();
    const { data: recentTx } = await supabaseAdmin
        .from('credit_transactions')
        .select('id')
        .eq('user_id', userId)
        .eq('amount', amount)
        .gte('created_at', tenSecondsAgo)
        .limit(1);

    if (recentTx && recentTx.length > 0) {
        console.warn(`Duplicate credit grant request blocked for user ${userId}`);
        const { data: p } = await supabaseAdmin.from('profiles').select('credits').eq('id', userId).single();
        return { success: true, newBalance: p?.credits || 0 };
    }

    // 2. Fetch existing transaction ledger sum for strict accuracy
    const { data: txs } = await supabaseAdmin
        .from('credit_transactions')
        .select('amount')
        .eq('user_id', userId);

    const existingSum = (txs || []).reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    const newBalance = Math.max(0, existingSum + amount);

    // 3. Log transaction first using admin client
    const { error: logTxError } = await supabaseAdmin
        .from('credit_transactions')
        .insert({
            user_id: userId,
            amount: amount,
            description: customDescription || (amount >= 0 ? 'Credite alocate de Admin' : 'Credite reduse de Admin'),
            metadata: { approved_by: user.id }
        });

    if (logTxError) {
        return { error: 'Eroare la înregistrarea tranzacției: ' + logTxError.message };
    }

    // 4. Update profile credits to match the exact new ledger sum
    const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ credits: newBalance })
        .eq('id', userId);

    if (updateError) return { error: updateError.message };

    revalidatePath('/dashboard/client/ai-matching');
    revalidatePath('/cont/plati');
    revalidatePath('/cont/profil');
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/admin/ai-pipeline');

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

export async function buyListingSlot() {
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
    const cost = costsMap['add_listing'] !== undefined ? costsMap['add_listing'] : 5;

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('credits, bonus_listings')
        .eq('id', user.id)
        .single();

    if (profileError || !profile) {
        return { error: 'Failed to retrieve user profile.' };
    }

    if ((profile.credits || 0) < cost) {
        return { error: 'Fonduri insuficiente', insufficient: true, cost };
    }

    // Deduct credits
    const deduction = await deductUserCredits(
        cost,
        'Cumpărare slot anunț suplimentar',
        { feature_key: 'add_listing' }
    );

    if (deduction.error) {
        return { error: deduction.error, insufficient: deduction.insufficient, cost };
    }

    // Increment bonus_listings
    const currentBonus = profile.bonus_listings || 0;
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ bonus_listings: currentBonus + 1 })
        .eq('id', user.id);

    if (updateError) {
        console.error('Error incrementing bonus listings:', updateError);
        return { error: 'Failed to update listing limit. Contact support.' };
    }

    return { success: true, newBonus: currentBonus + 1, remaining: deduction.remaining };
}

export async function buyFeaturedSlot() {
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
    const cost = costsMap['featured_listing'] !== undefined ? costsMap['featured_listing'] : 10;

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('credits, featured_limit')
        .eq('id', user.id)
        .single();

    if (profileError || !profile) {
        return { error: 'Failed to retrieve user profile.' };
    }

    if ((profile.credits || 0) < cost) {
        return { error: 'Fonduri insuficiente', insufficient: true, cost };
    }

    // Deduct credits
    const deduction = await deductUserCredits(
        cost,
        'Cumpărare slot anunț promovat (Featured)',
        { feature_key: 'featured_listing' }
    );

    if (deduction.error) {
        return { error: deduction.error, insufficient: deduction.insufficient, cost };
    }

    // Increment featured_limit
    const currentLimit = profile.featured_limit || 0;
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ featured_limit: currentLimit + 1 })
        .eq('id', user.id);

    if (updateError) {
        console.error('Error incrementing featured limit:', updateError);
        return { error: 'Failed to update featured limit. Contact support.' };
    }

    return { success: true, newLimit: currentLimit + 1, remaining: deduction.remaining };
}

export async function rewardUserCredits(userId: string, amount: number, description: string = 'Recompensă acțiune', metadata: Record<string, any> = {}) {
    const supabaseAdmin = createAdminClient();
    
    // Fetch profile to get current credits
    const { data: profile, error: readError } = await supabaseAdmin
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();
        
    if (readError) return { error: readError.message };
    
    const newBalance = (profile.credits || 0) + amount;
    
    // Update credits
    const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ credits: newBalance })
        .eq('id', userId);
        
    if (updateError) return { error: updateError.message };
    
    // Log transaction
    const { error: logError } = await supabaseAdmin
        .from('credit_transactions')
        .insert({
            user_id: userId,
            amount: amount,
            description: description,
            metadata: { reward: true, ...metadata }
        });
        
    if (logError) {
        console.error('Error logging reward transaction:', logError);
    }
    
    return { success: true, newBalance };
}

export async function checkListingRewardAlreadyGiven(propertyId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('credit_transactions')
        .select('id')
        .eq('metadata->>property_id', propertyId)
        .ilike('description', 'Recompensă adăugare anunț%')
        .limit(1);

    if (error || !data || data.length === 0) {
        return false;
    }
    return true;
}

export async function getAdminCreditHistory() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    // Verify admin
    const { data: adminProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!adminProfile || (adminProfile.role !== 'admin' && adminProfile.role !== 'super_admin')) {
        return { error: 'Unauthorized' };
    }

    const { data: transactions, error: txError } = await supabase
        .from('credit_transactions')
        .select('*')
        .order('created_at', { ascending: false });

    if (txError) {
        console.error('Error fetching admin credit history:', txError);
        return { error: txError.message };
    }

    const userIds = Array.from(new Set((transactions || []).map(tx => tx.user_id).filter(Boolean)));
    const profilesMap: Record<string, any> = {};

    if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, email, role, phone')
            .in('id', userIds);

        if (profilesError) {
            console.error('Error fetching profiles for admin history:', profilesError);
        } else if (profiles) {
            profiles.forEach(p => {
                profilesMap[p.id] = p;
            });
        }
    }

    const combined = (transactions || []).map(tx => ({
        ...tx,
        profiles: profilesMap[tx.user_id] || null
    }));

    return { transactions: combined };
}

export async function deductUserCreditsByAdmin(userId: string, amount: number, description: string = 'Consum servicii', metadata: Record<string, any> = {}) {
    const supabaseAdmin = createAdminClient();
    
    // Get current balance
    const { data: profile, error: readError } = await supabaseAdmin
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();
        
    if (readError) return { error: readError.message };
    
    const currentCredits = profile.credits || 0;
    if (currentCredits < amount) {
        return { error: 'Fonduri insuficiente', insufficient: true };
    }
    
    const newBalance = currentCredits - amount;
    
    // Update balance
    const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ credits: newBalance })
        .eq('id', userId);
        
    if (updateError) return { error: updateError.message };
    
    // Log transaction
    const { error: logTxError } = await supabaseAdmin
        .from('credit_transactions')
        .insert({
            user_id: userId,
            amount: -amount,
            description: description,
            metadata: { feature_cost: amount, ...metadata }
        });
        
    if (logTxError) {
        console.error('Error logging admin-deduction transaction:', logTxError);
        // Rollback balance update
        await supabaseAdmin
            .from('profiles')
            .update({ credits: currentCredits })
            .eq('id', userId);
        return { error: 'Failed to record transaction log: ' + logTxError.message };
    }
    
    return { success: true, remaining: newBalance };
}

export async function checkContactUnlock(propertyId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { unlocked: false, loggedIn: false };

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

    const { data: txn, error } = await supabase
        .from('credit_transactions')
        .select('id')
        .eq('user_id', user.id)
        .contains('metadata', { property_id: propertyId, feature_key: 'view_owner_contact' })
        .limit(1);

    if (error) {
        console.error('Error checking contact unlock:', error);
        return { unlocked: false, loggedIn: true, error: error.message };
    }

    return { unlocked: txn && txn.length > 0, loggedIn: true };
}

export async function unlockContact(propertyId: string, propertyTitle: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const { data: settingsData } = await supabase
        .from('platform_settings')
        .select('setting_value')
        .eq('setting_key', 'feature_costs')
        .single();

    const costsMap = (settingsData?.setting_value as Record<string, number>) || {};
    const cost = costsMap['view_owner_contact'] !== undefined ? costsMap['view_owner_contact'] : 1;

    const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single();

    if (!profile) return { error: 'Profile not found' };

    // Check if already unlocked (bypass or previous txn)
    const unlockCheck = await checkContactUnlock(propertyId);
    let remainingCredits = profile.credits || 0;

    if (!unlockCheck.unlocked) {
        if (remainingCredits < cost) {
            return { error: 'Fonduri insuficiente', insufficient: true, cost };
        }

        const res = await deductUserCredits(
            cost,
            `Unlock Contact: ${propertyTitle}`,
            { property_id: propertyId, feature_key: 'view_owner_contact' }
        );

        if (res.error) {
            return { error: res.error, insufficient: res.insufficient };
        }
        remainingCredits = res.remaining ?? remainingCredits;
    }

    // Resolve owner contact details securely
    const { data: property } = await supabase
        .from('properties')
        .select('owner_id, owner_name, owner_phone')
        .eq('id', propertyId)
        .single();

    if (!property) {
        return { error: 'Property not found' };
    }

    const { data: ownerProfile } = await supabase
        .from('profiles')
        .select('full_name, phone, role')
        .eq('id', property.owner_id)
        .single();

    let resolvedName = 'Owner';
    let resolvedPhone = '';

    const isCreatorAdmin = ownerProfile?.role === 'admin' || ownerProfile?.role === 'super_admin' || ownerProfile?.role === 'superadmin';

    if (isCreatorAdmin) {
        resolvedName = property.owner_name || ownerProfile?.full_name || 'Owner';
        resolvedPhone = property.owner_phone || ownerProfile?.phone || '';
    } else {
        resolvedName = ownerProfile?.full_name || 'Agent';
        resolvedPhone = ownerProfile?.phone || '';
    }

    return { 
        success: true, 
        cost, 
        remaining: remainingCredits,
        contactName: resolvedName,
        contactPhone: resolvedPhone
    };
}

export async function checkMarketInsightsUnlock() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { unlocked: false, loggedIn: false };

    const { data: txn, error } = await supabase
        .from('credit_transactions')
        .select('id')
        .eq('user_id', user.id)
        .contains('metadata', { feature_key: 'unlock_market_insights' })
        .limit(1);

    if (error) {
        console.error('Error checking market insights unlock:', error);
        return { unlocked: false, loggedIn: true, error: error.message };
    }

    return { unlocked: txn && txn.length > 0, loggedIn: true };
}

export async function unlockMarketInsights() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const { data: settingsData } = await supabase
        .from('platform_settings')
        .select('setting_value')
        .eq('setting_key', 'feature_costs')
        .single();

    const costsMap = (settingsData?.setting_value as Record<string, number>) || {};
    const cost = costsMap['unlock_market_insights'] !== undefined ? costsMap['unlock_market_insights'] : 20;

    const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single();

    if (!profile) return { error: 'Profile not found' };

    const currentCredits = profile.credits || 0;
    if (currentCredits < cost) {
        return { error: 'Fonduri insuficiente', insufficient: true, cost };
    }

    const res = await deductUserCredits(
        cost,
        `Deblocare ACP Market Insights`,
        { feature_key: 'unlock_market_insights' }
    );

    if (res.error) {
        return { error: res.error, insufficient: res.insufficient };
    }

    return { 
        success: true, 
        cost, 
        remaining: res.remaining
    };
}

export async function upgradeToAgencyAccount() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const { data: settingsData } = await supabase
        .from('platform_settings')
        .select('setting_value')
        .eq('setting_key', 'feature_costs')
        .single();

    const costsMap = (settingsData?.setting_value as Record<string, number>) || {};
    const cost = costsMap['upgrade_agency_cost'] !== undefined ? costsMap['upgrade_agency_cost'] : 500;

    const { data: profile } = await supabase
        .from('profiles')
        .select('credits, plan_tier')
        .eq('id', user.id)
        .single();

    if (!profile) return { error: 'Profile not found' };
    if (profile.plan_tier === 'enterprise') {
        return { error: 'Ai deja un cont de tip Agency' };
    }

    const currentCredits = profile.credits || 0;
    if (currentCredits < cost) {
        return { error: 'Fonduri insuficiente', insufficient: true, cost };
    }

    const res = await deductUserCredits(
        cost,
        `Upgrade la cont Agency`,
        { feature_key: 'upgrade_agency_account' }
    );

    if (res.error) {
        return { error: res.error, insufficient: res.insufficient };
    }

    const { error: updateError } = await supabase
        .from('profiles')
        .update({
            plan_tier: 'enterprise',
            listings_limit: 500,
            featured_limit: 250
        })
        .eq('id', user.id);

    if (updateError) {
        console.error('Error upgrading plan_tier:', updateError);
        return { error: updateError.message };
    }

    return { 
        success: true, 
        cost, 
        remaining: res.remaining
    };
}

export async function checkVirtualTourUnlock(propertyId?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { unlocked: false, loggedIn: false };

    // 1. Check if user is owner/admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'superadmin';

    // If propertyId is provided, check if user is the owner
    if (propertyId) {
        const { data: property } = await supabase
            .from('properties')
            .select('owner_id, virtual_tour_url')
            .eq('id', propertyId)
            .single();

        const isOwner = property?.owner_id === user.id;
        if (isOwner || isAdmin) {
            return { unlocked: true, loggedIn: true, bypass: true };
        }

        // If there's already a virtual tour url, it means it's unlocked/active
        if (property?.virtual_tour_url) {
            return { unlocked: true, loggedIn: true };
        }
    }

    // Check if a transaction exists
    // If propertyId is provided, we check for a transaction linked to that propertyId
    // If propertyId is not provided, we check for a transaction of feature_key 'virtual_tour' that has property_id: null
    let query = supabase
        .from('credit_transactions')
        .select('id, metadata')
        .eq('user_id', user.id)
        .contains('metadata', { feature_key: 'virtual_tour' });

    if (propertyId) {
        query = query.contains('metadata', { property_id: propertyId });
    }

    const { data: txns, error } = await query;

    if (error) {
        console.error('Error checking virtual tour unlock:', error);
        return { unlocked: false, loggedIn: true, error: error.message };
    }

    if (propertyId) {
        return { unlocked: txns && txns.length > 0, loggedIn: true };
    } else {
        // For new properties, we look for any transaction of virtual_tour that doesn't have property_id in metadata
        const pendingTxn = txns?.find((t: any) => !t.metadata?.property_id);
        return { unlocked: !!pendingTxn, loggedIn: true };
    }
}

export async function unlockVirtualTour(propertyId?: string) {
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
    const cost = costsMap['virtual_tour'] !== undefined ? costsMap['virtual_tour'] : 1;

    // Check if already unlocked (bypass or previous txn)
    const unlockCheck = await checkVirtualTourUnlock(propertyId);
    if (unlockCheck.unlocked) {
        return { success: true, cost: 0, message: 'Already unlocked' };
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single();

    if (!profile) return { error: 'Profile not found' };

    const remainingCredits = profile.credits || 0;
    if (remainingCredits < cost) {
        return { error: 'Fonduri insuficiente', insufficient: true, cost };
    }

    // Deduct credits
    const description = propertyId 
        ? `Deblocare Virtual Tour`
        : `Deblocare Virtual Tour (Anunţ Nou)`;

    const metadata: Record<string, any> = {
        feature_key: 'virtual_tour',
        property_id: propertyId || null
    };

    const res = await deductUserCredits(cost, description, metadata);

    if (res.error) {
        return { error: res.error, insufficient: res.insufficient, cost };
    }

    return { success: true, cost, remaining: res.remaining };
}
