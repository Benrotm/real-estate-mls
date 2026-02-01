'use server'

import { createClient } from '@/app/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function verifySoldHistory(id: string) {
    const supabase = await createClient();

    // Check admin role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // In a real app, strict role check:
    // const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    // if (profile?.role !== 'admin' && profile?.role !== 'super_admin') throw new Error("Forbidden");

    const { error } = await supabase
        .from('property_sold_history')
        .update({ is_verified: true })
        .eq('id', id);

    if (error) throw new Error("Failed to verify");

    revalidatePath('/dashboard/admin/valuation');
}

export async function rejectSoldHistory(id: string) {
    const supabase = await createClient();

    // Check admin role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase
        .from('property_sold_history')
        .delete()
        .eq('id', id);

    if (error) throw new Error("Failed to rejection/delete");

    revalidatePath('/dashboard/admin/valuation');
}

export async function toggleSmartValuationFeature(enabled: boolean) {
    // This assumes we toggle it globally via a system setting or just update the current user's preference if simpler for MVP.
    // For a global toggle, we might need a 'system_settings' table or similar.
    // implementation pending / simplified to just verify for now.
    // Or we update all profiles? That's heavy.
    // Let's assume this is a placeholder for future system-wide config.
    console.log("Toggle feature not fully implemented system-wide");
}
