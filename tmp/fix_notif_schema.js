const { Client } = require('pg');

const client = new Client({
    connectionString: "postgres://postgres:Imobum2026!@db.cwfhcrftwsxsovexkero.supabase.co:5432/postgres"
});

async function fixNotifications() {
    try {
        await client.connect();
        console.log('Connected to DB');

        const sql = `
      DO $$ 
      BEGIN 
          IF NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'notifications'::regclass AND attname = 'type') THEN
              ALTER TABLE notifications ADD COLUMN type TEXT NOT NULL DEFAULT 'system' CHECK (type IN ('lead', 'message', 'offer', 'inquiry', 'system'));
          END IF;

          IF NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'notifications'::regclass AND attname = 'link') THEN
              ALTER TABLE notifications ADD COLUMN link TEXT;
          END IF;

          IF EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'notifications'::regclass AND attname = 'message') THEN
            -- Check if content already exists before renaming
            IF NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'notifications'::regclass AND attname = 'content') THEN
                ALTER TABLE notifications RENAME COLUMN message TO content;
            ELSE
                -- both exist? just drop message if it's redundant (safer to just ignore for now)
            END IF;
          ELSEIF NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'notifications'::regclass AND attname = 'content') THEN
              ALTER TABLE notifications ADD COLUMN content TEXT;
          END IF;

          -- Enable Realtime
          BEGIN
              EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE notifications';
          EXCEPTION WHEN others THEN
              -- Already exists, ignore
          END;
      END $$;
    `;

        await client.query(sql);
        console.log('Successfully updated notifications table schema!');
    } catch (err) {
        console.error('Error fixing notifications table:', err);
    } finally {
        await client.end();
    }
}

fixNotifications();
