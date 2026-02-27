import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { categoryUrl, jobId, pageNum, delayMin, delayMax, mode } = body;

        const scraperApiBase = process.env.NEXT_PUBLIC_SCRAPER_API_URL || '';
        const runBulkEndpoint = scraperApiBase.replace('/scrape-advanced', '/run-bulk-scrape');

        // We use the server-side origin for the webhook address
        // If x-forwarded-host isn't reliable, fallback to env variable or localhost
        let origin = '';
        if (process.env.NEXT_PUBLIC_SITE_URL) {
            origin = process.env.NEXT_PUBLIC_SITE_URL;
        } else {
            const host = req.headers.get('host') || 'localhost:3000';
            const protocol = host.includes('localhost') ? 'http' : 'https';
            origin = `${protocol}://${host}`;
        }

        const webhookUrl = `${origin}/api/admin/bulk-scrape-item`;

        // Inject our secret environment variables
        const payload = {
            categoryUrl,
            webhookUrl,
            jobId,
            pageNum,
            delayMin,
            delayMax,
            mode,
            supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
            supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY
        };

        const res = await fetch(runBulkEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || 'Failed to trigger Render crawler');
        }

        const data = await res.json();
        return NextResponse.json({ success: true, ...data });

    } catch (error: any) {
        console.error('[Start Bulk Import Proxy Error]:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
