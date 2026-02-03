-- 1. Add missing area columns to properties
ALTER TABLE properties ADD COLUMN IF NOT EXISTS area_terrace DECIMAL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS area_garden DECIMAL;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS area_box DECIMAL;

-- 2. Seed Scoring Rules for ALL form criteria
-- We use ON CONFLICT DO NOTHING to avoid overriding existing customizations if any, 
-- or DO UPDATE if we want to ensure they exist. Given the user asked to "include all", we'll ensure they exist.

INSERT INTO scoring_rules (category, criteria_key, label, weight, is_active, scope) VALUES
-- Transaction Type
('Transaction', 'transaction_sale', 'Listing: For Sale', 0, true, 'property'),
('Transaction', 'transaction_rent', 'Listing: For Rent', 0, true, 'property'),
('Transaction', 'transaction_hotel', 'Listing: Hotel Regime', 0, true, 'property'),

-- Property Type (Expanded)
('Type', 'type_industrial', 'Type: Industrial', 20, true, 'property'),
('Type', 'type_land', 'Type: Land', 10, true, 'property'),
('Type', 'type_investment', 'Type: Investment', 25, true, 'property'),
('Type', 'type_business', 'Type: Business', 25, true, 'property'),
('Type', 'type_other', 'Type: Other', 0, true, 'property'),

-- Specs (Ranges or Existence - easier to score existence/boolean for now, or specific values)
-- For numeric fields, usually we score ranges, but here we'll just add placeholders or specific high-value markers if the engine supports it.
-- Assuming the engine currently supports boolean matches on keys or specific matches. 
-- For now we'll add boolean flags for detailed text fields.

-- Partitioning
('Partitioning', 'part_decomandat', 'Partitioning: Decomandat', 15, true, 'property'),
('Partitioning', 'part_semidecomandat', 'Partitioning: Semidecomandat', 10, true, 'property'),
('Partitioning', 'part_nedecomandat', 'Partitioning: Nedecomandat', 0, true, 'property'),
('Partitioning', 'part_circular', 'Partitioning: Circular', 5, true, 'property'),
('Partitioning', 'part_vagon', 'Partitioning: Vagon', -5, true, 'property'),

-- Comfort
('Comfort', 'comfort_lux', 'Comfort: Lux', 25, true, 'property'),
('Comfort', 'comfort_1', 'Comfort: 1', 15, true, 'property'),
('Comfort', 'comfort_2', 'Comfort: 2', 5, true, 'property'),
('Comfort', 'comfort_3', 'Comfort: 3', 0, true, 'property'),

-- Building Type
('Building', 'build_apt_block', 'Building: Apartment Block', 10, true, 'property'),
('Building', 'build_house', 'Building: Individual House', 20, true, 'property'),
('Building', 'build_duplex', 'Building: Duplex', 15, true, 'property'),
('Building', 'build_villa', 'Building: Villa', 25, true, 'property'),
('Building', 'build_office', 'Building: Office Building', 20, true, 'property'),
('Building', 'build_mixed', 'Building: Mixed Use', 15, true, 'property'),

-- Interior Condition (Update existing keys if needed or add new)
('Condition', 'cond_fair', 'Condition: Fair', 0, true, 'property'),

-- Furnishing
('Furnishing', 'furn_unfurnished', 'Furnishing: Unfurnished', 0, true, 'property'),
('Furnishing', 'furn_semi', 'Furnishing: Semi-furnished', 10, true, 'property'),
('Furnishing', 'furn_furnished', 'Furnishing: Furnished', 20, true, 'property'),
('Furnishing', 'furn_luxury', 'Furnishing: Luxury Furnished', 30, true, 'property'),

-- Listing Tags
('Tags', 'tag_commission_0', 'Tag: Commission 0%', 10, true, 'property'),
('Tags', 'tag_exclusive', 'Tag: Exclusive', 20, true, 'property'),
('Tags', 'tag_foreclosure', 'Tag: Foreclosure', 5, true, 'property'),
('Tags', 'tag_hotel_regime', 'Tag: Hotel Regime', 10, true, 'property'),
('Tags', 'tag_luxury', 'Tag: Luxury', 25, true, 'property'),

-- Unit Features
('Unit Features', 'feat_air_cond', 'Unit: Air Conditioning', 10, true, 'property'),
--('Unit Features', 'feat_balcony', 'Unit: Balcony', 10, true, 'property'), -- Exists as feature_balcony
--('Unit Features', 'feat_central_heat', 'Unit: Central Heating', 10, true, 'property'), -- Exists
('Unit Features', 'feat_fireplace', 'Unit: Fireplace', 15, true, 'property'),
('Unit Features', 'feat_garage', 'Unit: Garage', 15, true, 'property'),
('Unit Features', 'feat_jacuzzi', 'Unit: Jacuzzi', 20, true, 'property'),
('Unit Features', 'feat_laundry', 'Unit: Laundry', 5, true, 'property'),
-- ('Unit Features', 'feat_parking', 'Unit: Parking', 10, true, 'property'), -- Exists
('Unit Features', 'feat_pool_priv', 'Unit: Private Pool', 30, true, 'property'),
('Unit Features', 'feat_sauna', 'Unit: Sauna', 20, true, 'property'),
('Unit Features', 'feat_storage', 'Unit: Storage', 5, true, 'property'),

-- Community
('Community', 'comm_amphi', 'Community: Amphitheatre', 10, true, 'property'),
('Community', 'comm_club', 'Community: Clubhouse', 15, true, 'property'),
('Community', 'comm_garden', 'Community: Common Garden', 10, true, 'property'),
('Community', 'comm_jog', 'Community: Jogging Track', 10, true, 'property'),
('Community', 'comm_lib', 'Community: Library', 5, true, 'property'),
('Community', 'comm_park', 'Community: Park', 10, true, 'property'),
('Community', 'comm_party', 'Community: Party Hall', 10, true, 'property'),
('Community', 'comm_play', 'Community: Playground', 10, true, 'property'),

-- Sports
('Sports', 'sport_basket', 'Sports: Basketball Court', 15, true, 'property'),
('Sports', 'sport_foot', 'Sports: Football Field', 15, true, 'property'),
('Sports', 'sport_gym', 'Sports: Gym', 20, true, 'property'),
('Sports', 'sport_squash', 'Sports: Squash Court', 20, true, 'property'),
('Sports', 'sport_swim', 'Sports: Swimming Pool', 25, true, 'property'),
('Sports', 'sport_tennis', 'Sports: Tennis Court', 20, true, 'property'),
('Sports', 'sport_yoga', 'Sports: Yoga Deck', 15, true, 'property'),

-- Security
('Security', 'sec_24_7', 'Security: 24/7 Security', 20, true, 'property'),
('Security', 'sec_cctv', 'Security: CCTV Surveillance', 15, true, 'property'),
('Security', 'sec_fire', 'Security: Fire Safety', 10, true, 'property'),
('Security', 'sec_gated', 'Security: Gated Community', 20, true, 'property'),
('Security', 'sec_intercom', 'Security: Intercom', 5, true, 'property'),
('Security', 'sec_shelter', 'Security: Shelter', 10, true, 'property'),
('Security', 'sec_video_door', 'Security: Video Door Phone', 10, true, 'property'),

-- Sustainability
('Sustainability', 'sust_concierge', 'Sust: Concierge', 20, true, 'property'),
('Sustainability', 'sust_elevator', 'Sust: Elevator', 10, true, 'property'),
('Sustainability', 'sust_green', 'Sust: Green Building', 25, true, 'property'),
('Sustainability', 'sust_aint', 'Sust: Maintenance Staff', 15, true, 'property'),
('Sustainability', 'sust_power', 'Sust: Power Backup', 15, true, 'property'),
('Sustainability', 'sust_rain', 'Sust: Rainwater Harvesting', 15, true, 'property'),
('Sustainability', 'sust_sewage', 'Sust: Sewage Treatment', 10, true, 'property'),
('Sustainability', 'sust_smart', 'Sust: Smart Home', 20, true, 'property'),
('Sustainability', 'sust_solar', 'Sust: Solar Panels', 20, true, 'property'),
('Sustainability', 'sust_visitor', 'Sust: Visitor Parking', 10, true, 'property')

ON CONFLICT (criteria_key) DO UPDATE SET
    label = EXCLUDED.label,
    scope = 'property';
