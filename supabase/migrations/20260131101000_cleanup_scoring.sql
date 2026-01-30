-- Clean up and standardize scoring rules

-- 1. Standardize Categories (Title Case)
UPDATE scoring_rules SET category = 'Financial' WHERE category = 'financial';
UPDATE scoring_rules SET category = 'Classification' WHERE category = 'classification';
-- Move 'urgency' category to 'Classification' to match new grouping
UPDATE scoring_rules SET category = 'Classification' WHERE category = 'urgency';

-- 2. Delete obsolete keys (superseded by new comprehensive keys)
-- These were seeded initially but the code now uses different keys (e.g., 'urgency_urgent' instead of 'move_urgency_urgent')
DELETE FROM scoring_rules WHERE criteria_key IN (
    'budget_vs_market_realistic',
    'move_urgency_urgent',
    'move_urgency_moderate'
);
