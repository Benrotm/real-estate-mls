export const SYSTEM_FEATURES = {
    VIEW_OWNER_CONTACT: 'view_owner_contact',
    LEADS_ACCESS: 'leads_access',
    DIRECT_MESSAGE: 'direct_message',
    CALENDAR_EVENTS: 'calendar_events',
    VALUATION_REPORTS: 'valuation_reports',
    MARKET_INSIGHTS: 'market_insights',
    MAKE_AN_OFFER: 'make_an_offer',
    VIRTUAL_TOUR: 'virtual_tour',
    PROPERTY_INSIGHTS: 'property_insights',
    PROPERTY_PRICE_CALCULATOR: 'property_price_calculator',
    TARGET_MARKETING: 'target_marketing',
} as const;

export type SystemFeature = typeof SYSTEM_FEATURES[keyof typeof SYSTEM_FEATURES];
