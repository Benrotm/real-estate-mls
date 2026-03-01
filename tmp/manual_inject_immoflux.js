
const fs = require('fs');

const html = fs.readFileSync('tmp/captured_immoflux.html', 'utf8');

fetch('https://imobum.com/api/admin/headless-dynamic-import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        url: 'https://blitz.immoflux.ro/ap/slidepanel/902455',
        selectors: {
            title: 'div.col-sm-12 > h3',
            price: 'span.blue-600',
            location_area: '.slidepanel-info strong'
        },
        html: html
    })
}).then(async r => {
    const res = await r.json();
    console.log('API Response:', JSON.stringify(res, null, 2));
}).catch(console.error);
