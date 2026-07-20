-- Update match_city category to Match - Core
UPDATE scoring_rules 
SET category = 'Match - Core' 
WHERE criteria_key = 'match_city';
