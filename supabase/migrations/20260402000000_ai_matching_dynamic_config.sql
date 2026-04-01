-- Add a JSONB config column to store dynamic cutoffs for AI matching
ALTER TABLE scoring_rules ADD COLUMN IF NOT EXISTS config jsonb DEFAULT '{}'::jsonb;

-- Convert existing 'Match - Features' and 'Match - Specs' to 'Match - Optional'
UPDATE scoring_rules 
SET category = 'Match - Optional' 
WHERE category IN ('Match - Features', 'Match - Specs');

-- Promote the required metrics into 'Match - Core'
UPDATE scoring_rules 
SET category = 'Match - Core' 
WHERE criteria_key IN ('match_budget', 'match_rooms', 'match_surface', 'match_area');

-- Seed the initial configuration thresholds for the modifiable Core rules
-- Budget: 10% overflow margin by default
UPDATE scoring_rules 
SET config = '{"budget_margin_max_percent": 10, "budget_margin_min_percent": 10}'::jsonb 
WHERE criteria_key = 'match_budget';

-- Surface: Strict 0% underflow margin by default, but customizable
UPDATE scoring_rules 
SET config = '{"surface_margin_min_percent": 0, "surface_margin_max_percent": 0}'::jsonb 
WHERE criteria_key = 'match_surface';

-- Ensure match_area exists, otherwise insert it
INSERT INTO scoring_rules (category, criteria_key, label, weight, is_active, scope) 
VALUES ('Match - Core', 'match_area', 'Neighborhood (Area) Match', 15, true, 'match')
ON CONFLICT (criteria_key) DO UPDATE SET category = 'Match - Core';
