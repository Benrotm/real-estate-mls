const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    // Catch page errors
    page.on('pageerror', err => {
        console.log('PAGE EXCEPTION:', err.toString());
    });

    // Catch unhandled rejections
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('BROWSER ERROR:', msg.text());
        }
    });

    try {
        console.log('Navigating...');
        await page.goto('http://localhost:3000/properties', { waitUntil: 'networkidle0' });
        
        console.log('Clicking Map View button...');
        // Find the button that switches to map view
        const buttons = await page.$$('button');
        let clicked = false;
        for (let btn of buttons) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text && text.includes('Map')) {
                await btn.click();
                clicked = true;
                break;
            }
        }
        
        if (clicked) {
            console.log('Clicked Map View. Waiting for 3 seconds...');
            await new Promise(r => setTimeout(r, 3000));
        } else {
            console.log('Could not find Map button');
        }

    } catch (e) {
        console.log('Navigation/Execution error:', e);
    }
    
    await browser.close();
})();
