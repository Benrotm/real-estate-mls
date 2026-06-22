const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function run() {
    const apiKey = process.env.ROMIMO_API_KEY;
    const email = 'balandrea9@yahoo.com';

    try {
        console.log('Fetching Romimo token...');
        const tokenRes = await fetch(`https://services.romimo.ro/api/Token?ApiKey=${apiKey}`, {
            method: 'POST',
            headers: {
                'x-api-version': '2'
            }
        });
        const tokenText = await tokenRes.text();
        if (!tokenRes.ok) {
            console.error('Failed to get token:', tokenText);
            return;
        }

        const cleanToken = tokenText.replace(/^"|"$/g, '');

        // 1. Fetch /api/User/Package
        console.log(`\n1. Fetching User/Package for: ${email}`);
        const pRes = await fetch(`https://services.romimo.ro/api/User/Package?Email=${encodeURIComponent(email)}`, {
            method: 'GET',
            headers: {
                'x-api-version': '2',
                'Authorization': `Bearer ${cleanToken}`
            }
        });
        console.log('Status:', pRes.status);
        console.log('Body:', await pRes.text());

        // 2. Fetch /api/User/CompanyPackage
        console.log(`\n2. Fetching User/CompanyPackage for: ${email}`);
        const cpRes = await fetch(`https://services.romimo.ro/api/User/CompanyPackage?Email=${encodeURIComponent(email)}`, {
            method: 'GET',
            headers: {
                'x-api-version': '2',
                'Authorization': `Bearer ${cleanToken}`
            }
        });
        console.log('Status:', cpRes.status);
        console.log('Body:', await cpRes.text());

    } catch (e) {
        console.error('Error:', e);
    }
}
run();
