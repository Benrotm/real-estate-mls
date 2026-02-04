'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function createTicket(formData: FormData) {
    const supabase = createServerActionClient({ cookies });

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Unauthorized' };
    }

    const type = formData.get('type') as string;
    const subject = formData.get('subject') as string;
    const description = formData.get('description') as string;
    const imagesJson = formData.get('images') as string;

    let images: string[] = [];
    try {
        images = JSON.parse(imagesJson || '[]');
    } catch (e) {
        console.error('Failed to parse images JSON', e);
    }

    if (!subject || !description) {
        return { success: false, error: 'Subject and description are required.' };
    }

    const { error } = await supabase
        .from('tickets')
        .insert({
            user_id: user.id,
            type,
            subject,
            description,
            status: 'open',
            priority: 'medium', // Default
            images: images
        });

    if (error) {
        console.error('Error creating ticket:', error);
        return { success: false, error: 'Failed to create ticket.' };
    }

    revalidatePath('/dashboard');
    return { success: true };
}
