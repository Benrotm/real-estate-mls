import { NextResponse } from 'next/server';
import { getRomimoUserPackage } from '@/app/lib/api/romimo';
import { createClient } from '@/app/lib/supabase/server';

export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // You could also accept email as query param, but for safety use the logged-in user's email
    // Or if the property owner is different, the frontend can pass it.
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email') || session.user.email;

    if (!email) {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const result = await getRomimoUserPackage(email);
    
    if (result.error) {
        return NextResponse.json({ error: result.error, details: result.details }, { status: 500 });
    }

    return NextResponse.json(result);
}
