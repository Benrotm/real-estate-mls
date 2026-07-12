-- Migration: Add Rental Restrictions to properties and leads, plus matching rules
ALTER TABLE properties ADD COLUMN IF NOT EXISTS no_smoking_allowed BOOLEAN DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS no_pets_allowed BOOLEAN DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS no_small_kids_allowed BOOLEAN DEFAULT false;

ALTER TABLE leads ADD COLUMN IF NOT EXISTS has_small_kids BOOLEAN DEFAULT false;

-- Add Scoring Rules for Rental Matching
INSERT INTO scoring_rules (category, criteria_key, label, weight, is_active, scope) VALUES
('Match - Rental', 'match_rental_smoking', 'Rental Rule: No Smoking Inside Compliance', 10, true, 'match'),
('Match - Rental', 'match_rental_pets', 'Rental Rule: No Pets Allowed Compliance', 10, true, 'match'),
('Match - Rental', 'match_rental_kids', 'Rental Rule: No Small Kids Allowed Compliance', 10, true, 'match')
ON CONFLICT (criteria_key) DO UPDATE SET
    label = EXCLUDED.label,
    weight = EXCLUDED.weight,
    is_active = EXCLUDED.is_active,
    scope = EXCLUDED.scope;
