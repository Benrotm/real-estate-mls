import * as cheerio from 'cheerio';

const rowHtml = `
<td class="cell-80">
    <a class="avatar avatar-big avatar-ap" data-toggle="slidePanel" data-url="https://blitz.immoflux.ro/ap/slidepanel/912186">
        <img src="https://apcdn.immoflux.ro/a/pic.jpg">
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
</td>
`;

const $ = cheerio.load(rowHtml);

const priceHtml = $('td:nth-child(2)').html() || '';
console.log("Raw HTML:");
console.log(priceHtml);

let listingType = 'For Sale';
let propertyType = 'Apartment';

const htmlLower = priceHtml.toLowerCase();

// Parse Transaction (Vanzare = For Sale, Inchiriere = For Rent)
if (htmlLower.includes('inchirier') || htmlLower.includes('închirier')) {
    listingType = 'For Rent';
} else if (htmlLower.includes('vanzar') || htmlLower.includes('vânzar')) {
    listingType = 'For Sale';
}

// Parse Property Category (Apartament, Casa, Teren, Spatiu, etc)
if (htmlLower.includes('cas') || htmlLower.includes('vil')) {
    propertyType = 'House';
} else if (htmlLower.includes('teren')) {
    propertyType = 'Land';
} else if (htmlLower.includes('spatiu comercial') || htmlLower.includes('spatiu industrial') || htmlLower.includes('birou')) {
    propertyType = 'Commercial';
} else if (htmlLower.includes('apartament') || htmlLower.includes('garsonier')) {
    propertyType = 'Apartment';
}

console.log("Parsed Listing Type:", listingType);
console.log("Parsed Property Type:", propertyType);
