-- SQL migration to add helper function get_lead_id_by_short_id
CREATE OR REPLACE FUNCTION get_lead_id_by_short_id(short_id text)
RETURNS uuid AS $$
BEGIN
    RETURN (SELECT id FROM leads WHERE id::text LIKE (short_id || '%') LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
