export const SYSTEM_FEATURES = {
    LEADS_ACCESS: 'leads_access',
    VALUATION_REPORTS: 'valuation_reports',
    MARKET_INSIGHTS: 'market_insights',
    VIRTUAL_TOUR: 'virtual_tour',
    MAKE_AN_OFFER: 'make_an_offer',
} as const;

export type SystemFeature = typeof SYSTEM_FEATURES[keyof typeof SYSTEM_FEATURES];
