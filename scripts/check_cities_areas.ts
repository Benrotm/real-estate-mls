import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function run() {
    const client = new Client({
        host: `db.cwfhcrftwsxsovexkero.supabase.co`,
        port: 5432,
        user: 'postgres',
        password: "Imobum2026!",
        database: 'postgres',
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        
        console.log("--- DISTINCT CITIES IN PROPERTIES ---");
        const citiesRes = await client.query(`
            SELECT DISTINCT location_city, COUNT(*) 
            FROM public.properties 
            GROUP BY location_city 
            ORDER BY count DESC
        `);
        console.log(citiesRes.rows);

        console.log("\n--- DISTINCT AREAS IN PROPERTIES ---");
        const areasRes = await client.query(`
            SELECT DISTINCT location_area, COUNT(*) 
            FROM public.properties 
            WHERE location_area IS NOT NULL AND location_area != ''
            GROUP BY location_area 
            ORDER BY count DESC
        `);
        console.log(areasRes.rows);

        console.log("\n--- DISTINCT CITIES IN LEADS ---");
        const leadCitiesRes = await client.query(`
            SELECT DISTINCT preference_location_city, COUNT(*) 
            FROM public.leads 
            GROUP BY preference_location_city 
            ORDER BY count DESC
        `);
        console.log(leadCitiesRes.rows);

        console.log("\n--- DISTINCT AREAS IN LEADS ---");
        const leadAreasRes = await client.query(`
            SELECT DISTINCT preference_location_area, COUNT(*) 
            FROM public.leads 
            WHERE preference_location_area IS NOT NULL AND preference_location_area != ''
            GROUP BY preference_location_area 
            ORDER BY count DESC
        `);
        console.log(leadAreasRes.rows);

    } catch (err: any) {
        console.error(err);
    } finally {
        await client.end();
    }
}

run();
