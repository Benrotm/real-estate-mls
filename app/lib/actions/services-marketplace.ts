'use server';

import { createClient } from '@/app/lib/supabase/server';
import { createAdminClient } from '@/app/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

// Middleware permission check
async function verifyAdmin() {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw new Error('Unauthorized. Sign in required.');

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
        throw new Error('Unauthorized. Admin permissions required.');
    }
    return user;
}

export async function getServiceCategories() {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('service_categories')
            .select('*')
            .order('sort_order', { ascending: true })
            .order('title', { ascending: true });

        if (error) throw error;
        return { success: true, categories: data || [] };
    } catch (e: any) {
        console.error('Error fetching service categories:', e);
        return { success: false, error: e.message || 'Failed to fetch categories', categories: [] };
    }
}

export async function createServiceCategory(title: string, slug: string, description: string, icon: string) {
    try {
        await verifyAdmin();
        const adminClient = createAdminClient();

        const { data, error } = await adminClient
            .from('service_categories')
            .insert({ title, slug, description, icon })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                throw new Error('O categorie cu acest nume sau slug există deja.');
            }
            throw error;
        }
        revalidatePath('/services');
        revalidatePath('/dashboard/admin/services');
        return { success: true, category: data };
    } catch (e: any) {
        console.error('Error creating category:', e);
        return { success: false, error: e.message || 'Failed to create category' };
    }
}

export async function deleteServiceCategory(id: string) {
    try {
        await verifyAdmin();
        const adminClient = createAdminClient();

        const { error } = await adminClient
            .from('service_categories')
            .delete()
            .eq('id', id);

        if (error) throw error;
        revalidatePath('/services');
        revalidatePath('/dashboard/admin/services');
        return { success: true };
    } catch (e: any) {
        console.error('Error deleting category:', e);
        return { success: false, error: e.message || 'Failed to delete category' };
    }
}

export async function registerServiceProvider(data: {
    brand_name: string;
    cui_cif: string;
    phone: string;
    email: string;
    category_slug: string;
    document_url?: string;
    city: string;
    radius_km: number;
    description: string;
    orientative_prices?: string;
    selected_plan: string;
}) {
    try {
        const supabase = await createClient();
        
        // 1. Get current authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return { success: false, error: 'Trebuie să fii autentificat pentru a trimite cererea de partener.' };
        }

        // 2. Insert provider request
        const { data: provider, error: insertError } = await supabase
            .from('service_providers')
            .insert({
                user_id: user.id,
                brand_name: data.brand_name,
                cui_cif: data.cui_cif,
                phone: data.phone,
                email: data.email,
                category_slug: data.category_slug,
                document_url: data.document_url,
                city: data.city,
                radius_km: data.radius_km,
                description: data.description,
                orientative_prices: data.orientative_prices,
                selected_plan: data.selected_plan,
                status: 'pending' // starts as pending
            })
            .select()
            .single();

        if (insertError) throw insertError;

        // 3. Notify admins
        const adminClient = createAdminClient();
        const { data: allAdmins } = await adminClient
            .from('profiles')
            .select('id')
            .in('role', ['admin', 'super_admin']);

        if (allAdmins) {
            const notifications = allAdmins.map(admin => ({
                user_id: admin.id,
                type: 'system',
                title: 'Cerere Partener Nou',
                content: `Firma ${data.brand_name} a trimis o cerere de înregistrare ca partener în categoria ${data.category_slug}.`,
                link: '/dashboard/admin/services'
            }));
            await adminClient.from('notifications').insert(notifications);
        }

        revalidatePath('/dashboard/admin/services');
        return { success: true, provider };
    } catch (e: any) {
        console.error('Error registering service provider:', e);
        return { success: false, error: e.message || 'Failed to submit partner request' };
    }
}

export async function getPendingServiceProviders() {
    try {
        await verifyAdmin();
        const adminClient = createAdminClient();

        const { data, error } = await adminClient
            .from('service_providers')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, providers: data || [] };
    } catch (e: any) {
        console.error('Error fetching pending providers:', e);
        return { success: false, error: e.message || 'Failed to fetch requests', providers: [] };
    }
}

export async function getAllServiceProviders() {
    try {
        await verifyAdmin();
        const adminClient = createAdminClient();

        const { data, error } = await adminClient
            .from('service_providers')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, providers: data || [] };
    } catch (e: any) {
        console.error('Error fetching all providers:', e);
        return { success: false, error: e.message || 'Failed to fetch providers', providers: [] };
    }
}

export async function updateProviderStatus(id: string, status: 'approved' | 'rejected') {
    try {
        await verifyAdmin();
        const adminClient = createAdminClient();

        // 1. Update status
        const { data: provider, error: updateError } = await adminClient
            .from('service_providers')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (updateError) throw updateError;

        // 2. Notify user
        if (provider.user_id) {
            const planLabels: Record<string, string> = {
                trial: 'Trial 30 Zile (0 RON)',
                standard: 'Abonament Standard (199 Credite/lună)',
                exclusivity: 'Exclusivitate Zonă (2490 Credite/lună)'
            };
            const message = status === 'approved' 
                ? `Felicitări! Cererea ta de parteneriat pentru ${provider.brand_name} a fost aprobată cu planul ${planLabels[provider.selected_plan] || provider.selected_plan}.`
                : `Ne pare rău, dar cererea ta de parteneriat pentru ${provider.brand_name} a fost respinsă.`;

            await adminClient.from('notifications').insert({
                user_id: provider.user_id,
                type: 'system',
                title: status === 'approved' ? 'Parteneriat Aprobat' : 'Parteneriat Respins',
                content: message,
                link: '/services'
            });
        }

        revalidatePath('/services');
        revalidatePath('/dashboard/admin/services');
        return { success: true, provider };
    } catch (e: any) {
        console.error('Error updating provider status:', e);
        return { success: false, error: e.message || 'Failed to update status' };
    }
}

export async function getApprovedProvidersByCategory(categorySlug: string) {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('service_providers')
            .select('*')
            .eq('category_slug', categorySlug)
            .eq('status', 'approved')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, providers: data || [] };
    } catch (e: any) {
        console.error(`Error fetching approved providers for ${categorySlug}:`, e);
        return { success: false, error: e.message || 'Failed to fetch providers', providers: [] };
    }
}

export async function getProviderByUserId(userId: string) {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('service_providers')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'approved')
            .maybeSingle();

        if (error) throw error;
        return { success: true, provider: data };
    } catch (e: any) {
        console.error('Error fetching provider by user id:', e);
        return { success: false, error: e.message || 'Failed to fetch provider' };
    }
}

export async function updateServiceCategoryOrder(categoriesList: { id: string, sort_order: number }[]) {
    try {
        await verifyAdmin();
        const adminClient = createAdminClient();

        // Perform parallel updates
        const promises = categoriesList.map(item => 
            adminClient
                .from('service_categories')
                .update({ sort_order: item.sort_order })
                .eq('id', item.id)
        );
        await Promise.all(promises);
        
        revalidatePath('/dashboard/admin/services');
        revalidatePath('/');
        return { success: true };
    } catch (e: any) {
        console.error('Error updating service category order:', e);
        return { success: false, error: e.message || 'Failed to update order' };
    }
}

export async function createServiceRequest(
    clientName: string,
    clientPhone: string,
    categorySlug: string,
    categoryTitle: string,
    requestDetails: string
) {
    try {
        const supabase = await createClient();
        const adminClient = createAdminClient();

        // 1. Insert request
        const { data: request, error: insertError } = await adminClient
            .from('service_requests')
            .insert({
                client_name: clientName,
                client_phone: clientPhone,
                category_slug: categorySlug,
                category_title: categoryTitle,
                request_details: requestDetails
            })
            .select()
            .single();

        if (insertError) throw insertError;

        // 2. Fetch admins and superadmins to notify
        const { data: admins, error: adminError } = await adminClient
            .from('profiles')
            .select('id')
            .in('role', ['admin', 'super_admin']);

        if (!adminError && admins && admins.length > 0) {
            const notifications = admins.map(admin => ({
                user_id: admin.id,
                type: 'system',
                title: 'Solicitare nouă Serviciu HUB',
                content: `Clientul ${clientName} solicită: ${categoryTitle}`,
                link: '/dashboard/admin/services?tab=requests',
                is_read: false
            }));

            await adminClient.from('notifications').insert(notifications);
        }

        revalidatePath('/dashboard/admin/services');
        return { success: true, request };
    } catch (e: any) {
        console.error('Error creating service request:', e);
        return { success: false, error: e.message || 'Failed to create request' };
    }
}

export async function getServiceRequests() {
    try {
        await verifyAdmin();
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('service_requests')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, requests: data || [] };
    } catch (e: any) {
        console.error('Error fetching service requests:', e);
        return { success: false, error: e.message || 'Failed to fetch requests', requests: [] };
    }
}

export async function updateServiceRequestStatus(id: string, status: string) {
    try {
        await verifyAdmin();
        const adminClient = createAdminClient();
        const { data, error } = await adminClient
            .from('service_requests')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        revalidatePath('/dashboard/admin/services');
        return { success: true, request: data };
    } catch (e: any) {
        console.error('Error updating request status:', e);
        return { success: false, error: e.message || 'Failed to update request' };
    }
}

export async function deleteServiceRequest(id: string) {
    try {
        await verifyAdmin();
        const adminClient = createAdminClient();
        const { error } = await adminClient
            .from('service_requests')
            .delete()
            .eq('id', id);

        if (error) throw error;
        revalidatePath('/dashboard/admin/services');
        return { success: true };
    } catch (e: any) {
        console.error('Error deleting request:', e);
        return { success: false, error: e.message || 'Failed to delete request' };
    }
}
