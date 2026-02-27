import { NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();

        // Ensure user is admin
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin' && profile?.role !== 'superadmin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const payload = await req.json();
        const { categoryUrl, jobId, pageNum, delayMin, delayMax, mode, linkSelector, extractSelectors } = payload;

        if (!categoryUrl || !jobId || !linkSelector || !extractSelectors) {
            return NextResponse.json({ error: 'Missing required dynamic scraper parameters' }, { status: 400 });
        }

        // Forward to the microservice
        const microserviceUrl = process.env.SCRAPER_MICROSERVICE_URL;
        if (!microserviceUrl) {
            return NextResponse.json({ error: 'Microservice URL not configured' }, { status: 500 });
        }

        // Fire and forget - don't await the long-running scrape
        fetch(`${microserviceUrl}/api/run-dynamic-scrape`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.SCRAPER_API_KEY}`
            },
            body: JSON.stringify({
                categoryUrl,
                jobId,
                pageNum,
                delayMin,
                delayMax,
                mode,
                linkSelector,
                extractSelectors,
                supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
                supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY
            })
        }).catch(err => console.error('Error triggering microservice:', err));

        return NextResponse.json({ success: true, message: 'Dynamic Crawler execution started' });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
