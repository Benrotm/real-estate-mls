const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    page.on('pageerror', err => {
        console.log('PAGE EXCEPTION:', err.toString());
    });

    page.on('console', async msg => {
        const args = msg.args();
        const vals = [];
        for (let i = 0; i < args.length; i++) {
            try {
                vals.push(await args[i].jsonValue());
            } catch (e) {
                vals.push(args[i].toString());
            }
        }
        if (msg.type() === 'error') {
            console.log('BROWSER ERROR:', vals.length > 0 ? vals : msg.text());
        }
    });

    try {
        console.log('Navigating to lead page...');
        await page.goto('https://www.imobum.com/properties', { waitUntil: 'domcontentloaded', timeout: 30000 });
        console.log('Page loaded successfully.');
    } catch (e) {
        console.log('Execution error:', e);
    }
    
    await new Promise(r => setTimeout(r, 5000));
    await browser.close();
})();
