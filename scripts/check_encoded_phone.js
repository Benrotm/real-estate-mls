const fs = require('fs');

function run() {
    const html = fs.readFileSync('test_publi24_third.html', 'utf8');

    // Check if the actual phone number is embedded in some encoded form
    const phone = '0741240401';

    // Test base64 encoding
    const b64 = Buffer.from(phone).toString('base64');
    console.log('Base64:', b64);
    if (html.includes(b64.replace('==', ''))) {
        console.log('Found Base64 string in HTML!');
    }

    // Test basic obfuscation, e.g. reversed
    const rev = phone.split('').reverse().join('');
    if (html.includes(rev)) {
        console.log('Found Reversed string in HTML!');
    }

    // Search for array of characters (like [48, 55, 52...])
    const charCodes = phone.split('').map(c => c.charCodeAt(0)).join(',');
    if (html.includes(charCodes)) {
        console.log('Found char code array in HTML!');
    }

    // Look for data-url or action attributes on the phone container
    const match = html.match(/<[^>]*class="[^"]*show-phone[^>]*>/g);
    console.log('\nPhone button elements:');
    if (match) {
        match.forEach(m => console.log(m));
    }

    // Look for global variables holding phone stuff
    const scripts = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
    if (scripts) {
        scripts.forEach(s => {
            if (s.includes('phone') || s.includes('telefon') || s.includes('contact')) {
                // Find anything that looks like an endpoint
                const endpoints = s.match(/['"](\/[a-zA-Z0-9_\-\/]+)['"]/g);
                if (endpoints && s.includes('telefon')) {
                    console.log('\nEndpoints in script with "telefon":', endpoints);
                }
            }
        });
    }
}
run();
