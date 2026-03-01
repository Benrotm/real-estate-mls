const { chromium } = require('playwright');
require('dotenv').config({ path: '.env.local' });
(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
        await page.goto('https://blitz.immoflux.ro/approperties', { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('#inputEmail');
        await page.type('#inputEmail', process.env.IMMOFLUX_USER);
        await page.type('#inputPassword', process.env.IMMOFLUX_PASS);
        await Promise.all([
            page.waitForNavigation(),
            page.click('button[type="submit"]')
        ]);
        await page.goto('https://blitz.immoflux.ro/ap/slidepanel/913729', { waitUntil: 'domcontentloaded' });
        const html = await page.content();
        const fs = require('fs');
        fs.writeFileSync('immoflux_slidepanel.html', html);
        console.log('Saved HTML');
    } catch (e) { console.error(e); } finally { await browser.close(); }
})();
