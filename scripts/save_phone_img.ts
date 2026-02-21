import { chromium } from 'playwright';
import fs from 'fs';

async function run() {
    const url = 'https://www.publi24.ro/anunturi/imobiliare/de-vanzare/apartamente/apartamente-2-camere/anunt/denya-forest-7-bloc-nzeb-apartament-2-camere-comision-0/43530ei590947439d62h0e822687d7f6.html';
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });
    const page = await context.newPage();

    page.on('response', async (res) => {
        if (res.url().includes('PhoneNumberImages')) {
            try {
                const buffer = await res.body();
                const htmlStr = buffer.toString('utf8').trim();
                if (htmlStr.startsWith('iVBOR')) {
                    const imgBuf = Buffer.from(htmlStr, 'base64');
                    fs.writeFileSync('phone_debug.png', imgBuf);
                    console.log('Saved phone_debug.png');
                }
            } catch (e) { }
        }
    });

    await page.goto(url, { waitUntil: 'domcontentloaded' });
    const button = await page.$('.show-phone-number button[data-action="phone"]');
    if (button) {
        await button.click();
        await page.waitForTimeout(2000);
    }
    await browser.close();
}
run();
