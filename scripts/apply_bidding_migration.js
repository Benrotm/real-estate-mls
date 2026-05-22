const { Client } = require('pg');

const SQL_MIGRATION = `
-- 1. Modify property_offers status constraints and add counter columns
ALTER TABLE property_offers DROP CONSTRAINT IF EXISTS property_offers_status_check;
ALTER TABLE property_offers ADD CONSTRAINT property_offers_status_check CHECK (status IN ('pending', 'viewed', 'accepted', 'rejected', 'expired', 'countered', 'auctioned'));

ALTER TABLE property_offers ADD COLUMN IF NOT EXISTS counter_amount DECIMAL NULL;
ALTER TABLE property_offers ADD COLUMN IF NOT EXISTS counter_message TEXT NULL;
ALTER TABLE property_offers ADD COLUMN IF NOT EXISTS counter_created_at TIMESTAMPTZ NULL;

-- 2. Create property_auctions table
CREATE TABLE IF NOT EXISTS property_auctions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id TEXT REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
    owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    starting_price DECIMAL NOT NULL,
    reserve_price DECIMAL NULL,
    min_increment DECIMAL NOT NULL DEFAULT 100,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('scheduled', 'active', 'ended', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure only one active/scheduled auction per property
DROP INDEX IF EXISTS one_active_auction_per_property;
CREATE UNIQUE INDEX one_active_auction_per_property ON property_auctions (property_id) WHERE (status IN ('scheduled', 'active'));

-- 3. Create property_bids table
CREATE TABLE IF NOT EXISTS property_bids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auction_id UUID REFERENCES property_auctions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    bid_amount DECIMAL NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE property_auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_bids ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid duplication errors
DROP POLICY IF EXISTS "Anyone can view auctions" ON property_auctions;
DROP POLICY IF EXISTS "Owners can manage own auctions" ON property_auctions;
DROP POLICY IF EXISTS "Anyone can view bids" ON property_bids;
DROP POLICY IF EXISTS "Authenticated users can place bids" ON property_bids;

-- Create policies
CREATE POLICY "Anyone can view auctions" ON property_auctions FOR SELECT USING (true);
CREATE POLICY "Owners can manage own auctions" ON property_auctions FOR ALL USING (auth.uid() = owner_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "Anyone can view bids" ON property_bids FOR SELECT USING (true);
CREATE POLICY "Authenticated users can place bids" ON property_bids FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
`;

async function main() {
    const client = new Client({
        connectionString: 'postgres://postgres:Imobum2026!@db.cwfhcrftwsxsovexkero.supabase.co:5432/postgres',
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("Connected to database. Applying migration...");
        await client.query(SQL_MIGRATION);
        console.log("Migration applied successfully!");
    } catch (e) {
        console.error("Migration failed:", e);
        process.exit(1);
    } finally {
        await client.end();
    }
}

main();
