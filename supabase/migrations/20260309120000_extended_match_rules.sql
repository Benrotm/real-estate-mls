-- Seed Extended Match Scoring Rules
INSERT INTO scoring_rules (category, criteria_key, label, weight, is_active, scope) VALUES
-- New Granular Matching Rules
('Match - Location', 'match_area', 'Neighborhood (Area) Match', 15, true, 'match'),
('Match - Build', 'match_floor', 'Preferred Floor Range Match', 10, true, 'match'),
('Match - Build', 'match_year_built', 'Preferred Min Year Built Match', 10, true, 'match'),
('Match - Build', 'match_building_type', 'Building Type Match', 10, true, 'match'),
('Match - Build', 'match_interior_condition', 'Interior Condition Match', 10, true, 'match'),
('Match - Specs', 'match_baths', 'Bathrooms (>= Preference Min)', 5, true, 'match')

ON CONFLICT (criteria_key) DO UPDATE SET
    scope = EXCLUDED.scope,
    category = EXCLUDED.category,
    label = EXCLUDED.label,
    weight = EXCLUDED.weight,
    is_active = EXCLUDED.is_active;
