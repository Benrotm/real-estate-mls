-- Add created_by to leads
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id);

-- Create lead_activities table
CREATE TABLE IF NOT EXISTS lead_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL, -- 'created', 'status_change', 'note', 'call', 'email', etc.
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_by UUID REFERENCES profiles(id), -- Optional, system events might not have a user
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_lead_activities_lead ON lead_activities(lead_id);
CREATE INDEX idx_lead_activities_created_at ON lead_activities(created_at);

-- RLS
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Agents can view activities for own leads" ON lead_activities
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM leads WHERE leads.id = lead_activities.lead_id AND leads.agent_id = auth.uid())
    );

CREATE POLICY "Agents can insert activities for own leads" ON lead_activities
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM leads WHERE leads.id = lead_activities.lead_id AND leads.agent_id = auth.uid())
    );

CREATE POLICY "Admins can view all activities" ON lead_activities
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );
