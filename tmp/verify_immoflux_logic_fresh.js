
const cheerio = require('cheerio');

const html = `
<div class="slidepanel-info">
    Status: <strong> <span class="label bg-green-600">Activa</span></strong>
    <br>Tip:  <strong>Apartament</strong>
    <br>Zona: <strong>Lipovei</strong>
    <div class="hide-on-private">
        Adresa:  <a href="https://www.google.com/maps/search/?api=1&query=45.755539,21.237499" target="_blank">TM Timisoara</a>
    </div>
</div>
`;

const $ = cheerio.load(html);
const data = {
    location_area: 'Activa', // Simulate generic mapping result
    location_city: 'TM Timisoara'
};

const infoText = $('.slidepanel-info').text().trim();
console.log('Info Text:', infoText);

const noise = ['activa', 'apartament', 'casa', 'vila', 'teren', 'spatiu', 'status:', 'tip:', 'portaluri', 'adresa:'];
const filterNoise = (val) => {
    if (!val || typeof val !== 'string') return '';
    const clean = val.trim();
    const lower = clean.toLowerCase();
    if (noise.some(n => lower === n || lower.includes(n))) {
        if (lower === 'activa' || lower === 'activa ') return '';
        if (lower.startsWith('status:') || lower.startsWith('tip:')) return '';
    }
    return clean;
};

const getLabelValue = (label, stops) => {
    const regex = new RegExp(`${label}\\s*:?\\s*([\\s\\S]+?)(?:${stops.join('|')}|$)`, 'i');
    console.log('Regex for', label, ':', regex);
    const match = infoText.match(regex);
    return match ? match[1].trim() : '';
};

data.location_area = filterNoise(data.location_area || '');
data.location_city = filterNoise(data.location_city || '');

console.log('After initial filter:', { area: data.location_area, city: data.location_city });

const cityRaw = getLabelValue('Adresa', ['Portaluri', 'Telefon', 'Status']) || data.location_city;
const areaRaw = getLabelValue('Zona', ['Adresa', 'Portaluri', 'Telefon', 'Status']) || data.location_area;

console.log('Raw values from regex:', { cityRaw, areaRaw });

const cityValue = filterNoise(cityRaw);
const areaValue = filterNoise(areaRaw);

if (cityValue || areaValue) {
    if (cityValue) {
        let cleanCity = cityValue;
        if (cleanCity.toLowerCase().startsWith('tm ')) {
            cleanCity = cleanCity.replace(/^tm\s+/i, '').trim();
        }
        data.location_city = cleanCity;
    }
    if (areaValue) {
        data.location_area = areaValue;
    }
}

const addrParts = [data.location_area, data.location_city, 'Timis', 'Romania'].filter(Boolean);
data.address = addrParts.join(', ');

console.log('FINAL DATA:', data);
