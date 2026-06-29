const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('BROWSER ERROR:', msg.text());
        }
    });

    page.on('pageerror', err => {
        console.log('PAGE EXCEPTION:', err.toString());
    });

    try {
        await page.goto('http://localhost:3000/properties', { waitUntil: 'networkidle0' });
        console.log('Page loaded successfully.');
    } catch (e) {
        console.log('Navigation error:', e);
    }
    
    await browser.close();
})();
