-- Fix notifications table schema to match implementation
DO $$ 
BEGIN 
    -- 1. Add type column if missing
    IF NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'notifications'::regclass AND attname = 'type') THEN
        ALTER TABLE notifications ADD COLUMN type TEXT NOT NULL DEFAULT 'system' CHECK (type IN ('lead', 'message', 'offer', 'inquiry', 'system'));
    END IF;

    -- 2. Add link column if missing
    IF NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'notifications'::regclass AND attname = 'link') THEN
        ALTER TABLE notifications ADD COLUMN link TEXT;
    END IF;

    -- 3. Handle content/message column
    IF EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'notifications'::regclass AND attname = 'message') THEN
        ALTER TABLE notifications RENAME COLUMN message TO content;
    ELSEIF NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'notifications'::regclass AND attname = 'content') THEN
        ALTER TABLE notifications ADD COLUMN content TEXT;
    END IF;

    -- 4. Ensure Realtime is enabled for this table
    -- Drop from publication if exists to avoid errors, then add
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    EXCEPTION WHEN others THEN
        -- Already exists in publication, ignore
    END;

END $$;
