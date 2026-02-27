import * as cheerio from 'cheerio';
import fs from 'fs';

// Simulated raw property row text based on our previous server log dumps
const rowHtml = `
<td class="cell-80">
    <a class="avatar avatar-big avatar-ap" data-toggle="slidePanel" data-url="https://blitz.immoflux.ro/ap/slidepanel/912186">
        <img src="https://apcdn.immoflux.ro/a/91e67f54f9a463aa941345508586bc0f/crop/300x300/ap/912186/177214123069a0baae2cc06.jpg">
    </a>
    <span class="label bg-green-600">Activa</span>
</td>
<td>
    <span class="blue-600 text-nowrap"><strong>130.000€ </strong></span><br>
    Vanzare<br>
    Apartament<br>
    <div class="text-muted text-table-small">
        APX912186
    </div>
</td>
<td>
    <strong><i class="icon wb-map" aria-hidden="true"></i> TM Timisoara, Aradului<br></strong>
    Apartament 3 camere 2 bai (intre Aradului Torontalului) | Liniste si Confort<br>
    <div class="text-muted text-table-small table-text-short text-table-expandable">
        Vand apartament in Timisoara, situat intre Calea Aradului si Calea Torontalului
    </div>
</td>
`;

const $ = cheerio.load(rowHtml);

const priceText = $('td:nth-child(2) span.blue-600 strong').text().trim();
console.log("Original Price Text:", priceText);

let price = 0;
const priceMatch = priceText.match(/[\d,.]+/);
if (priceMatch) price = parseInt(priceMatch[0].replace(/[,.]/g, ''), 10);

let currency = 'EUR';
if (priceText.toLowerCase().includes('ron') || priceText.toLowerCase().includes('lei')) {
    currency = 'RON';
}
console.log("Parsed Price:", price);
console.log("Parsed Currency:", currency);

// Location usually looks like `TM Timisoara, Aradului` or just `TM Timisoara`
const locationText = $('td:nth-child(3) strong').text().trim();
console.log("Original Location Text:", locationText);

let finalLocation = 'Timisoara';
// Clean up the `TM ` prefix if it exists
let cleanedLocation = locationText.replace(/^TM\s+/i, '').trim();

if (cleanedLocation) {
    // If it has a comma, it usually means City, Zone
    finalLocation = cleanedLocation;
}
console.log("Final Location String:", finalLocation);
