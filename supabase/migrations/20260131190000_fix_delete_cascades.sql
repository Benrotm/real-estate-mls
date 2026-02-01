-- Migration: 20260131190000_fix_delete_cascades.sql
-- Purpose: Add ON DELETE CASCADE to foreign keys to allow user deletion without 500 errors.
-- Applied on Production: Yes (via Browser SQL Editor)

-- 1. Fix notifications table (References auth.users directly)
ALTER TABLE public.notifications
DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;

ALTER TABLE public.notifications
ADD CONSTRAINT notifications_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- 2. Fix profiles table (References auth.users directly)
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_id_fkey
FOREIGN KEY (id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- 3. Fix messages table (References profiles for sender)
ALTER TABLE public.messages 
DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;

ALTER TABLE public.messages 
ADD CONSTRAINT messages_sender_id_fkey 
FOREIGN KEY (sender_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- 4. Fix leads and related tables
ALTER TABLE public.leads 
DROP CONSTRAINT IF EXISTS leads_created_by_fkey;

ALTER TABLE public.leads 
ADD CONSTRAINT leads_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

ALTER TABLE public.lead_activities 
DROP CONSTRAINT IF EXISTS lead_activities_created_by_fkey;

ALTER TABLE public.lead_activities 
ADD CONSTRAINT lead_activities_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

ALTER TABLE public.lead_notes 
DROP CONSTRAINT IF EXISTS lead_notes_created_by_fkey;

ALTER TABLE public.lead_notes 
ADD CONSTRAINT lead_notes_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- 5. Fix Property-related links (messages and appointments linked to properties)
-- Ensure that deleting a property (which happens when user is deleted) doesn't break these.
ALTER TABLE public.messages 
DROP CONSTRAINT IF EXISTS messages_property_id_fkey;

ALTER TABLE public.messages 
ADD CONSTRAINT messages_property_id_fkey 
FOREIGN KEY (property_id) 
REFERENCES public.properties(id) 
ON DELETE CASCADE;

ALTER TABLE public.appointments 
DROP CONSTRAINT IF EXISTS appointments_property_id_fkey;

ALTER TABLE public.appointments 
ADD CONSTRAINT appointments_property_id_fkey 
FOREIGN KEY (property_id) 
REFERENCES public.properties(id) 
ON DELETE CASCADE;

-- 6. Safety Check for generic favorites/saved items if they exist
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'favorites') THEN
        ALTER TABLE public.favorites DROP CONSTRAINT IF EXISTS favorites_user_id_fkey;
        ALTER TABLE public.favorites ADD CONSTRAINT favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
END $$;
