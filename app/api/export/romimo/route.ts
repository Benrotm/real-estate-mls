import { NextResponse } from 'next/server';
import { createAdminClient } from '@/app/lib/supabase/admin';
import { upsertRomimoArticle, deleteRomimoArticle } from '@/app/lib/api/romimo';
import { Property } from '@/app/lib/properties';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { propertyId, action } = body;

        if (!propertyId || !action) {
            return NextResponse.json({ error: 'Missing propertyId or action' }, { status: 400 });
        }

        const supabase = await createAdminClient();

        // Fetch property
        const { data: property, error } = await supabase
            .from('properties')
            .select(`*, owner:profiles(email, full_name, phone)`)
            .eq('id', propertyId)
            .single();

        if (error || !property) {
            return NextResponse.json({ error: 'Property not found' }, { status: 404 });
        }

        const userEmail = property.owner?.email;

        if (!userEmail) {
            return NextResponse.json({ error: 'Property owner email is missing' }, { status: 400 });
        }

        if (action === 'upsert') {
            const result = await upsertRomimoArticle(property as Property, userEmail);
            if (result.error) {
                return NextResponse.json(result, { status: 500 });
            }
            return NextResponse.json({ success: true, message: 'Property successfully synced to Romimo' });
        } else if (action === 'delete') {
            const result = await deleteRomimoArticle(userEmail, property.id);
            if (result.error) {
                return NextResponse.json(result, { status: 500 });
            }
            return NextResponse.json({ success: true, message: 'Property successfully deleted from Romimo' });
        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

    } catch (e: any) {
        console.error('Error in Romimo export API:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
