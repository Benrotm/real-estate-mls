import { Client } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

let dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
    console.error('DATABASE_URL is not set in .env.local');
    process.exit(1);
}

// Convert pooler URL to direct database connection if pooler is used
if (dbUrl.includes('pooler.supabase.com')) {
    dbUrl = dbUrl.replace('postgres.cwfhcrftwsxsovexkero', 'postgres')
                 .replace('aws-0-eu-central-1.pooler.supabase.com', 'db.cwfhcrftwsxsovexkero.supabase.co');
}

const client = new Client({
    connectionString: dbUrl,
    ssl: {
        rejectUnauthorized: false
    }
});

const DEFAULT_MODELS = {
    "zero-seller": {
        nm: "0% Vânzător",
        desc: "Vânzătorul nu plătește comision. Fără Reprezentare Exclusivă, serviciile se plătesc doar Separat. Cu exclusivitate, serviciile pot fi incluse în comision.",
        sb: 0.0,
        bb: 2.50,
        pri: "buyer"
    },
    "seller": {
        nm: "0% Cumpărător",
        desc: "Comisionul total plătit de vânzător. Cumpărătorul nu are costuri de agenție — avantaj competitiv major care atrage mai mulți cumpărători calificați.",
        sb: 2.00,
        bb: 0.0,
        pri: "seller"
    },
    "both": {
        nm: "Ambele părți egal",
        desc: "Comisionul împărțit egal între vânzător și cumpărător. Serviciile și exclusivitatea ajustează cota vânzătorului.",
        sb: 1.50,
        bb: 1.50,
        pri: "seller"
    }
};

const DEFAULT_TIERS = [
    { lbl: "până la 50.000€", max: 50000, f: 1.00 },
    { lbl: "50.001–100.000€", max: 100000, f: 0.95 },
    { lbl: "100.001–150.000€", max: 150000, f: 0.90 },
    { lbl: "150.001–200.000€", max: 200000, f: 0.85 },
    { lbl: "200.001–250.000€", max: 250000, f: 0.80 },
    { lbl: "250.001–300.000€", max: 300000, f: 0.75 },
    { lbl: "300.001–350.000€", max: 350000, f: 0.70 },
    { lbl: "350.001–400.000€", max: 400000, f: 0.65 },
    { lbl: "400.001–500.000€", max: 500000, f: 0.58 },
    { lbl: "500.001–600.000€", max: 600000, f: 0.52 },
    { lbl: "600.001–700.000€", max: 700000, f: 0.46 },
    { lbl: "700.001–800.000€", max: 800000, f: 0.41 },
    { lbl: "800.001–900.000€", max: 900000, f: 0.37 },
    { lbl: "900.001–1.000.000€", max: 1000000, f: 0.33 },
    { lbl: "1.000.001–1.100.000€", max: 1100000, f: 0.30 },
    { lbl: "1.100.001–1.200.000€", max: 1200000, f: 0.27 },
    { lbl: "1.200.001–1.400.000€", max: 1400000, f: 0.23 },
    { lbl: "1.400.001–1.600.000€", max: 1600000, f: 0.19 },
    { lbl: "1.600.001–1.800.000€", max: 1800000, f: 0.16 },
    { lbl: "1.800.001–2.000.000€", max: 2000000, f: 0.14 },
    { lbl: "peste 2.000.000€", max: 999999999999, f: 0.11 }
];

const DEFAULT_PERIODS = [
    { d: 30, lbl: "30 zile", c: 0.10, note: "Perioadă scurtă — risc crescut pentru agenție, comision ușor majorat (+0.10%)" },
    { d: 60, lbl: "60 zile", c: 0.00, note: "Standard — fără ajustare de comision (0.00%)" },
    { d: 90, lbl: "90 zile", c: -0.20, note: "Garanție bună — tranzacție mai sigură, reducere comision (−0.20%)" },
    { d: 180, lbl: "180 zile", c: -0.35, note: "Angajament solid — reducere semnificativă de comision (−0.35%)" },
    { d: 270, lbl: "270 zile", c: -0.45, note: "Exclusivitate extinsă — tranzacție practic asigurată, reducere mare (−0.45%)" },
    { d: 360, lbl: "360 zile", c: -0.55, note: "Parteneriat anual — cel mai înalt nivel de angajament, reducere maximă (−0.55%)" }
];

const CA_DEFAULT = { "zero-seller": true, "seller": true, "both": true };

const DEFAULT_SERVICES = [
    { id: "s0", cat: "Listare & Promovare", nm: "Listare platforme principale", dc: "Storia, OLX, Imobiliare.ro, Publi24, Romimo", cost: 0, coef: 0, on: true, always: true, pay: "commission", commAvail: { ...CA_DEFAULT } },
    { id: "s1", cat: "", nm: "Fotografii profesionale", dc: "20–30 cadre, post-procesare inclusă", cost: 300, coef: 0.15, on: false, pay: "commission", commAvail: { ...CA_DEFAULT } },
    { id: "s2", cat: "", nm: "Tur virtual 360°", dc: "Vizualizare imersivă online pentru cumpărători la distanță", cost: 250, coef: 0.10, on: false, pay: "commission", commAvail: { ...CA_DEFAULT } },
    { id: "s3", cat: "", nm: "Video walk-through / Reels", dc: "Prezentare video pentru social media și YouTube", cost: 350, coef: 0.15, on: false, pay: "commission", commAvail: { ...CA_DEFAULT } },
    { id: "s4", cat: "", nm: "Drone footage", dc: "Filmări aeriene exterior, cartier și zonă rezidențială", cost: 250, coef: 0.10, on: false, pay: "commission", commAvail: { ...CA_DEFAULT } },
    { id: "s5", cat: "", nm: "Preluare în Portofoliul Agenției", dc: "Proprietatea devine parte din oferta activă Real Estate Hub", cost: 20, coef: 0.10, on: false, pay: "commission", commAvail: { ...CA_DEFAULT } },
    { id: "s6", cat: "", nm: "Prezentarea Proprietății cu Prioritate clienților", dc: "Prezentare activă și prioritară către clienții agenției aflați în căutare", cost: 20, coef: 0.10, on: false, pay: "commission", commAvail: { ...CA_DEFAULT } },
    { id: "s7", cat: "", nm: "Adăugarea în portofoliul celor peste 200 de agenți colaboratori din Timișoara", dc: "Acces la rețeaua completă de agenți parteneri din Timișoara și zonă metropolitană", cost: 20, coef: 0.10, on: false, pay: "commission", commAvail: { ...CA_DEFAULT } },
    { id: "s8", cat: "", nm: "Publicare pe social media", dc: "Publicare pe paginile și profilurile Real Estate Hub", cost: 20, coef: 0.10, on: false, pay: "commission", commAvail: { ...CA_DEFAULT } },
    { id: "s9", cat: "", nm: "Publicare pe grupuri de profil pe Social Media și WhatsApp", dc: "Distribuire în grupuri specializate de imobiliare din Timișoara și județ", cost: 20, coef: 0.10, on: false, pay: "commission", commAvail: { ...CA_DEFAULT } },
    { id: "s10", cat: "", nm: "Campanie plătită pe social media (Facebook + Instagram + TikTok)", dc: "Campanie targetată cu buget publicitar inclus", cost: 400, coef: 0.15, on: false, pay: "commission", commAvail: { ...CA_DEFAULT } },
    { id: "s11", cat: "", nm: "Evenimente Open House", dc: "Organizarea și promovarea evenimentelor de vizionare deschisă", cost: 20, coef: 0.10, on: false, pay: "commission", commAvail: { ...CA_DEFAULT } },
    { id: "s12", cat: "Pregătire proprietate", nm: "Home staging (pregătirea proprietății pentru Listare)", dc: "Consultanță și aranjare optimă a spațiului înainte de sesiunea foto", cost: 200, coef: 0.10, on: false, pay: "commission", commAvail: { ...CA_DEFAULT } },
    { id: "s13", cat: "Analiză & Evaluare", nm: "Analiză comparativă de piață (ACP)", dc: "Raport prețuri similare, poziționare optimă a prețului de listare", cost: 150, coef: 0.10, on: false, pay: "commission", commAvail: { ...CA_DEFAULT } },
    { id: "s14", cat: "", nm: "Evaluare preț proprietate ANEVAR", dc: "Evaluare oficială realizată de evaluator autorizat ANEVAR", cost: 20, coef: 0.10, on: false, pay: "commission", commAvail: { ...CA_DEFAULT } },
    { id: "s15", cat: "Calificare & Negociere", nm: "Precalificare cumpărători", dc: "Verificare venituri, angajator și eligibilitate credit înainte de vizionare", cost: 20, coef: 0.10, on: false, pay: "commission", commAvail: { ...CA_DEFAULT } },
    { id: "s16", cat: "Juridic & Acte", nm: "Verificare juridică proprietate", dc: "Extras CF, ipoteci, sarcini, istoricul proprietarilor", cost: 300, coef: 0.10, on: false, pay: "commission", commAvail: { ...CA_DEFAULT } },
    { id: "s17", cat: "", nm: "Asistență completă notar", dc: "Coordonare, pregătire acte și prezență la semnare", cost: 20, coef: 0.05, on: false, pay: "commission", commAvail: { ...CA_DEFAULT } },
    { id: "s18", cat: "Monitorizare & Raportare", nm: "Raport vizionări + dashboard live", dc: "Feedback bi-săptămânal, statistici anunț și competiție", cost: 20, coef: 0.05, on: false, pay: "commission", commAvail: { ...CA_DEFAULT } },
    { id: "s19", cat: "Servicii conexe", nm: "Consiliere creditare cumpărători", dc: "Conectare bancă, Noua Casă, comparare oferte de la parteneri bancari", cost: 20, coef: 0.05, on: false, pay: "commission", commAvail: { ...CA_DEFAULT } },
    { id: "s20", cat: "", nm: "Asistență post-vânzare", dc: "Conectarea cu orice serviciu, meșteșugar sau furnizor necesar", cost: 20, coef: 0.05, on: false, pay: "commission", commAvail: { ...CA_DEFAULT } }
];

async function applyCalculatorMigration() {
    try {
        await client.connect();
        console.log('Connected to database successfully.');

        // 1. Create table
        console.log('Creating table public.calculator_settings...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS public.calculator_settings (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                setting_key TEXT UNIQUE NOT NULL,
                setting_value JSONB NOT NULL,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
                updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
            );
        `);
        console.log('Table calculator_settings is ready.');

        // 2. Enable RLS
        console.log('Enabling Row Level Security...');
        await client.query(`
            ALTER TABLE public.calculator_settings ENABLE ROW LEVEL SECURITY;
            
            DROP POLICY IF EXISTS "Public read access to calculator settings" ON public.calculator_settings;
            DROP POLICY IF EXISTS "Admins can manage calculator settings" ON public.calculator_settings;

            CREATE POLICY "Public read access to calculator settings" 
            ON public.calculator_settings
            FOR SELECT USING (true);

            CREATE POLICY "Admins can manage calculator settings"
            ON public.calculator_settings
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE public.profiles.id = auth.uid()
                    AND public.profiles.role IN ('admin', 'super_admin')
                )
            );
        `);
        console.log('RLS policies established.');

        // 3. Seed Default Values
        console.log('Seeding default calculator settings...');
        const seedData = [
            { key: 'commission_models', value: DEFAULT_MODELS },
            { key: 'value_tiers', value: DEFAULT_TIERS },
            { key: 'exclusivity_periods', value: DEFAULT_PERIODS },
            { key: 'services', value: DEFAULT_SERVICES }
        ];

        for (const seed of seedData) {
            console.log(`Upserting key "${seed.key}"...`);
            await client.query(`
                INSERT INTO public.calculator_settings (setting_key, setting_value)
                VALUES ($1, $2)
                ON CONFLICT (setting_key) 
                DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = now();
            `, [seed.key, JSON.stringify(seed.value)]);
        }
        
        // Reload schema just in case PostgREST cache needs it
        await client.query("NOTIFY pgrst, 'reload schema';");
        console.log('Database successfully seeded and reloaded!');

    } catch (err) {
        console.error('Error executing migration & seed:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

applyCalculatorMigration();
