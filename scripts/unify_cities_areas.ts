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
        console.log("Connected to database. Starting unification...");

        // Unify Cities in properties
        const resPropCities = await client.query(`
            UPDATE public.properties 
            SET location_city = CASE 
                WHEN LOWER(location_city) IN ('timisoara', 'timișoara') THEN 'Timișoara'
                WHEN LOWER(location_city) IN ('dumbravita', 'dumbrăvița') THEN 'Dumbrăvița'
                WHEN LOWER(location_city) = 'giroc' THEN 'Giroc'
                WHEN LOWER(location_city) = 'ghiroda' THEN 'Ghiroda'
                WHEN LOWER(location_city) IN ('mosnita noua', 'moșnița nouă') THEN 'Moșnița Nouă'
                WHEN LOWER(location_city) IN ('sacalaz', 'săcălaz') THEN 'Săcălaz'
                ELSE location_city
            END
            WHERE LOWER(location_city) IN ('timisoara', 'timișoara', 'dumbravita', 'dumbrăvița', 'giroc', 'ghiroda', 'mosnita noua', 'moșnița nouă', 'sacalaz', 'săcălaz')
        `);
        console.log(`Updated properties cities: ${resPropCities.rowCount}`);

        // Unify Cities in leads
        const resLeadCities = await client.query(`
            UPDATE public.leads 
            SET preference_location_city = CASE 
                WHEN LOWER(preference_location_city) IN ('timisoara', 'timișoara') THEN 'Timișoara'
                WHEN LOWER(preference_location_city) IN ('dumbravita', 'dumbrăvița') THEN 'Dumbrăvița'
                WHEN LOWER(preference_location_city) = 'giroc' THEN 'Giroc'
                WHEN LOWER(preference_location_city) = 'ghiroda' THEN 'Ghiroda'
                WHEN LOWER(preference_location_city) IN ('mosnita noua', 'moșnița nouă') THEN 'Moșnița Nouă'
                WHEN LOWER(preference_location_city) IN ('sacalaz', 'săcălaz') THEN 'Săcălaz'
                ELSE preference_location_city
            END
            WHERE LOWER(preference_location_city) IN ('timisoara', 'timișoara', 'dumbravita', 'dumbrăvița', 'giroc', 'ghiroda', 'mosnita noua', 'moșnița nouă', 'sacalaz', 'săcălaz')
        `);
        console.log(`Updated leads cities: ${resLeadCities.rowCount}`);

        // Unify Areas in properties
        const resPropAreas = await client.query(`
            UPDATE public.properties
            SET location_area = CASE 
                WHEN location_area = 'Circumvalatiunii' THEN 'Circumvalațiunii'
                WHEN location_area = 'Dambovita' THEN 'Dâmbovița'
                WHEN location_area = 'Cetatii' THEN 'Cetății'
                WHEN location_area = 'Complex Studentesc' THEN 'Complex Studențesc'
                WHEN location_area = 'Buziasului' THEN 'Buziașului'
                WHEN location_area = 'Ronat' THEN 'Ronaț'
                WHEN location_area = 'Ciarda Rosie' THEN 'Ciarda Roșie'
                WHEN location_area = 'Ghirodei' THEN 'Ghirodei'
                ELSE location_area
            END
            WHERE location_area IN ('Circumvalatiunii', 'Dambovita', 'Cetatii', 'Complex Studentesc', 'Buziasului', 'Ronat', 'Ciarda Rosie', 'Ghirodei')
        `);
        console.log(`Updated properties areas: ${resPropAreas.rowCount}`);

        // Unify Areas in leads
        const resLeadAreas = await client.query(`
            UPDATE public.leads
            SET preference_location_area = CASE 
                WHEN preference_location_area = 'Circumvalatiunii' THEN 'Circumvalațiunii'
                WHEN preference_location_area = 'Dambovita' THEN 'Dâmbovița'
                WHEN preference_location_area = 'Cetatii' THEN 'Cetății'
                WHEN preference_location_area = 'Complex Studentesc' THEN 'Complex Studențesc'
                WHEN preference_location_area = 'Buziasului' THEN 'Buziașului'
                WHEN preference_location_area = 'Ronat' THEN 'Ronaț'
                WHEN preference_location_area = 'Ciarda Rosie' THEN 'Ciarda Roșie'
                WHEN preference_location_area = 'Ghirodei' THEN 'Ghirodei'
                ELSE preference_location_area
            END
            WHERE preference_location_area IN ('Circumvalatiunii', 'Dambovita', 'Cetatii', 'Complex Studentesc', 'Buziasului', 'Ronat', 'Ciarda Rosie', 'Ghirodei')
        `);
        console.log(`Updated leads areas: ${resLeadAreas.rowCount}`);

        console.log("Unification completed successfully!");

    } catch (err: any) {
        console.error(err);
    } finally {
        await client.end();
    }
}

run();
