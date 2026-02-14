import { Client } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function checkColumns() {
    console.log('Checking columns...');

    // Extracted from environment variables
    const password = 'Imobum2026!';
    const projectRef = 'cwfhcrftwsxsovexkero';
    const connectionString = `postgres://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres`;

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        const res = await client.query(`
            SELECT column_name, data_type
            FROM information_schema.columns 
            WHERE table_name = 'leads'
            AND column_name = 'notes';
        `);

        if (res.rows.length > 0) {
            const columns = res.rows.map(r => r.column_name);
            const expectedColumns = [
                'preference_type', 'preference_listing_type', 'currency',
                'preference_rooms_min', 'preference_rooms_max',
                'preference_bedrooms_min', 'preference_baths_min',
                'preference_surface_min', 'preference_surface_max',
                'preference_year_built_min', 'preference_floor_min', 'preference_floor_max',
                'preference_partitioning', 'preference_comfort', 'preference_building_type',
                'preference_interior_condition', 'preference_furnishing',
                'search_duration', 'viewed_count_total', 'move_urgency',
                'payment_method', 'bank_status', 'budget_vs_market',
                'agent_interest_rating', 'viewed_count_agent', 'outcome_status',
                'budget_min', 'budget_max'
            ];

            const missingColumns = expectedColumns.filter(c => !columns.includes(c));

            console.log('--- Column Check ---');
            if (missingColumns.length > 0) {
                console.log('MISSING COLUMNS:', missingColumns);
            } else {
                console.log('All expected columns are present.');
            }
            console.log('--------------------');
            console.log('All found columns:', columns);

        } else {
            console.log('Column "preference_features" NOT found in "leads" table.');
        }

    } catch (error) {
        console.error('Error checking columns:', error);
    } finally {
        await client.end();
    }
}

checkColumns();
