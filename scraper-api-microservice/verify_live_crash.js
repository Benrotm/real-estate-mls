const { chromium } = require('playwright');
require('dotenv').config({ path: '../.env.local' });

(async () => {
    const browser = await chromium.launch({ headless: true });
    try {
        const context = await browser.newContext();
        const page = await context.newPage();
        
        // Log errors
        page.on('response', response => {
            if (!response.ok() && response.url().includes('start-dynamic-import-sold')) {
                console.log(`❌ Failed Response: ${response.url()} [${response.status()}]`);
                response.text().then(t => console.log('Body:', t)).catch(e => {});
            }
        });
        
        page.on('pageerror', err => console.log('Browser Error:', err));

        console.log("Logging into Imobum locally...");
        await page.goto('http://localhost:3000/login');
        await page.fill('input[type="email"]', 'benoni.silion@blitz-timisoara.ro');
        await page.fill('input[type="password"]', 'EDwohI#6Oi');
        await page.click('button[type="submit"]');

        await page.waitForTimeout(5000);
        
        console.log("Navigating to immoflux sold dashboard locally...");
        await page.goto('http://localhost:3000/dashboard/admin/sold-immoflux', { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(5000);
        
        console.log("Clicking start scraper...");
        await page.click('button:has-text("Start Scraper")');
        
        // Wait to capture errors
        await page.waitForTimeout(5000);
        
        console.log("Test finished.");
    } catch(e) {
        console.error("Test execution failed:", e);
    } finally {
        await browser.close();
    }
})();
