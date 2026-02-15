-- Enable RLS on tickets table
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can do everything on tickets" ON tickets;
DROP POLICY IF EXISTS "Users can view own tickets" ON tickets;
DROP POLICY IF EXISTS "Users can insert own tickets" ON tickets;

-- Policy: Admins can do everything
CREATE POLICY "Admins can do everything on tickets"
ON tickets
FOR ALL
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role IN ('admin', 'super_admin')
  )
);

-- Policy: Users can view their own tickets
CREATE POLICY "Users can view own tickets"
ON tickets
FOR SELECT
USING (
  auth.uid() = user_id
);

-- Policy: Users can insert their own tickets
CREATE POLICY "Users can insert own tickets"
ON tickets
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
);

-- Policy: Users can update their own tickets (optional, e.g. close)
-- For now, maybe just keep it simple.
