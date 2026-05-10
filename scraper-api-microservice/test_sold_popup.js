const { chromium } = require('playwright');
require('dotenv').config({ path: '../.env.local' });

(async () => {
    const browser = await chromium.launch({ headless: true });
    try {
        const context = await browser.newContext();
        await context.addInitScript(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
        });

        const page = await context.newPage();
        console.log("Logging in...");
        await page.goto('https://blitz.immoflux.ro/login', { waitUntil: 'load' });
        await page.fill('#inputEmail', process.env.IMMOFLUX_USER || 'benoni.silion@blitz-timisoara.ro');
        await page.fill('#inputPassword', process.env.IMMOFLUX_PASS || 'EDwohI#6Oi');
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle' }),
            page.click('button[type="submit"]')
        ]);

        const targetUrl = 'https://blitz.immoflux.ro/properties/159710/slidepanel';
        console.log("Navigating to: " + targetUrl);
        await page.goto(targetUrl, { waitUntil: 'networkidle' });

        const fullText = await page.evaluate(() => document.body.innerText);
        console.log("--- FULL TEXT EXTRACT ---");
        console.log(fullText.substring(0, 1000));
        console.log("--- END TEXT ---");

        const desc = await page.evaluate(() => {
            const root = document.querySelector('.slidePanel') || document.body;
            const ft = root.textContent || '';
            const match = ft.match(/Descriere\s*:?\s*([\s\S]+?)(?:\s+Detalii suplimentare|\s+Caracteristici|\s+Dotari|\s*Zona|$)/i);
            return match ? match[1].trim() : 'FAILED';
        });
        console.log("Extracted Description: ", desc);

        const agent = await page.evaluate(() => {
            const root = document.querySelector('.slidePanel') || document.body;
            const ft = root.textContent || '';
            const match = ft.match(/Agent(?:\s*imobiliar)?\s*(?:[:|-]?)\s*([A-Za-zĂăÂâÎîȘșȚț\s]{3,30})/i);
            return match ? match[1].trim() : 'FAILED';
        });
        console.log("Extracted Agent: ", agent);

    } catch (e) {
        console.error(e);
    } finally {
        await browser.close();
    }
})();
