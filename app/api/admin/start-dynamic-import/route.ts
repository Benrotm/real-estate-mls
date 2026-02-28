import { NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';
import { getAdminSettings } from '@/app/lib/actions/admin-settings';

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

        if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const payload = await req.json();
        const { categoryUrl, jobId, pageNum, delayMin, delayMax, mode, linkSelector, extractSelectors } = payload;

        if (!categoryUrl || !jobId || !linkSelector || !extractSelectors) {
            return NextResponse.json({ error: 'Missing required dynamic scraper parameters' }, { status: 400 });
        }

        const scraperApiBase = process.env.NEXT_PUBLIC_SCRAPER_API_URL || '';
        const microserviceUrl = scraperApiBase.split('/api/')[0];

        if (!microserviceUrl) {
            return NextResponse.json({ error: 'Microservice URL not configured' }, { status: 500 });
        }

        // Fetch Proxy Info
        const settings = await getAdminSettings();
        const proxyConfig = settings?.proxy_integration?.is_active ? settings.proxy_integration : null;

        // Derive NextJS request origin to pass to Microservice
        let origin = '';
        if (process.env.NEXT_PUBLIC_SITE_URL) {
            origin = process.env.NEXT_PUBLIC_SITE_URL;
        } else {
            const host = req.headers.get('host') || 'localhost:3000';
            const protocol = host.includes('localhost') ? 'http' : 'https';
            origin = `${protocol}://${host}`;
        }

        // Await the fetch so Vercel Serverless doesn't freeze the Lambda before the request sends.
        // The microservice immediately replies with 200 OK after starting the browser cluster.
        const res = await fetch(`${microserviceUrl}/api/run-dynamic-scrape`, {
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
                proxyConfig,
                webhookBaseUrl: origin,
                supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
                supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY
            })
        });

        if (!res.ok) {
            console.error('Microservice returned an error status:', res.status);
        }

        return NextResponse.json({ success: true, message: 'Dynamic Crawler execution started' });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
