import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testPage() {
    const targetUrl = 'https://blitz.immoflux.ro/approperties';
    const filterapUrl = 'https://blitz.immoflux.ro/approperties/filterap';
    const username = process.env.IMMOFLUX_USERNAME || 'imobum.ro@gmail.com';
    const password = process.env.IMMOFLUX_PASSWORD || 'O%Qh%0N36%d8';

    // 1. Fetch login page to get CSRF token
    const loginPageRes = await fetch('https://blitz.immoflux.ro/login', {
        headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const loginHtml = await loginPageRes.text();
    let $ = cheerio.load(loginHtml);
    const csrfToken = $('input[name="_token"]').val();

    // Capture initial session cookies
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

    // 3. Fetch properties dashboard to get default form filters
    const testDashboardPage = await fetch(targetUrl, {
        headers: { 'Cookie': cookieString, 'User-Agent': 'Mozilla/5.0' }
    });

    $ = cheerio.load(await testDashboardPage.text());

    const formFields = new URLSearchParams();
    $('form#ad-filter-form *').filter(':input').each((i, el) => {
        const name = $(el).attr('name');
        const val = $(el).val();
        if (name && val !== undefined) {
            formFields.append(name, Array.isArray(val) ? val[0] || '' : String(val));
        }
    });

    // TEST: Add pagination parameters
    // TEST 1: Page 1
    formFields.set('page', '1');
    formFields.set('limit', '5');

    // 4. Submit AJAX Filter
    const listRes1 = await fetch(filterapUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Cookie': cookieString,
            'User-Agent': 'Mozilla/5.0',
            'X-Requested-With': 'XMLHttpRequest',
            'Referer': targetUrl
        },
        body: formFields.toString()
    });

    const listHtml1 = await listRes1.text();
    $ = cheerio.load(listHtml1);
    console.log("FIRST ROW ON PAGE 1:");
    console.log($('tr.model-item').first().text().substring(0, 150).trim().replace(/\s+/g, ' '));

    // TEST 2: Page 2
    formFields.set('page', '2');
    const listRes2 = await fetch(filterapUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Cookie': cookieString,
            'User-Agent': 'Mozilla/5.0',
            'X-Requested-With': 'XMLHttpRequest',
            'Referer': targetUrl
        },
        body: formFields.toString()
    });

    const listHtml2 = await listRes2.text();
    $ = cheerio.load(listHtml2);
    console.log("FIRST ROW ON PAGE 2:");
    console.log($('tr.model-item').first().text().substring(0, 150).trim().replace(/\s+/g, ' '));
}
testPage();
