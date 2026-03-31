-- 1. Helper Function: get_user_team_members
-- Returns the set of UUIDs that belong to the same team as the provided user_id
CREATE OR REPLACE FUNCTION get_user_team_members(user_id UUID)
RETURNS SETOF UUID AS $$
BEGIN
  RETURN QUERY
  SELECT id FROM profiles
  WHERE id = user_id
     OR agency_id = user_id
     OR (agency_id = (SELECT agency_id FROM profiles p2 WHERE p2.id = user_id) AND agency_id IS NOT NULL)
     OR id = (SELECT agency_id FROM profiles p3 WHERE p3.id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update RLS on leads table
-- Drop existing policies
DROP POLICY IF EXISTS "Agents can view own leads" ON leads;
DROP POLICY IF EXISTS "Agents can update own leads" ON leads;
DROP POLICY IF EXISTS "Agents can delete own leads" ON leads;

-- Any team member can view any lead in the team
CREATE POLICY "Team members can view team leads" ON leads
    FOR SELECT USING (
        auth.uid() IN (SELECT get_user_team_members(agent_id))
    );

-- Only the owner or the manager can update
CREATE POLICY "Owner and Manager can update leads" ON leads
    FOR UPDATE USING (
        auth.uid() = agent_id OR
        auth.uid() = (SELECT agency_id FROM profiles WHERE id = leads.agent_id)
    );

-- Only the owner or the manager can delete
CREATE POLICY "Owner and Manager can delete leads" ON leads
    FOR DELETE USING (
        auth.uid() = agent_id OR
        auth.uid() = (SELECT agency_id FROM profiles WHERE id = leads.agent_id)
    );

-- 3. Update RLS on lead_notes table
DROP POLICY IF EXISTS "Agents can view notes for own leads" ON lead_notes;
DROP POLICY IF EXISTS "Agents can create notes for own leads" ON lead_notes;

CREATE POLICY "Team members can view notes for team leads" ON lead_notes
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM leads WHERE leads.id = lead_notes.lead_id AND auth.uid() IN (SELECT get_user_team_members(leads.agent_id)))
    );

CREATE POLICY "Team members can create notes for team leads" ON lead_notes
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM leads WHERE leads.id = lead_notes.lead_id AND auth.uid() IN (SELECT get_user_team_members(leads.agent_id)))
    );

CREATE POLICY "Team members can update notes for team leads" ON lead_notes
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM leads WHERE leads.id = lead_notes.lead_id AND auth.uid() IN (SELECT get_user_team_members(leads.agent_id)))
    );

CREATE POLICY "Team members can delete notes for team leads" ON lead_notes
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM leads WHERE leads.id = lead_notes.lead_id AND auth.uid() IN (SELECT get_user_team_members(leads.agent_id)))
    );

-- 4. Update RLS on lead_activities table
DROP POLICY IF EXISTS "Agents can view activities for own leads" ON lead_activities;
DROP POLICY IF EXISTS "Agents can insert activities for own leads" ON lead_activities;

CREATE POLICY "Team members can view activities for team leads" ON lead_activities
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM leads WHERE leads.id = lead_activities.lead_id AND auth.uid() IN (SELECT get_user_team_members(leads.agent_id)))
    );

CREATE POLICY "Team members can insert activities for team leads" ON lead_activities
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM leads WHERE leads.id = lead_activities.lead_id AND auth.uid() IN (SELECT get_user_team_members(leads.agent_id)))
    );
