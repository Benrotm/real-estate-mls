-- Add Open Space partitioning scoring rule
INSERT INTO scoring_rules (category, criteria_key, label, weight, is_active, scope)
SELECT 'Partitioning', 'part_open_space', 'Partitioning: Open Space', 5, true, 'property'
WHERE NOT EXISTS (
    SELECT 1 FROM scoring_rules WHERE criteria_key = 'part_open_space'
);
