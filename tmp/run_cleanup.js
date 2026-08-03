const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    const envPath = path.join(__dirname, '..', '.env.local');
    if (fs.existsSync(envPath)) {
        const envText = fs.readFileSync(envPath, 'utf8');
        envText.split('\n').forEach(line => {
            const [k, v] = line.split('=');
            if (k && v) {
                if (k.trim() === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = v.trim();
                if (k.trim() === 'SUPABASE_SERVICE_ROLE_KEY') serviceKey = v.trim();
            }
        });
    }
}

if (!supabaseUrl || !serviceKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

function sanitizeLocationText(rawText) {
    if (!rawText || typeof rawText !== 'string') {
        return { city: '', cleanText: '' };
    }

    let str = rawText.trim();

    // 1. Remove Phone Numbers
    str = str.replace(/(\+?40|\b07)\s*[\d\s.-]{7,15}\d/gi, ' ');
    str = str.replace(/\+?[\d\s.-]{9,15}/g, ' ');

    // 2. Remove Site & Platform Source Tags & noise words
    const noisePatterns = [
        /\b(storia|olx|romimo|imobiliare|publi24|immoflux|fluxmls|lajumate|anunturi)\b/gi,
        /\b(whatsapp|wa\.me|viber|telegram)\b/gi,
        /\b(status|activa|inactiva|inactiv|tip|portaluri|adresa|zona)\s*:?/gi,
        /^tm[\s._-]+/i,
        /\btm\s+(?=timisoara|giroc|dumbravita|ghiroda|mosnita)/gi
    ];

    for (const pattern of noisePatterns) {
        str = str.replace(pattern, ' ');
    }

    str = str.replace(/\s+/g, ' ').replace(/^[\s,._-]+|[\s,._-]+$/g, '').trim();

    let extractedCity = str;
    let extractedArea = undefined;

    if (str.includes(' - ')) {
        const parts = str.split(' - ').map(p => p.trim()).filter(Boolean);
        if (parts.length >= 2) {
            extractedCity = parts[0];
            extractedArea = parts[1];
        }
    } else if (str.includes('-') && !str.toLowerCase().includes('cluj-napoca')) {
        const parts = str.split('-').map(p => p.trim()).filter(Boolean);
        if (parts.length >= 2) {
            extractedCity = parts[0];
            extractedArea = parts[1];
        }
    }

    extractedCity = extractedCity.replace(/\s*\(.*?\)\s*/g, '').trim();

    return {
        city: extractedCity,
        area: extractedArea,
        cleanText: str
    };
}

async function main() {
    console.log('Fetching ALL properties in batches of 1000 to clean location fields...');

    let page = 0;
    const pageSize = 1000;
    let totalCleaned = 0;
    let totalChecked = 0;

    const noiseRegex = /(storia|olx|romimo|imobiliare|publi24|immoflux|whatsapp|\+40|\b07\d{8})/i;

    while (true) {
        const start = page * pageSize;
        const end = start + pageSize - 1;
        console.log(`Fetching properties range ${start} to ${end}...`);

        const { data: properties, error } = await supabase
            .from('properties')
            .select('id, title, location_city, location_area, location_county, address')
            .range(start, end);

        if (error) {
            console.error('Error fetching batch:', error);
            break;
        }

        if (!properties || properties.length === 0) {
            console.log('No more properties found in range.');
            break;
        }

        totalChecked += properties.length;
        console.log(`Batch ${page + 1}: Received ${properties.length} properties.`);

        for (const prop of properties) {
            const currentCity = prop.location_city || '';
            const currentArea = prop.location_area || '';
            const currentAddress = prop.address || '';

            const needsCleaning = noiseRegex.test(currentCity) || noiseRegex.test(currentArea) || noiseRegex.test(currentAddress) || currentCity.toLowerCase().startsWith('tm ');

            if (!needsCleaning) continue;

            const citySan = sanitizeLocationText(currentCity);
            let newCity = citySan.city || 'Timisoara';
            let newArea = currentArea;

            if (!newArea && citySan.area) {
                newArea = citySan.area;
            }

            if (newArea) {
                newArea = sanitizeLocationText(newArea).cleanText;
            }

            const addrParts = [newArea, newCity, prop.location_county || 'Timis', 'Romania'].filter(Boolean);
            const newAddress = sanitizeLocationText(addrParts.join(', ')).cleanText;

            const { error: updateErr } = await supabase
                .from('properties')
                .update({
                    location_city: newCity,
                    location_area: newArea,
                    address: newAddress,
                    updated_at: new Date().toISOString()
                })
                .eq('id', prop.id);

            if (updateErr) {
                console.error(`Failed updating property ${prop.id}:`, updateErr);
            } else {
                totalCleaned++;
                console.log(`[CLEANED #${prop.id}] City: "${currentCity}" -> "${newCity}" | Area: "${currentArea}" -> "${newArea}"`);
            }
        }

        page++;
    }

    console.log(`Finished ALL pages! Checked ${totalChecked} properties. Total properties cleaned: ${totalCleaned}`);
}

main();
