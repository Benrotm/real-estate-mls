const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function run() {
    const apiKey = (process.env.ROMIMO_API_KEY || '').trim() + '  ';
    const email = 'felicia.demenovschi@gmail.com';

    try {
        // 1. Get Token
        console.log('Fetching Romimo token...');
        const tokenRes = await fetch(`https://services.romimo.ro/api/Token?ApiKey=${apiKey}`, {
            method: 'POST',
            headers: {
                'x-api-version': '2'
            }
        });
        const tokenText = await tokenRes.text();
        console.log('Token response status:', tokenRes.status);
        console.log('Token response:', tokenText);

        if (tokenRes.ok) {
            const cleanToken = tokenText.replace(/^"|"$/g, '');
            // 2. Fetch Package
            console.log(`\nFetching package info for email: ${email}...`);
            const pkgRes = await fetch(`https://services.romimo.ro/api/User/Package?Email=${encodeURIComponent(email)}`, {
                method: 'GET',
                headers: {
                    'x-api-version': '2',
                    'Authorization': `Bearer ${cleanToken}`
                }
            });
            console.log('Package response status:', pkgRes.status);
            const pkgText = await pkgRes.text();
            console.log('Package response body:', pkgText);
        }
    } catch (e) {
        console.error('Error:', e);
    }
}
run();
