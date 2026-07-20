'use server';

import { createAdminClient } from '@/app/lib/supabase/admin';
import { createClient } from '@/app/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface BlacklistedPhone {
    id: string;
    phone_number: string;
    normalized_phone: string;
    reason: string | null;
    created_at: string;
    added_by: string | null;
    added_by_name?: string | null;
    affected_properties_count?: number;
}

export interface BlacklistedProperty {
    id: string;
    title: string;
    price: number;
    currency: string;
    city: string;
    county: string;
    owner_phone: string | null;
    owner_name?: string | null;
    status: string;
    created_at: string;
    updated_at: string;
    images?: string[];
}

/**
 * Normalizes a phone string to digits only for accurate matching
 */
export async function normalizePhoneNumber(phone: string): Promise<string> {
    if (!phone) return '';
    let digits = phone.replace(/\D/g, '');
    if (digits.startsWith('40') && digits.length === 11) {
        digits = '0' + digits.slice(2);
    }
    return digits;
}

// Synchronous internal helper
function normalizePhoneSync(phone: string): string {
    if (!phone) return '';
    let digits = phone.replace(/\D/g, '');
    if (digits.startsWith('40') && digits.length === 11) {
        digits = '0' + digits.slice(2);
    }
    return digits;
}

/**
 * Ensure `blacklisted_phones` table exists in Supabase schema.
 */
async function ensureBlacklistTable(adminClient: any) {
    try {
        const { error } = await adminClient.from('blacklisted_phones').select('id').limit(1);
        if (error && (error.code === 'PGRST204' || error.message?.includes('does not exist') || error.message?.includes('relation "public.blacklisted_phones" does not exist'))) {
            // Attempt table creation via RPC or fallback schema query
            await adminClient.rpc('exec_sql', {
                sql_query: `
                    CREATE TABLE IF NOT EXISTS public.blacklisted_phones (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        phone_number TEXT NOT NULL,
                        normalized_phone TEXT NOT NULL,
                        reason TEXT,
                        created_at TIMESTAMPTZ DEFAULT NOW(),
                        added_by UUID REFERENCES public.profiles(id)
                    );
                    CREATE INDEX IF NOT EXISTS idx_blacklisted_phones_norm ON public.blacklisted_phones(normalized_phone);
                `
            }).catch(() => null);
        }
    } catch {
        // Table existence check failed silently
    }
}

/**
 * Fetch all blacklisted phone numbers with counts of affected properties
 */
export async function getBlacklistedPhones(): Promise<{ success: boolean; data: BlacklistedPhone[]; error?: string }> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'Neautorizat', data: [] };

        const adminClient = createAdminClient();
        await ensureBlacklistTable(adminClient);

        const { data: phones, error } = await adminClient
            .from('blacklisted_phones')
            .select(`
                *,
                added_by_profile:added_by(full_name, email)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching blacklisted phones:', error);
            if (error.code === 'PGRST204' || error.message?.includes('does not exist')) {
                return { success: true, data: [] };
            }
            return { success: false, error: error.message, data: [] };
        }

        // Fetch count of blacklisted properties for each blacklisted phone
        const { data: properties } = await adminClient
            .from('properties')
            .select('id, owner_phone')
            .eq('status', 'blacklist');

        const formatted = (phones || []).map((p: any) => {
            const norm = p.normalized_phone || normalizePhoneSync(p.phone_number);
            const affectedCount = (properties || []).filter((prop: any) => {
                if (!prop.owner_phone) return false;
                const propNorm = normalizePhoneSync(prop.owner_phone);
                return propNorm.includes(norm) || norm.includes(propNorm);
            }).length;

            return {
                id: p.id,
                phone_number: p.phone_number,
                normalized_phone: norm,
                reason: p.reason || null,
                created_at: p.created_at,
                added_by: p.added_by,
                added_by_name: p.added_by_profile?.full_name || p.added_by_profile?.email || 'Admin',
                affected_properties_count: affectedCount,
            };
        });

        return { success: true, data: formatted };
    } catch (err: any) {
        console.error('Exception fetching blacklisted phones:', err);
        return { success: false, error: err.message, data: [] };
    }
}

/**
 * Add a phone number to the blacklist and automatically update matching properties to status 'blacklist'
 */
export async function addPhoneToBlacklist(rawPhone: string, reason?: string): Promise<{ success: boolean; countUpdated?: number; error?: string }> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'Neautorizat' };

        const phone = rawPhone.trim();
        const normalized = normalizePhoneSync(phone);

        if (!phone || normalized.length < 6) {
            return { success: false, error: 'Numărul de telefon introdus este nevalid (minim 6 cifre).' };
        }

        const adminClient = createAdminClient();
        await ensureBlacklistTable(adminClient);

        // 1. Insert into blacklisted_phones table
        const { error: insertErr } = await adminClient
            .from('blacklisted_phones')
            .insert({
                phone_number: phone,
                normalized_phone: normalized,
                reason: reason?.trim() || null,
                added_by: user.id,
            });

        if (insertErr) {
            console.error('Error inserting blacklisted phone:', insertErr);
            return { success: false, error: 'Eroare la adăugarea numărului în blacklist: ' + insertErr.message };
        }

        // 2. Automatically find properties with matching owner_phone and change status from active/published to 'blacklist'
        const { data: allProps } = await adminClient
            .from('properties')
            .select('id, owner_phone, status')
            .neq('status', 'blacklist');

        const matchingPropertyIds: string[] = [];
        (allProps || []).forEach((prop: any) => {
            if (!prop.owner_phone) return;
            const propNorm = normalizePhoneSync(prop.owner_phone);
            if (propNorm && (propNorm === normalized || propNorm.includes(normalized) || normalized.includes(propNorm))) {
                matchingPropertyIds.push(prop.id);
            }
        });

        let updatedCount = 0;
        if (matchingPropertyIds.length > 0) {
            const { error: updateErr } = await adminClient
                .from('properties')
                .update({
                    status: 'blacklist',
                    updated_at: new Date().toISOString(),
                })
                .in('id', matchingPropertyIds);

            if (updateErr) {
                console.error('Error updating blacklisted properties:', updateErr);
            } else {
                updatedCount = matchingPropertyIds.length;
            }
        }

        revalidatePath('/dashboard/admin/blacklist');
        revalidatePath('/dashboard/admin/properties');
        revalidatePath('/properties');

        return { success: true, countUpdated: updatedCount };
    } catch (err: any) {
        console.error('Exception adding phone to blacklist:', err);
        return { success: false, error: err.message };
    }
}

/**
 * Remove a phone number from the blacklist
 */
export async function removePhoneFromBlacklist(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'Neautorizat' };

        const adminClient = createAdminClient();
        const { error } = await adminClient
            .from('blacklisted_phones')
            .delete()
            .eq('id', id);

        if (error) {
            return { success: false, error: error.message };
        }

        revalidatePath('/dashboard/admin/blacklist');
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

/**
 * Fetch properties in status 'blacklist' with search filters
 */
export async function getBlacklistedProperties(filters?: { query?: string; city?: string; phone?: string }): Promise<{ success: boolean; data: BlacklistedProperty[]; error?: string }> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'Neautorizat', data: [] };

        const adminClient = createAdminClient();
        let query = adminClient
            .from('properties')
            .select(`
                id, title, price, currency, city, county, owner_phone, status, created_at, updated_at, images,
                owner:owner_id(full_name, email, phone)
            `)
            .eq('status', 'blacklist')
            .order('updated_at', { ascending: false });

        if (filters?.city && filters.city !== 'all') {
            query = query.eq('city', filters.city);
        }

        const { data: props, error } = await query;

        if (error) {
            console.error('Error fetching blacklisted properties:', error);
            return { success: false, error: error.message, data: [] };
        }

        let result: BlacklistedProperty[] = (props || []).map((p: any) => ({
            id: p.id,
            title: p.title || 'Fără titlu',
            price: p.price || 0,
            currency: p.currency || 'EUR',
            city: p.city || 'Timișoara',
            county: p.county || 'Timiș',
            owner_phone: p.owner_phone || p.owner?.phone || null,
            owner_name: p.owner?.full_name || p.owner?.email || 'Proprietar',
            status: p.status,
            created_at: p.created_at,
            updated_at: p.updated_at,
            images: p.images || [],
        }));

        if (filters?.query) {
            const q = filters.query.toLowerCase().trim();
            result = result.filter(p =>
                p.title.toLowerCase().includes(q) ||
                (p.owner_phone && p.owner_phone.includes(q)) ||
                (p.owner_name && p.owner_name.toLowerCase().includes(q)) ||
                p.city.toLowerCase().includes(q)
            );
        }

        if (filters?.phone) {
            const normFilterPhone = normalizePhoneSync(filters.phone);
            if (normFilterPhone) {
                result = result.filter(p => {
                    if (!p.owner_phone) return false;
                    const pNorm = normalizePhoneSync(p.owner_phone);
                    return pNorm.includes(normFilterPhone) || normFilterPhone.includes(pNorm);
                });
            }
        }

        return { success: true, data: result };
    } catch (err: any) {
        console.error('Exception fetching blacklisted properties:', err);
        return { success: false, error: err.message, data: [] };
    }
}

/**
 * Restore a blacklisted property back to status 'active' or 'draft'
 */
export async function restorePropertyFromBlacklist(propertyId: string, newStatus: 'active' | 'draft' = 'active'): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'Neautorizat' };

        const adminClient = createAdminClient();
        const { error } = await adminClient
            .from('properties')
            .update({
                status: newStatus,
                updated_at: new Date().toISOString(),
            })
            .eq('id', propertyId);

        if (error) {
            return { success: false, error: error.message };
        }

        revalidatePath('/dashboard/admin/blacklist');
        revalidatePath('/dashboard/admin/properties');
        revalidatePath('/properties');
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

/**
 * Permanently delete a blacklisted property
 */
export async function deleteBlacklistedProperty(propertyId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'Neautorizat' };

        const adminClient = createAdminClient();
        const { error } = await adminClient
            .from('properties')
            .delete()
            .eq('id', propertyId);

        if (error) {
            return { success: false, error: error.message };
        }

        revalidatePath('/dashboard/admin/blacklist');
        revalidatePath('/dashboard/admin/properties');
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

/**
 * Check if a phone number is blacklisted
 */
export async function isPhoneBlacklisted(phone: string): Promise<boolean> {
    if (!phone) return false;
    const norm = normalizePhoneSync(phone);
    if (!norm || norm.length < 6) return false;

    try {
        const adminClient = createAdminClient();
        const { data } = await adminClient
            .from('blacklisted_phones')
            .select('id, normalized_phone')
            .limit(200);

        if (!data || data.length === 0) return false;

        return data.some((b: any) => {
            const bNorm = b.normalized_phone || normalizePhoneSync(b.phone_number);
            return bNorm && (bNorm === norm || bNorm.includes(norm) || norm.includes(bNorm));
        });
    } catch {
        return false;
    }
}
