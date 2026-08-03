export const ROMANIAN_CITIES = [
    'Timișoara',
    'Dumbrăvița',
    'Giroc',
    'Ghiroda',
    'Moșnița Nouă',
    'Săcălaz',
    'Sânandrei',
    'Utvin',
    'Chisoda'
];

export const TIMISOARA_AREAS = [
    'Take Ionescu',
    'Circumvalațiunii',
    'Calea Aradului',
    'Calea Torontalului',
    'Calea Lipovei',
    'Complex Studențesc',
    'Buziașului',
    'Elisabetin',
    'Mehala',
    'Bucovina',
    'Freidorf',
    'Dâmbovița',
    'Telegrafului',
    'Calea Urseni',
    'Steaua',
    'Fabric',
    'Medicină',
    'Tipografilor',
    'Blașcovici',
    'UMT',
    'Fratelia',
    'Lunei',
    'Spitalul Județean',
    'Central',
    'Cetății',
    'Simion Bărnuțiu',
    'Traian',
    'Plopi',
    'Bălcescu',
    'Ronaț',
    'Badea Cârțan',
    'Lidia',
    'Brâncoveanu',
    'Favorit',
    'Calea Lugojului',
    'Bogdăneștilor',
    'Dorobanților',
    'Ciarda Roșie',
    'Ghirodei',
    'Braytim',
    'Soarelui',
    'Piața Maria',
    'Piața Unirii',
    'Sinaia',
    'Cetate',
    'Eso',
    'Planetei',
    'Vatra Satului'
].sort((a, b) => a.localeCompare(b, 'ro'));

export interface SystemCity {
    id: string;
    name: string;
    parent_id: string | null;
}

export interface SystemCounty {
    id: string;
    name: string;
}

/**
 * Formats a list of database cities to display "City (County)" ONLY if there are duplicate city names across counties.
 */
export function formatCityList(cities: SystemCity[], counties: SystemCounty[]): string[] {
    const countyMap = new Map(counties.map(c => [c.id, c.name]));
    
    const normCounts = new Map<string, number>();
    cities.forEach(c => {
        const norm = normalizeText(c.name);
        normCounts.set(norm, (normCounts.get(norm) || 0) + 1);
    });

    const formatted = cities.map(c => {
        const countyName = countyMap.get(c.parent_id || '');
        const hasDuplicate = (normCounts.get(normalizeText(c.name)) || 0) > 1;
        return countyName && hasDuplicate ? `${c.name} (${countyName})` : c.name;
    });

    return Array.from(new Set(formatted));
}

export function sanitizeLocationText(rawText: string): { city: string; area?: string; cleanText: string } {
    if (!rawText || typeof rawText !== 'string') {
        return { city: '', cleanText: '' };
    }

    let str = rawText.trim();

    // 1. Remove Phone Numbers (e.g. +40 727 884 182, +40727884182, 0727884182, etc.)
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

    // 3. Clean up whitespace & punctuation
    str = str.replace(/\s+/g, ' ').replace(/^[\s,._-]+|[\s,._-]+$/g, '').trim();

    // 4. Check for City - Area split (e.g., "Timisoara - Buziasului")
    let extractedCity = str;
    let extractedArea: string | undefined = undefined;

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

export function cleanCityName(city: string): string {
    if (!city) return '';
    const sanitized = sanitizeLocationText(city);
    return sanitized.city || city.replace(/\s*\(.*?\)\s*/g, '').trim();
}

/**
 * Normalizes text by stripping diacritics and converting to lowercase for diacritic-insensitive search/matching.
 */
export function normalizeText(str: string): string {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/ș|ş/gi, 's')
        .replace(/ț|ţ/gi, 't')
        .replace(/ă|â/gi, 'a')
        .replace(/î/gi, 'i')
        .replace(/đ/gi, 'd')
        .toLowerCase()
        .trim();
}


