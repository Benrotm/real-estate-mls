import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

let connectionString = process.env.DATABASE_URL;
if (connectionString && connectionString.includes('pooler.supabase.com')) {
    const passwordMatch = connectionString.match(/:([^:@]+)@/);
    const tenantMatch = connectionString.match(/postgres\.([^:@]+):/);
    if (passwordMatch && tenantMatch) {
        const password = passwordMatch[1];
        const tenant = tenantMatch[1];
        connectionString = `postgres://postgres:${password}@db.${tenant}.supabase.co:5432/postgres`;
        console.log(`Reconstructed direct database URL for host: db.${tenant}.supabase.co`);
    }
}

async function main() {
    if (!connectionString) {
        console.error("DATABASE_URL is not set in .env.local");
        process.exit(1);
    }

    const client = new Client({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("Connected to the database successfully.");

        // Query all properties where description contains blitz or bltz (case-insensitive)
        const query = `
            SELECT id, title, description 
            FROM properties 
            WHERE description ILIKE '%blitz%' OR description ILIKE '%bltz%'
        `;
        const res = await client.query(query);
        console.log(`Found ${res.rows.length} properties matching the query.`);

        const isDryRun = process.argv.includes('--apply') ? false : true;
        if (isDryRun) {
            console.log("=== DRY RUN MODE ===");
        } else {
            console.log("=== APPLY MODE (DATABASE WILL BE MODIFIED) ===");
        }

        let updateCount = 0;

        for (const row of res.rows) {
            const { id, title, description } = row;
            if (!description) continue;

            // Replace blitz and bltz (case-insensitive)
            // Match boundaries using \b. In case there is no boundary match but ILIKE matched, we'll replace generally.
            const regex = /\b(blitz|bltz)\b/gi;
            const matches = description.match(regex);

            let newDescription = description.replace(regex, 'Real Estate Hub');
            
            // If it didn't change anything, try without word boundaries
            if (newDescription === description) {
                const fallbackRegex = /(blitz|bltz)/gi;
                newDescription = description.replace(fallbackRegex, 'Real Estate Hub');
            }

            if (newDescription !== description) {
                console.log(`\n--------------------------------------------------`);
                console.log(`Property ID: ${id}`);
                console.log(`Title: "${title}"`);
                console.log(`Original matches: ${matches ? matches.join(', ') : 'none'}`);
                console.log(`Original Description Preview (first 150 chars):`);
                console.log(description.slice(0, 150) + "...");
                console.log(`Updated Description Preview (first 150 chars):`);
                console.log(newDescription.slice(0, 150) + "...");
                
                if (description.length > 150) {
                    console.log(`Original Description End Preview:`);
                    console.log("..." + description.slice(-150));
                    console.log(`Updated Description End Preview:`);
                    console.log("..." + newDescription.slice(-150));
                }

                if (!isDryRun) {
                    await client.query(
                        'UPDATE properties SET description = $1 WHERE id = $2',
                        [newDescription, id]
                    );
                    updateCount++;
                }
            }
        }

        if (isDryRun) {
            console.log("\nDry run completed. Run with '--apply' to make changes.");
        } else {
            console.log(`\nSuccessfully updated ${updateCount} properties.`);
        }

    } catch (e: any) {
        console.error("An error occurred:", e);
    } finally {
        await client.end();
    }
}

main();
