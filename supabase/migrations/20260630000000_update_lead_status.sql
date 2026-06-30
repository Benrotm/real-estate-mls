-- Migration: Update leads status check constraint to include 'properties_selection' and 'not_interested'
-- Drop any existing check constraints containing 'status' on public.leads dynamically to be safe
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT con.conname
        FROM pg_constraint con
        INNER JOIN pg_class rel ON rel.oid = con.conrelid
        INNER JOIN pg_namespace nsp ON nsp.oid = con.connamespace
        WHERE nsp.nspname = 'public'
          AND rel.relname = 'leads'
          AND con.contype = 'c'
          AND pg_get_constraintdef(con.oid) LIKE '%status%'
    LOOP
        EXECUTE 'ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    END LOOP;
END $$;

-- Re-add check constraint with the new list of statuses
ALTER TABLE public.leads 
ADD CONSTRAINT leads_status_check 
CHECK (status IN ('new', 'contacted', 'properties_selection', 'viewing', 'negotiation', 'closed', 'lost', 'not_interested'));
