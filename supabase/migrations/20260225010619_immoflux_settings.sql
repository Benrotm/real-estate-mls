-- Insert default Immoflux Integration Settings
INSERT INTO public.admin_settings (key, value, description)
VALUES (
    'immoflux_integration', 
    '{
        "is_active": false,
        "last_scraped_id": 0,
        "region_filter": "Timis",
        "url": "https://blitz.immoflux.ro/particulari",
        "mapping": {
            "title": "h3.offer-title",
            "price": ".price strong",
            "description": ".offer-description",
            "location_city": ".location span",
            "rooms": ".details li:contains(''camere'')",
            "phone": ".phone-number"
        }
    }'::jsonb,
    'Configuration and mapping rules for the Immoflux property scraper, including state tracking (last_scraped_id)'
)
ON CONFLICT (key) DO NOTHING;
