-- Fix Analytics and Favorites counts
-- Migration: 20260209_fix_analytics_counts.sql

-- 1. Fix property_shares.property_id type (TEXT -> UUID)
ALTER TABLE property_shares ALTER COLUMN property_id TYPE UUID USING property_id::UUID;

-- 2. Create RPC for secure analytics counting
-- This allows anyone to see the total number of views/favorites without 
-- needing SELECT permission on the underlying rows which might contain private data.
CREATE OR REPLACE FUNCTION get_property_analytics_counts(p_id UUID)
RETURNS TABLE (
    views_count BIGINT,
    favorites_count BIGINT,
    inquiries_count BIGINT,
    offers_count BIGINT,
    shares_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with creator privileges
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM property_views WHERE property_id = p_id),
        (SELECT COUNT(*) FROM property_favorites WHERE property_id = p_id),
        (SELECT COUNT(*) FROM property_inquiries WHERE property_id = p_id),
        (SELECT COUNT(*) FROM property_offers WHERE property_id = p_id),
        (SELECT COUNT(*) FROM property_shares WHERE property_id = p_id);
END;
$$;

-- 3. Update RLS for favorites - users should be able to see IF they favorited
-- (SELECT togglePropertyFavorite logic already handles this, but good to be explicit)
-- We keep the existing policies but the RPC will provide the aggregates.

-- 4. Page View Deduplication Index (Optional but recommended)
-- CREATE INDEX IF NOT EXISTS idx_property_views_session ON property_views(property_id, session_hash);
