import { 
    Bell, LayoutDashboard, Users, Home, BarChart2, Calendar, Briefcase, LogOut, Menu, X, 
    MessageSquare, Building, Shield, Settings, TrendingUp, Flag, LifeBuoy, Check, Globe, 
    Camera, Heart, FileDown, CopyCheck, Target, Activity, DollarSign, Wand2, Coins, 
    Calculator, Gift, ShieldAlert, History, FileText, Key, Share2, Zap 
} from 'lucide-react';

export const MENU_ICONS: Record<string, any> = {
    Bell, LayoutDashboard, Users, Home, BarChart2, Calendar, Briefcase, LogOut, Menu, X, 
    MessageSquare, Building, Shield, Settings, TrendingUp, Flag, LifeBuoy, Check, Globe, 
    Camera, Heart, FileDown, CopyCheck, Target, Activity, DollarSign, Wand2, Coins, 
    Calculator, Gift, ShieldAlert, History, FileText, Key, Share2, Zap
};

export interface MenuItemDefinition {
    name: string;
    icon: string; // Key in MENU_ICONS
    href: string;
    superAdminOnly?: boolean;
    isAgencyManagerOnly?: boolean;
    requiresFeature?: string;
}

export const DEFAULT_MENUS: Record<string, MenuItemDefinition[]> = {
    admin: [
        { name: 'Console', icon: 'Shield', href: '/dashboard/admin' },
        { name: 'Leads & CRM', icon: 'Users', href: '/dashboard/admin/leads' },
        { name: 'ACP Market Insights', icon: 'Briefcase', href: '/dashboard/admin/market' },
        { name: 'Market Analytics', icon: 'TrendingUp', href: '/dashboard/admin/analytics' },
        { name: 'Pipeline', icon: 'BarChart2', href: '/dashboard/admin/pipeline' },
        { name: 'AI Pipeline', icon: 'Zap', href: '/dashboard/admin/ai-pipeline' },
        { name: 'My Properties', icon: 'Home', href: '/dashboard/admin/my-properties' },
        { name: 'All Properties', icon: 'Building', href: '/dashboard/admin/properties' },
        { name: 'Contract Deletions', icon: 'ShieldAlert', href: '/dashboard/admin/contract-deletions' },
        { name: 'Blacklist Telefonic', icon: 'ShieldAlert', href: '/dashboard/admin/blacklist' },
        { name: 'Presentation Contracts', icon: 'FileText', href: '/dashboard/admin/presentation-contracts' },
        { name: 'AI Studio', icon: 'Wand2', href: '/dashboard/admin/ai-staging' },
        { name: 'All Virtual Tours', icon: 'Globe', href: '/dashboard/admin/tours' },
        { name: 'Tour Maker', icon: 'Camera', href: '/dashboard/owner/tours' },
        { name: 'Valuation Settings', icon: 'TrendingUp', href: '/dashboard/admin/valuation' },
        { name: 'Valuation Reports', icon: 'BarChart2', href: '/dashboard/admin/valuation/reports' },
        { name: 'Plan Settings', icon: 'Briefcase', href: '/dashboard/admin/plans' },
        { name: 'Features', icon: 'Check', href: '/dashboard/admin/features' },
        { name: 'AI Matching Engine', icon: 'Zap', href: '/dashboard/admin/scoring/match' },
        { name: 'User Management', icon: 'Users', href: '/dashboard/admin/users' },
        // Super Admin Only items
        { name: 'User Permission Matrix', icon: 'Users', href: '/dashboard/admin/permissions', superAdminOnly: true },
        { name: 'My Team', icon: 'Users', href: '/dashboard/agent/team', superAdminOnly: true },
        { name: 'Agency ROI', icon: 'TrendingUp', href: '/dashboard/agent/roi', superAdminOnly: true },
        { name: 'Team Activities', icon: 'Activity', href: '/dashboard/agent/team-activities', superAdminOnly: true },
        // Settings/Scrapers/Import items
        { name: 'System Settings', icon: 'Settings', href: '/dashboard/admin/settings' },
        { name: 'Location Lists', icon: 'Globe', href: '/dashboard/admin/settings/locations', superAdminOnly: true },
        { name: 'Calculator Settings', icon: 'Calculator', href: '/dashboard/admin/settings/calculator-comisioane' },
        { name: 'Solicitări Proprietari', icon: 'FileText', href: '/dashboard/admin/solicitari-proprietari' },
        { name: 'Marketing Pages Builder', icon: 'Settings', href: '/dashboard/admin/marketing-pages', superAdminOnly: true },
        { name: 'Services Marketplace', icon: 'Briefcase', href: '/dashboard/admin/services', superAdminOnly: true },
        { name: 'Credit & Costs System', icon: 'Coins', href: '/dashboard/admin/credit-settings' },
        { name: 'Validare Plăți', icon: 'DollarSign', href: '/dashboard/admin/validare-plati' },
        { name: 'Portal Activations', icon: 'Key', href: '/dashboard/admin/portal-activations' },
        { name: 'Social Media Links', icon: 'Share2', href: '/dashboard/admin/social-settings' },
        { name: 'Istoric Credite Global', icon: 'History', href: '/dashboard/admin/credit-history' },
        { name: 'AI Provider Config', icon: 'Settings', href: '/dashboard/admin/ai-settings' },
        { name: 'Imoflux', icon: 'CopyCheck', href: '/dashboard/admin/imofluxmls' },
        { name: 'Sold Imoflux', icon: 'Target', href: '/dashboard/admin/sold-immoflux' },
        { name: 'FluxMLS', icon: 'CopyCheck', href: '/dashboard/admin/fluxmls' },
        { name: 'Single Import', icon: 'Globe', href: '/dashboard/admin/properties/import' },
        { name: 'Bulk Import Publi24', icon: 'FileDown', href: '/dashboard/admin/bulk-import' },
        { name: 'Bulk Import OLX', icon: 'Globe', href: '/dashboard/admin/bulk-import-olx' },
        { name: 'Centru Notificări', icon: 'Bell', href: '/dashboard/notifications' },
        { name: 'Alimentare Credite', icon: 'Coins', href: '/cont/plati' },
        { name: 'Invită un Prieten', icon: 'Gift', href: '/cont/profil' },
        { name: 'Chat', icon: 'MessageSquare', href: '/dashboard/admin/chat' },
        { name: 'Support Chat', icon: 'LifeBuoy', href: '/dashboard/admin/support-chat' },
        { name: 'Tickets & Reports', icon: 'Flag', href: '/dashboard/admin/tickets' }
    ],
    agent: [
        { name: 'Overview', icon: 'LayoutDashboard', href: '/dashboard/agent' },
        // Team Leader only items
        { name: 'My Team', icon: 'Users', href: '/dashboard/agent/team', isAgencyManagerOnly: true },
        { name: 'Agency ROI', icon: 'TrendingUp', href: '/dashboard/agent/roi', isAgencyManagerOnly: true },
        { name: 'Team Activities', icon: 'Activity', href: '/dashboard/agent/team-activities', isAgencyManagerOnly: true },
        { name: 'Contract Deletions', icon: 'ShieldAlert', href: '/dashboard/agent/contract-deletions', isAgencyManagerOnly: true },
        // Standard agent items
        { name: 'My Finances', icon: 'DollarSign', href: '/dashboard/agent/finances' },
        { name: 'My Listings', icon: 'Home', href: '/dashboard/agent/listings' },
        { name: 'My Favorites', icon: 'Heart', href: '/dashboard/agent/favorites' },
        { name: 'Leads & CRM', icon: 'Users', href: '/dashboard/agent/leads' },
        { name: 'Pipeline', icon: 'BarChart2', href: '/dashboard/agent/pipeline' },
        { name: 'Collaboration Contracts', icon: 'CopyCheck', href: '/dashboard/agent/collaboration-contracts' },
        { name: 'Presentation Contracts', icon: 'FileText', href: '/dashboard/agent/presentation-contracts' },
        { name: 'AI Studio', icon: 'Wand2', href: '/dashboard/agent/ai-staging', requiresFeature: 'ai_studio' },
        { name: 'Valuation Reports', icon: 'BarChart2', href: '/dashboard/agent/valuation' },
        { name: 'ACP Market Insights', icon: 'Briefcase', href: '/dashboard/agent/market' },
        { name: 'Market Analytics', icon: 'TrendingUp', href: '/dashboard/agent/analytics' },
        { name: 'Daily Activities', icon: 'Calendar', href: '/dashboard/agent/activities' },
        { name: 'Centru Notificări', icon: 'Bell', href: '/dashboard/notifications' },
        { name: 'Alimentare Credite', icon: 'Coins', href: '/cont/plati' },
        { name: 'Invită un Prieten', icon: 'Gift', href: '/cont/profil' },
        { name: 'Chat', icon: 'MessageSquare', href: '/dashboard/agent/chat' },
        { name: 'Support Chat', icon: 'LifeBuoy', href: '/dashboard/agent/support-chat' },
        { name: 'Report & Suggest', icon: 'Flag', href: '/dashboard/agent/report' }
    ],
    owner: [
        { name: 'Overview', icon: 'LayoutDashboard', href: '/dashboard/owner' },
        { name: 'My Properties', icon: 'Home', href: '/dashboard/owner/properties' },
        { name: 'My Favorites', icon: 'Heart', href: '/dashboard/owner/favorites' },
        { name: 'AI Studio', icon: 'Wand2', href: '/dashboard/owner/ai-staging', requiresFeature: 'ai_studio' },
        { name: 'Virtual Tours', icon: 'Globe', href: '/dashboard/owner/tours' },
        { name: 'Leads & CRM', icon: 'Users', href: '/dashboard/owner/leads' },
        { name: 'Valuation Reports', icon: 'BarChart2', href: '/dashboard/owner/valuation' },
        { name: 'ACP Market Insights', icon: 'Briefcase', href: '/dashboard/owner/market' },
        { name: 'Market Analytics', icon: 'TrendingUp', href: '/dashboard/owner/analytics' },
        { name: 'Centru Notificări', icon: 'Bell', href: '/dashboard/notifications' },
        { name: 'Alimentare Credite', icon: 'Coins', href: '/cont/plati' },
        { name: 'Invită un Prieten', icon: 'Gift', href: '/cont/profil' },
        { name: 'Chat', icon: 'MessageSquare', href: '/dashboard/owner/chat' },
        { name: 'Support Chat', icon: 'LifeBuoy', href: '/dashboard/owner/support-chat' },
        { name: 'Report & Suggest', icon: 'Flag', href: '/dashboard/owner/report' }
    ],
    developer: [
        { name: 'Overview', icon: 'LayoutDashboard', href: '/dashboard/developer' },
        { name: 'AI Studio', icon: 'Wand2', href: '/dashboard/developer/ai-staging', requiresFeature: 'ai_studio' },
        { name: 'My Projects', icon: 'Building', href: '/dashboard/developer/projects' },
        { name: 'Valuation Reports', icon: 'BarChart2', href: '/dashboard/developer/valuation', requiresFeature: 'valuation_reports' },
        { name: 'Analytics', icon: 'BarChart2', href: '/dashboard/developer/analytics' },
        { name: 'Centru Notificări', icon: 'Bell', href: '/dashboard/notifications' },
        { name: 'Alimentare Credite', icon: 'Coins', href: '/cont/plati' },
        { name: 'Invită un Prieten', icon: 'Gift', href: '/cont/profil' },
        { name: 'Chat', icon: 'MessageSquare', href: '/dashboard/developer/chat' },
        { name: 'Support Chat', icon: 'LifeBuoy', href: '/dashboard/developer/support-chat' },
        { name: 'Report & Suggest', icon: 'Flag', href: '/dashboard/developer/report' }
    ],
    client: [
        { name: 'Dashboard', icon: 'LayoutDashboard', href: '/dashboard/client' },
        { name: 'AI Matching', icon: 'Zap', href: '/dashboard/client/ai-matching' },
        { name: 'AI Studio', icon: 'Wand2', href: '/dashboard/client/ai-staging', requiresFeature: 'ai_studio' },
        { name: 'Browse Properties', icon: 'Building', href: '/properties' },
        { name: 'My Favorites', icon: 'Heart', href: '/dashboard/client/favorites' },
        { name: 'My Offers', icon: 'DollarSign', href: '/dashboard/client/offers' },
        { name: 'Saved Searches', icon: 'Briefcase', href: '/dashboard/client/searches' },
        { name: 'Valuation Reports', icon: 'BarChart2', href: '/dashboard/client/valuation' },
        { name: 'ACP Market Insights', icon: 'BarChart2', href: '/dashboard/client/market' },
        { name: 'Market Analytics', icon: 'TrendingUp', href: '/dashboard/client/analytics' },
        { name: 'Centru Notificări', icon: 'Bell', href: '/dashboard/notifications' },
        { name: 'Alimentare Credite', icon: 'Coins', href: '/cont/plati' },
        { name: 'Invită un Prieten', icon: 'Gift', href: '/cont/profil' },
        { name: 'Chat', icon: 'MessageSquare', href: '/dashboard/client/chat' },
        { name: 'Support Chat', icon: 'LifeBuoy', href: '/dashboard/client/support-chat' },
        { name: 'Report & Suggest', icon: 'Flag', href: '/dashboard/client/report' }
    ]
};
