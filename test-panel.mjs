import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data: rawSetting } = await supabase.from('admin_settings').select('value').eq('key', 'immoflux_integration').single();
    const config = typeof rawSetting.value === 'string' ? JSON.parse(rawSetting.value) : rawSetting.value;

    const loginGetRes = await fetch('https://blitz.immoflux.ro/login', { headers: { 'User-Agent': 'Mozilla/5.0' } });
    let sessionCookie = loginGetRes.headers.get('set-cookie')?.split(';')[0] || '';
    const loginHtml = await loginGetRes.text();
    const $login = cheerio.load(loginHtml);
    const csrfToken = $login('meta[name="csrf-token"]').attr('content');

    const loginBody = new URLSearchParams();
    loginBody.set('_token', csrfToken);
    loginBody.set('email', config.username);
    loginBody.set('password', config.password);

    const authRes = await fetch('https://blitz.immoflux.ro/login', {
        method: 'POST',
        headers: { 'Cookie': sessionCookie, 'User-Agent': 'Mozilla/5.0', 'Content-Type': 'application/x-www-form-urlencoded' },
        body: loginBody.toString(),
        redirect: 'manual'
    });
    const authCookie = authRes.headers.get('set-cookie')?.split(';')[0];
    if (authCookie) sessionCookie += '; ' + authCookie;
    console.log('Auth status:', authRes.status);

    const dashRes = await fetch('https://blitz.immoflux.ro/approperties', { headers: { 'Cookie': sessionCookie, 'User-Agent': 'Mozilla/5.0' }, redirect: 'follow' });
    const dashHtml = await dashRes.text();
    const $ = cheerio.load(dashHtml);
    const dashCsrf = $('meta[name="csrf-token"]').attr('content') || '';

    const formFields = new URLSearchParams();
    $('form#filter :input').each((_, el) => {
        const name = $(el).attr('name');
        const val = $(el).val();
        if (name && val !== undefined) formFields.set(name, val.toString());
    });
    if (!formFields.has('_token')) formFields.set('_token', dashCsrf);
    formFields.set('page', '1');
    formFields.set('limit', '2');

    const listRes = await fetch('https://blitz.immoflux.ro/approperties/filterap', {
        method: 'POST',
        headers: {
            'Cookie': sessionCookie, 'User-Agent': 'Mozilla/5.0',
            'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json, text/javascript, */*; q=0.01', 'X-CSRF-TOKEN': dashCsrf
        },
        body: formFields.toString()
    });

    const listHtml = await listRes.text();

    // Dump first 3000 chars of raw response
    console.log('=== RAW AJAX RESPONSE (first 3000 chars) ===');
    console.log(listHtml.substring(0, 3000));
    console.log('\n=== END ===');
    console.log('Response length:', listHtml.length);

    // Try to find any data-url
    const $page = cheerio.load(listHtml);
    console.log('\nAll elements with data-url:');
    $page('[data-url]').each((i, el) => {
        console.log(i, ':', $page(el).attr('data-url'));
    });

    console.log('\nAll tr.model-item count:', $page('tr.model-item').length);
    console.log('All tr count:', $page('tr').length);

    // Try slidepanel URL pattern directly
    // Immoflux URL pattern: https://blitz.immoflux.ro/ap/slidepanel/{ID}
    const idMatches = listHtml.match(/slidepanel\/(\d+)/g);
    console.log('\nSlidePanel IDs found:', idMatches);

    if (idMatches && idMatches.length > 0) {
        const firstPanelUrl = 'https://blitz.immoflux.ro/ap/' + idMatches[0];
        console.log('\nFetching panel:', firstPanelUrl);
        const panelRes = await fetch(firstPanelUrl, { headers: { 'Cookie': sessionCookie, 'User-Agent': 'Mozilla/5.0' } });
        const panelHtml = await panelRes.text();
        console.log('\n=== PANEL HTML (first 5000 chars) ===');
        console.log(panelHtml.substring(0, 5000));
        console.log('\n=== END ===');
    }
}
run().catch(console.error);
