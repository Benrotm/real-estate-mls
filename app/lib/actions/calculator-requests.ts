'use server';

import { createClient } from '@/app/lib/supabase/server';
import { createAdminClient } from '@/app/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function createCalculatorRequest(data: {
    name: string;
    phone: string;
    property_value: number;
    selected_model: string;
    is_exclusive: boolean;
    exclusivity_days: number;
    selected_services: any;
    calculations: any;
}) {
    try {
        const adminClient = createAdminClient();

        // 1. Insert request
        const { data: request, error: insertError } = await adminClient
            .from('calculator_requests')
            .insert({
                name: data.name,
                phone: data.phone,
                property_value: data.property_value,
                selected_model: data.selected_model,
                is_exclusive: data.is_exclusive,
                exclusivity_days: data.exclusivity_days,
                selected_services: data.selected_services,
                calculations: data.calculations
            })
            .select()
            .single();

        if (insertError) throw insertError;

        // 2. Fetch admins/superadmins
        const { data: allAdmins } = await adminClient
            .from('profiles')
            .select('id')
            .in('role', ['admin', 'super_admin']);

        // 3. Send notifications to all admins and superadmins
        if (allAdmins && allAdmins.length > 0) {
            const notifications = allAdmins.map(admin => ({
                user_id: admin.id,
                type: 'system',
                title: 'Solicitare Nouă Broker',
                content: `Proprietarul ${data.name} (${data.phone}) a solicitat detalii din calculator.`,
                link: `/dashboard/admin/solicitari-proprietari`
            }));

            await adminClient.from('notifications').insert(notifications);
        }

        revalidatePath('/dashboard/admin/solicitari-proprietari');
        return { success: true, request };
    } catch (error: any) {
        console.error('Error creating calculator request:', error);
        return { success: false, error: error.message || 'Failed to submit request' };
    }
}

export async function getCalculatorRequests() {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('calculator_requests')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, requests: data || [] };
    } catch (error: any) {
        console.error('Error fetching calculator requests:', error);
        return { success: false, error: error.message || 'Failed to fetch requests', requests: [] };
    }
}
