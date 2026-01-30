-- Create lead_notes table
CREATE TABLE IF NOT EXISTS lead_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
    created_by UUID REFERENCES profiles(id) NOT NULL, -- The agent who wrote the note
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_lead_notes_lead ON lead_notes(lead_id);
CREATE INDEX idx_lead_notes_created_at ON lead_notes(created_at);

-- RLS
ALTER TABLE lead_notes ENABLE ROW LEVEL SECURITY;

-- Agents can view notes for their own leads
CREATE POLICY "Agents can view notes for own leads" ON lead_notes
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM leads WHERE leads.id = lead_notes.lead_id AND leads.agent_id = auth.uid())
    );

-- Agents can create notes for their own leads
CREATE POLICY "Agents can create notes for own leads" ON lead_notes
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM leads WHERE leads.id = lead_notes.lead_id AND leads.agent_id = auth.uid())
    );
