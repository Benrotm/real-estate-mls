const https = require('https');

async function fetchAjax(path) {
    return new Promise((resolve, reject) => {
        const url = 'https://www.publi24.ro' + path;
        console.log('Fetching', url);
        https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': '*/*'
            }
        }, (res) => {
            let data = Buffer.from([]);
            res.on('data', chunk => data = Buffer.concat([data, chunk]));
            res.on('end', () => {
                resolve({ status: res.statusCode, headers: res.headers, body: data });
            });
        }).on('error', reject);
    });
}

async function run() {
    // Both endpoints often used by publi24 for phone tracking/loading
    const hitRes = await fetchAjax('/DetailAd/IncrementPhoneHit/10207bf2-6761-4106-a39e-7b599354a4c3');
    console.log('Hit Status:', hitRes.status);
    console.log('Hit Content-Type:', hitRes.headers['content-type']);
    console.log('Hit Body (first 100 bytes):', hitRes.body.toString('utf8').substring(0, 100));

    // Also check the specific image endpoint used on other listings
    // Usually it needs the exact listing ID. The URL ID was 43530e... but the internal GUID is 10207bf2...
    const imgRes = await fetchAjax('/DetailAd/PhoneNumberImages/10207bf2-6761-4106-a39e-7b599354a4c3');
    console.log('\nImg Status:', imgRes.status);
    console.log('Img Content-Type:', imgRes.headers['content-type']);
    if (imgRes.headers['content-type'] && imgRes.headers['content-type'].includes('application/json')) {
        console.log('Img JSON:', imgRes.body.toString('utf8').substring(0, 200));
    }
}
run();
