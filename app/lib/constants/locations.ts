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
    'Torontal',
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
    
    const nameCounts = new Map<string, number>();
    cities.forEach(c => {
        const nameLower = c.name.toLowerCase();
        nameCounts.set(nameLower, (nameCounts.get(nameLower) || 0) + 1);
    });

    const formatted = cities.map(c => {
        const countyName = countyMap.get(c.parent_id || '');
        const hasDuplicate = (nameCounts.get(c.name.toLowerCase()) || 0) > 1;
        return countyName && hasDuplicate ? `${c.name} (${countyName})` : c.name;
    });

    return Array.from(new Set(formatted));
}

export function cleanCityName(city: string): string {
    return city.replace(/\s*\(.*?\)\s*/g, '').trim();
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


