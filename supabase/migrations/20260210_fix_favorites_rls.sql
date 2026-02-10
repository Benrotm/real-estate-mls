-- Fix RLS policies for property_favorites
-- Migration: 20260210_fix_favorites_rls.sql

-- Drop existing policies to be safe
DROP POLICY IF EXISTS "Users can manage own favorites" ON property_favorites;
DROP POLICY IF EXISTS "Property owners can see who favorited" ON property_favorites;
DROP POLICY IF EXISTS "Users view own" ON property_favorites;
DROP POLICY IF EXISTS "Owners view favorites of their properties" ON property_favorites;
DROP POLICY IF EXISTS "Users insert own" ON property_favorites;
DROP POLICY IF EXISTS "Users delete own" ON property_favorites;

-- Re-create explicit policies
-- 1. SELECT: Users see their own
CREATE POLICY "Users view own favorites" ON property_favorites
    FOR SELECT USING (auth.uid() = user_id);

-- 2. INSERT: Users insert their own
CREATE POLICY "Users insert own favorites" ON property_favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. DELETE: Users delete their own
CREATE POLICY "Users delete own favorites" ON property_favorites
    FOR DELETE USING (auth.uid() = user_id);

-- 4. Owners can see who favorited their properties (for analytics)
CREATE POLICY "Owners view property favorites" ON property_favorites
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM properties WHERE properties.id = property_favorites.property_id AND properties.owner_id = auth.uid())
    );
