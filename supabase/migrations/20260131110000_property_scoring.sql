-- Property Scoring support

-- 1. Add score column to properties
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS score numeric DEFAULT 0;

-- 2. Add scope to scoring_rules
ALTER TABLE scoring_rules 
ADD COLUMN IF NOT EXISTS scope text DEFAULT 'lead' CHECK (scope IN ('lead', 'property'));

-- Update existing rules to 'lead' (redundant with default but good for safety if we change default)
UPDATE scoring_rules SET scope = 'lead' WHERE scope IS NULL;

-- 3. Seed Property Scoring Rules
INSERT INTO scoring_rules (category, criteria_key, label, weight, is_active, scope) VALUES
-- Type
('Type', 'type_apartment', 'Type: Apartment', 10, true, 'property'),
('Type', 'type_house', 'Type: House', 20, true, 'property'),
('Type', 'type_commercial', 'Type: Commercial', 30, true, 'property'),

-- Condition & Age
('Condition', 'condition_new', 'Condition: Newly Built (Year > 2020)', 30, true, 'property'),
('Condition', 'condition_renovated', 'Condition: Renovated', 20, true, 'property'),
('Condition', 'condition_good', 'Condition: Good', 10, true, 'property'),
('Condition', 'condition_needs_renovation', 'Condition: Needs Renovation', -10, true, 'property'),

-- Features
('Features', 'feature_parking', 'Feature: Parking / Garage', 15, true, 'property'),
('Features', 'feature_elevator', 'Feature: Elevator', 10, true, 'property'),
('Features', 'feature_balcony', 'Feature: Balcony / Terrace', 10, true, 'property'),
('Features', 'feature_central_heating', 'Feature: Central Heating', 15, true, 'property'),

-- Media
('Media', 'media_video', 'Has Video Tour', 25, true, 'property'),
('Media', 'media_virtual_tour', 'Has Virtual Tour', 30, true, 'property'),
('Media', 'media_images_5plus', 'Images > 5', 10, true, 'property'),

-- Location (Examples)
('Location', 'location_city_center', 'Location: City Center (Keyword)', 20, true, 'property'),
('Location', 'floor_intermediate', 'Floor: Intermediate (Not Ground/Top)', 10, true, 'property'),
('Location', 'floor_ground', 'Floor: Ground Floor', -5, true, 'property'),
('Location', 'floor_top', 'Floor: Top Floor', -5, true, 'property')

ON CONFLICT (criteria_key) DO UPDATE SET
    scope = EXCLUDED.scope;
