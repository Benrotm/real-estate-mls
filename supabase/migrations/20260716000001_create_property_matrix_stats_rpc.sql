-- Create RPC function to compute property matrix stats
CREATE OR REPLACE FUNCTION get_property_matrix_stats()
RETURNS TABLE (
    type text,
    listing_type text,
    count bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(p.type, 'Other')::text AS type, 
        COALESCE(p.listing_type, 'Other')::text AS listing_type, 
        count(*)::bigint AS count
    FROM properties p
    WHERE p.status = 'active'
    GROUP BY p.type, p.listing_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
