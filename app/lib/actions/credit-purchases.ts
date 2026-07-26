'use server';

import { createClient } from '../supabase/server';
import { revalidatePath } from 'next/cache';

// Helper to generate a unique reference code like IP-XXXXXX
function generateReferenceCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'IP-';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

export async function createPendingPurchase(amountRon: number, credits: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    // Check if user already has a pending purchase
    const { data: existingPending } = await supabase
        .from('credit_purchases')
        .select('id, reference_id')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .limit(1);

    if (existingPending && existingPending.length > 0) {
        return { 
            error: 'Ai deja o cerere de plată în așteptare.', 
            existing: existingPending[0] 
        };
    }

    // Generate unique reference
    let referenceId = generateReferenceCode();
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
        const { data } = await supabase
            .from('credit_purchases')
            .select('id')
            .eq('reference_id', referenceId)
            .limit(1);
        if (!data || data.length === 0) {
            isUnique = true;
        } else {
            referenceId = generateReferenceCode();
        }
        attempts++;
    }

    const { data, error } = await supabase
        .from('credit_purchases')
        .insert({
            user_id: user.id,
            reference_id: referenceId,
            amount_ron: amountRon,
            credits: credits,
            status: 'pending'
        })
        .select()
        .single();

    if (error) return { error: error.message };

    // Fetch user name for the notification
    const { data: userProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

    const userName = userProfile?.full_name || 'Un utilizator';

    // Fetch all admins/superadmins to notify them
    const { data: admins } = await supabase
        .from('profiles')
        .select('id')
        .in('role', ['admin', 'super_admin']);

    if (admins && admins.length > 0) {
        try {
            const { createNotification } = await import('@/app/lib/actions/notifications');
            for (const admin of admins) {
                await createNotification({
                    user_id: admin.id,
                    type: 'offer',
                    title: 'Plată în așteptare',
                    content: `${userName} a trimis o cerere de plată manuală de ${amountRon} RON (Ref: ${referenceId})`,
                    link: '/dashboard/admin/validare-plati'
                });
            }
        } catch (notifErr) {
            console.error('Failed to notify admins of pending purchase:', notifErr);
        }
    }

    revalidatePath('/cont/plati');
    return { success: true, purchase: data };
}

export async function cancelPendingPurchase(purchaseId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const { error } = await supabase
        .from('credit_purchases')
        .update({ status: 'cancelled' })
        .eq('id', purchaseId)
        .eq('user_id', user.id);

    if (error) return { error: error.message };

    revalidatePath('/cont/plati');
    return { success: true };
}

export async function approvePurchase(purchaseId: string) {
    const supabase = await createClient();
    const { data: { user: adminUser } } = await supabase.auth.getUser();
    if (!adminUser) return { error: 'Unauthorized' };

    // Check permissions
    const { data: adminProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', adminUser.id)
        .single();

    if (!adminProfile || (adminProfile.role !== 'admin' && adminProfile.role !== 'super_admin')) {
        return { error: 'Permisiuni insuficiente pentru a aproba plăți' };
    }

    // Fetch purchase
    const { data: purchase, error: fetchError } = await supabase
        .from('credit_purchases')
        .select('*')
        .eq('id', purchaseId)
        .single();

    if (fetchError) return { error: fetchError.message };
    if (purchase.status !== 'pending') return { error: 'Această plată nu mai este în așteptare' };

    // Start approval transactions
    // 1. Update purchase status
    const { error: updatePurchaseError } = await supabase
        .from('credit_purchases')
        .update({
            status: 'approved',
            completed_at: new Date().toISOString(),
            approved_by: adminUser.id
        })
        .eq('id', purchaseId);

    if (updatePurchaseError) return { error: updatePurchaseError.message };

    // 2. Grant credits to user
    const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', purchase.user_id)
        .single();

    if (profileError) return { error: profileError.message };

    const currentCredits = userProfile.credits || 0;
    const newCredits = currentCredits + purchase.credits;

    const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({ credits: newCredits })
        .eq('id', purchase.user_id);

    if (updateProfileError) return { error: updateProfileError.message };

    // 3. Log credit transaction
    const { error: logTxError } = await supabase
        .from('credit_transactions')
        .insert({
            user_id: purchase.user_id,
            amount: purchase.credits,
            description: 'Cumpărare credite',
            metadata: {
                purchase_id: purchaseId,
                reference_id: purchase.reference_id,
                approved_by: adminUser.id
            }
        });

    if (logTxError) return { error: logTxError.message };

    revalidatePath('/cont/plati');
    revalidatePath('/dashboard/client/ai-matching');
    revalidatePath('/dashboard/admin/validare-plati');
    revalidatePath('/dashboard');
    return { success: true };
}

export async function getPendingPurchases() {
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

    const { data, error } = await supabase
        .from('credit_purchases')
        .select('*, profiles(id, full_name, email, role, phone)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

    if (error) return { error: error.message };
    return { purchases: data };
}

export async function getApprovedPurchasesHistory() {
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

    const { data, error } = await supabase
        .from('credit_purchases')
        .select('*, profiles(id, full_name, email, role, phone)')
        .eq('status', 'approved')
        .order('completed_at', { ascending: false })
        .limit(50);

    if (error) return { error: error.message };
    return { purchases: data };
}

export async function getCompanyBankDetails() {
    const supabase = await createClient();
    
    const { data, error } = await supabase
        .from('platform_settings')
        .select('setting_value')
        .eq('setting_key', 'company_bank_details')
        .single();

    if (error || !data) {
        // Return default values if not found or error
        return {
            name: 'THE BC ORIGINALS SRL',
            iban: 'RO12 INGB 0000 9999 1234 5678'
        };
    }

    const details = data.setting_value as any;
    return {
        name: details.name || 'THE BC ORIGINALS SRL',
        iban: details.iban || 'RO12 INGB 0000 9999 1234 5678'
    };
}

export async function updateCompanyBankDetails(name: string, iban: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    // Check admin permissions
    const { data: adminProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!adminProfile || (adminProfile.role !== 'admin' && adminProfile.role !== 'super_admin')) {
        return { error: 'Unauthorized' };
    }

    // Insert or update bank details
    const { error } = await supabase
        .from('platform_settings')
        .upsert({
            setting_key: 'company_bank_details',
            setting_value: { name, iban }
        }, { onConflict: 'setting_key' });

    if (error) return { error: error.message };

    revalidatePath('/cont/plati');
    revalidatePath('/dashboard/admin/validare-plati');
    return { success: true };
}

export async function getUserPurchases() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const { data, error } = await supabase
        .from('credit_purchases')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) return { error: error.message };
    return { purchases: data };
}

export async function getActivePendingPurchase() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const { data, error } = await supabase
        .from('credit_purchases')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .limit(1)
        .maybeSingle();

    if (error) return { error: error.message };
    return { purchase: data };
}
