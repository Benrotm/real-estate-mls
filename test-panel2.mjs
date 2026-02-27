import fetch from 'node-fetch';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function extract() {
    const username = process.env.IMMOFLUX_USERNAME || 'imobum.ro@gmail.com';
    const password = process.env.IMMOFLUX_PASSWORD || 'O%Qh%0N36%d8';

    // 1. Fetch login page to get CSRF token
    const loginPageRes = await fetch('https://blitz.immoflux.ro/login', {
        headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const loginHtml = await loginPageRes.text();
    const csrfMatch = loginHtml.match(/name="csrf-token" content="([^"]+)"/);
    const csrfToken = csrfMatch ? csrfMatch[1] : '';

    const initialCookies = loginPageRes.headers.raw()['set-cookie'];
    let cookieString = initialCookies ? initialCookies.map(c => c.split(';')[0]).join('; ') : '';

    // 2. Perform Login with redirect: manual
    const loginActionRes = await fetch('https://blitz.immoflux.ro/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cookie': cookieString,
            'User-Agent': 'Mozilla/5.0'
        },
        body: `_token=${csrfToken}&email=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
        redirect: 'manual'
    });

    const newCookies = loginActionRes.headers.raw()['set-cookie'];
    if (newCookies) {
        cookieString = newCookies.map(c => c.split(';')[0]).join('; ');
    }

    // 3. Fetch specific property slidepanel with AJAX headers
    const panelUrl = 'https://blitz.immoflux.ro/ap/slidepanel/912186';
    const panelRes = await fetch(panelUrl, {
        headers: {
            'Cookie': cookieString,
            'User-Agent': 'Mozilla/5.0',
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json, text/javascript, */*; q=0.01'
        }
    });

    const panelHtml = await panelRes.text();
    fs.writeFileSync('panel_html.txt', panelHtml);
    console.log("Wrote panel HTML length: " + panelHtml.length);
}
extract();
