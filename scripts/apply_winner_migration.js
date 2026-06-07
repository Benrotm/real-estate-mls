const { Client } = require('pg');

const SQL_MIGRATION = `
-- Add winner_bid_id column to property_auctions table referencing property_bids(id)
ALTER TABLE property_auctions 
ADD COLUMN IF NOT EXISTS winner_bid_id UUID REFERENCES property_bids(id) ON DELETE SET NULL;
`;

async function main() {
    const client = new Client({
        connectionString: 'postgres://postgres:Imobum2026!@db.cwfhcrftwsxsovexkero.supabase.co:5432/postgres',
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("Connected to database. Applying winner selection migration...");
        await client.query(SQL_MIGRATION);
        console.log("winner_bid_id migration applied successfully!");
    } catch (e) {
        console.error("Migration failed:", e);
        process.exit(1);
    } finally {
        await client.end();
    }
}

main();
