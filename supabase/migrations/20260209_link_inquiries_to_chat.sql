-- Link inquiries to chat conversations
-- Migration: 20260209_link_inquiries_to_chat.sql

DO $$ 
BEGIN 
    -- Add user_id to track logged-in inquirers
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_inquiries' AND column_name = 'user_id') THEN
        ALTER TABLE property_inquiries ADD COLUMN user_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
    END IF;

    -- Add conversation_id to link to the chat system
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_inquiries' AND column_name = 'conversation_id') THEN
        ALTER TABLE property_inquiries ADD COLUMN conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_property_inquiries_conversation ON property_inquiries(conversation_id);
CREATE INDEX IF NOT EXISTS idx_property_inquiries_user ON property_inquiries(user_id);
