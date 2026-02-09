-- Add status and updated_at to property_inquiries
-- Migration: 20260209_add_inquiry_status.sql

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_inquiries' AND column_name = 'status') THEN
        ALTER TABLE property_inquiries ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'contacted', 'spam'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_inquiries' AND column_name = 'updated_at') THEN
        ALTER TABLE property_inquiries ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;
