-- Update scoring_rules to support matching scope
-- 1. Update the CHECK constraint
ALTER TABLE scoring_rules DROP CONSTRAINT IF EXISTS scoring_rules_scope_check;
ALTER TABLE scoring_rules ADD CONSTRAINT scoring_rules_scope_check CHECK (scope IN ('lead', 'property', 'match'));

-- 2. Seed Match Scoring Rules
INSERT INTO scoring_rules (category, criteria_key, label, weight, is_active, scope) VALUES
-- Core Compatibility
('Match - Core', 'match_type', 'Property Type Match', 30, true, 'match'),
('Match - Core', 'match_listing_type', 'Transaction Type Match', 30, true, 'match'),
('Match - Core', 'match_city', 'City Match', 20, true, 'match'),

-- Specs Compatibility
('Match - Specs', 'match_budget', 'Budget (Within Max +10%)', 40, true, 'match'),
('Match - Specs', 'match_rooms', 'Rooms (>= Preference Min)', 15, true, 'match'),
('Match - Specs', 'match_surface', 'Surface (>= Preference Min)', 15, true, 'match'),

-- Features & Preferences
('Match - Features', 'match_features', 'Features Match (per item)', 5, true, 'match'),
('Match - Features', 'match_partitioning', 'Partitioning Match', 10, true, 'match'),
('Match - Features', 'match_comfort', 'Comfort Type Match', 10, true, 'match'),
('Match - Features', 'match_furnishing', 'Furnishing Match', 10, true, 'match')

ON CONFLICT (criteria_key) DO UPDATE SET
    scope = EXCLUDED.scope,
    category = EXCLUDED.category,
    label = EXCLUDED.label;
