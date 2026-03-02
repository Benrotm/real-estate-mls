-- Insert default FluxMLS Integration Settings
INSERT INTO public.admin_settings (key, value, description)
VALUES (
    'fluxmls_integration',
    '{
        "is_active": false,
        "last_scraped_id": 1,
        "scrape_limit": 50,
        "region_filter": "Timis",
        "url": "https://fluxmls.immoflux.ro/login",
        "username": "alexandru.nanu@remax.ro",
        "password": "",
        "delay_min": 3,
        "delay_max": 8,
        "auto_interval": 10,
        "watcher_interval_hours": 2,
        "mapping": {
            "title": "td:nth-child(4) span.tablesaw-cell-content",
            "price": "td:nth-child(3) span.blue-600 strong",
            "description": "td:nth-child(4) div.text-table-expandable",
            "location_city": "td:nth-child(4) strong",
            "rooms": "td:nth-child(4) span.label",
            "owner_phone": "td:nth-child(4) div.btn-primary"
        }
    }'::jsonb,
    'Configuration and mapping rules for the FluxMLS API integration'
)
ON CONFLICT (key) DO NOTHING;
