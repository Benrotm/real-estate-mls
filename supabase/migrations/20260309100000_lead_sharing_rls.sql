-- Migration: 20260309100000_lead_sharing_rls.sql
-- Purpose: Allow shared visibility of leads among all agents and admins while restricting sensitive actions.

-- Drop existing restricted policy
DROP POLICY IF EXISTS "Agents can view own leads" ON leads;

-- Create new shared visibility policy
CREATE POLICY "Agents and admins can view all leads" ON leads
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('agent', 'owner', 'developer', 'admin', 'super_admin')
        )
    );

-- Keep update/delete restricted to owners (and admins)
-- (Existing policies "Agents can update own leads" and "Agents can delete own leads" already handle this correctly by checking agent_id)

-- Ensure creator/agent details can be fetched through join
-- This requires profiles to be readable by others if they are agents
CREATE POLICY "Profiles are viewable by authenticated users" ON profiles
    FOR SELECT USING (auth.uid() IS NOT NULL);
