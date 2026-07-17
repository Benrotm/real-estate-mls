'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, Globe, Save, Loader2, Image, UploadCloud } from 'lucide-react';
import { supabase } from '@/app/lib/supabase/client';
import { 
    getAdminSettings, 
    updateAdminSetting, 
    updateProxySetting, 
    updateGlobalWatermarkSetting,
    getMenuOrderings,
    saveMenuOrdering,
    getMenuVisibilitySettings,
    saveMenuVisibility,
    AdminSettings, 
    ProxyConfig,
    GlobalWatermarkConfig 
} from '@/app/lib/actions/admin-settings';
import { DEFAULT_MENUS, MENU_ICONS } from '@/app/lib/constants/menu';

export default function SettingsClient({ initialSettings }: { initialSettings: AdminSettings | null }) {
    const [settings, setSettings] = useState<AdminSettings | null>(initialSettings);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    // Proxy Settings State
    const [proxyConfig, setProxyConfig] = useState<ProxyConfig>({
        is_active: false,
        host: '',
        port: '',
        username: '',
        password: '',
    });

    // Global Watermark Settings State
    const [globalWatermark, setGlobalWatermark] = useState<GlobalWatermarkConfig>(
        initialSettings?.global_watermark || {
            is_active: false,
            override_users: false,
            logo_url: '',
            opacity: 0.5,
            size: 20,
            position: 'bottom-right',
        }
    );

    const [isUploadingLogo, setIsUploadingLogo] = useState(false);

    const [activeTab, setActiveTab] = useState<'general' | 'menu'>('general');
    const [selectedRole, setSelectedRole] = useState<'admin' | 'agent' | 'owner' | 'developer' | 'client'>('admin');
    const [menuOrderings, setMenuOrderings] = useState<Record<string, string[]>>({});
    const [currentRoleOrder, setCurrentRoleOrder] = useState<any[]>([]);
    const [disabledMenus, setDisabledMenus] = useState<Record<string, string[]>>({});

    useEffect(() => {
        loadMenuOrderings();
    }, []);

    async function loadMenuOrderings() {
        const order = await getMenuOrderings();
        if (order) {
            setMenuOrderings(order);
        }
        const disabled = await getMenuVisibilitySettings();
        if (disabled) {
            setDisabledMenus(disabled);
        }
    }

    useEffect(() => {
        const defaultList = DEFAULT_MENUS[selectedRole] || [];
        const customOrder = menuOrderings[selectedRole] || [];
        
        const sorted = [...defaultList].sort((a, b) => {
            const indexA = customOrder.indexOf(a.name);
            const indexB = customOrder.indexOf(b.name);
            
            const hasA = indexA !== -1;
            const hasB = indexB !== -1;

            if (hasA && hasB) return indexA - indexB;
            if (hasA) return -1;
            if (hasB) return 1;
            
            return defaultList.indexOf(a) - defaultList.indexOf(b);
        });

        setCurrentRoleOrder(sorted);
    }, [selectedRole, menuOrderings]);

    const handleMoveItem = (index: number, direction: 'up' | 'down') => {
        const newOrder = [...currentRoleOrder];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        
        if (targetIndex < 0 || targetIndex >= newOrder.length) return;

        const temp = newOrder[index];
        newOrder[index] = newOrder[targetIndex];
        newOrder[targetIndex] = temp;
        
        setCurrentRoleOrder(newOrder);
    };

    const handleToggleVisibility = (name: string) => {
        const activeDisabled = disabledMenus[selectedRole] || [];
        let newDisabled: string[];
        if (activeDisabled.includes(name)) {
            newDisabled = activeDisabled.filter(n => n !== name);
        } else {
            newDisabled = [...activeDisabled, name];
        }
        setDisabledMenus({
            ...disabledMenus,
            [selectedRole]: newDisabled
        });
    };

    const handleSaveOrder = async () => {
        setIsSaving(true);
        setMessage({ text: '', type: '' });
        
        const orderNames = currentRoleOrder.map(item => item.name);
        const orderResult = await saveMenuOrdering(selectedRole, orderNames);
        
        const activeDisabled = disabledMenus[selectedRole] || [];
        const visibilityResult = await saveMenuVisibility(selectedRole, activeDisabled);

        if (orderResult.success && visibilityResult.success) {
            setMenuOrderings({
                ...menuOrderings,
                [selectedRole]: orderNames
            });
            setMessage({ text: `Menu configuration for ${selectedRole} saved successfully! Please refresh to see changes.`, type: 'success' });
            setTimeout(() => setMessage({ text: '', type: '' }), 4000);
        } else {
            const errMsg = !orderResult.success ? orderResult.error : visibilityResult.error;
            setMessage({ text: `Failed to save menu configuration: ${errMsg}`, type: 'error' });
        }
        setIsSaving(false);
    };

    const handleResetOrder = () => {
        const defaultList = DEFAULT_MENUS[selectedRole] || [];
        setCurrentRoleOrder(defaultList);
        setDisabledMenus({
            ...disabledMenus,
            [selectedRole]: []
        });
        setMessage({ text: 'Reset to default configuration. Save to persist changes.', type: 'success' });
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    };

    // Initial Load Override
    useEffect(() => {
        loadSettings();
    }, []);

    async function loadSettings() {
        try {
            const data = await getAdminSettings();
            setSettings(data);
            if (data.proxy_integration) {
                setProxyConfig(data.proxy_integration);
            }
            if (data.global_watermark) {
                setGlobalWatermark(data.global_watermark);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    const handleToggle = async (key: keyof AdminSettings) => {
        if (!settings) return;

        const newValue = !settings[key];

        // Optimistic update
        setSettings({ ...settings, [key]: newValue });
        setIsSaving(true);
        setMessage({ text: '', type: '' });

        const result = await updateAdminSetting(key, newValue);

        if (result.success) {
            setMessage({ text: 'Setting updated successfully!', type: 'success' });
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } else {
            // Revert on failure
            setSettings({ ...settings, [key]: !newValue });
            setMessage({ text: `Failed to update: ${result.error}`, type: 'error' });
        }
        setIsSaving(false);
    };

    const handleSaveProxy = async () => {
        setIsSaving(true);
        setMessage({ text: '', type: '' });

        const result = await updateProxySetting(proxyConfig);

        if (result.success) {
            setMessage({ text: 'Proxy settings saved successfully!', type: 'success' });
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } else {
            setMessage({ text: `Failed to save Proxy settings: ${result.error}`, type: 'error' });
        }
        setIsSaving(false);
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingLogo(true);
        setMessage({ text: '', type: '' });

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `global/watermark_${Date.now()}.${fileExt}`;

            const { data, error: uploadError } = await supabase.storage
                .from('property-images')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('property-images')
                .getPublicUrl(fileName);

            setGlobalWatermark(prev => ({ ...prev, logo_url: publicUrl }));
            setMessage({ text: 'Logo uploaded successfully!', type: 'success' });
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } catch (error: any) {
            console.error("Logo upload error:", error);
            setMessage({ text: `Logo upload failed: ${error.message || error}`, type: 'error' });
        } finally {
            setIsUploadingLogo(false);
        }
    };

    const handleSaveWatermark = async () => {
        setIsSaving(true);
        setMessage({ text: '', type: '' });

        const result = await updateGlobalWatermarkSetting(globalWatermark);

        if (result.success) {
            setMessage({ text: 'Global watermark settings saved successfully!', type: 'success' });
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } else {
            setMessage({ text: `Failed to save watermark settings: ${result.error}`, type: 'error' });
        }
        setIsSaving(false);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
            {/* Tabs Navigation */}
            <div className="flex border-b border-slate-800 gap-4 mb-6">
                <button
                    onClick={() => setActiveTab('general')}
                    className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
                        activeTab === 'general' 
                            ? 'border-violet-500 text-white font-black' 
                            : 'border-transparent text-slate-400 hover:text-white'
                    }`}
                >
                    General Settings
                </button>
                <button
                    onClick={() => setActiveTab('menu')}
                    className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
                        activeTab === 'menu' 
                            ? 'border-violet-500 text-white font-black' 
                            : 'border-transparent text-slate-400 hover:text-white'
                    }`}
                >
                    Menu Ordering
                </button>
            </div>

            {message.text && (
                <div className={`p-4 rounded-xl border ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                    {message.text}
                </div>
            )}

            {activeTab === 'general' ? (
                <>
                    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                        <div className="p-8 border-b border-slate-800">
                            <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                <ShieldCheck className="w-6 h-6 text-violet-400" />
                                Assisted Import & Scraper Control
                            </h2>
                            <p className="text-slate-400 mt-2 text-sm">
                                Configure the security and intelligence layers for properties imported via external links (OLX, etc).
                            </p>
                        </div>

                        <div className="p-8 space-y-8">
                            {/* Setting 1: Ownership Verification */}
                            <div className="flex items-start justify-between gap-6 group">
                                <div className="flex-1">
                                    <label className="text-lg font-bold text-white cursor-pointer group-hover:text-violet-300 transition-colors">
                                        Require Ownership Verification
                                    </label>
                                    <p className="text-slate-400 text-sm mt-1 leading-relaxed">
                                        When enabled, users importing a listing via link must verify ownership via an SMS or Email OTP code before the listing data is populated. This serves as legal protection when extracting data from portals.
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleToggle('require_ownership_verification')}
                                    disabled={isSaving}
                                    className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${settings?.require_ownership_verification ? 'bg-violet-500' : 'bg-slate-700'
                                        }`}
                                >
                                    <span
                                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings?.require_ownership_verification ? 'translate-x-7' : 'translate-x-0'
                                            }`}
                                    />
                                </button>
                            </div>

                            <div className="h-px bg-slate-800 w-full" />

                            {/* Setting 2: Anti-Duplicate Intelligence */}
                            <div className="flex items-start justify-between gap-6 group">
                                <div className="flex-1">
                                    <label className="text-lg font-bold text-white flex items-center gap-2 cursor-pointer group-hover:text-amber-300 transition-colors">
                                        Anti-Duplicate Intelligence
                                    </label>
                                    <p className="text-slate-400 text-sm mt-1 leading-relaxed">
                                        When enabled, the system drops a digital fingerprint on every imported property (Normalizing Address, Price, and Rooms). If a duplicate is detected, the import is allowed but <strong>flagged as a duplicate</strong> for admin review.
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleToggle('enable_anti_duplicate_intelligence')}
                                    disabled={isSaving}
                                    className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${settings?.enable_anti_duplicate_intelligence ? 'bg-amber-500' : 'bg-slate-700'
                                        }`}
                                >
                                    <span
                                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings?.enable_anti_duplicate_intelligence ? 'translate-x-7' : 'translate-x-0'
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Catalog & Registration Security Settings */}
                    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl mt-8">
                        <div className="p-8 border-b border-slate-800">
                            <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                <Globe className="w-6 h-6 text-indigo-400" />
                                Catalog Access & User Registration
                            </h2>
                            <p className="text-slate-400 mt-2 text-sm">
                                Configure public access permission constraints for the listings catalog and manual user registration pipelines.
                            </p>
                        </div>

                        <div className="p-8 space-y-8">
                            {/* Setting: Properties Page Public */}
                            <div className="flex items-start justify-between gap-6 group">
                                <div className="flex-1">
                                    <label className="text-lg font-bold text-white cursor-pointer group-hover:text-indigo-300 transition-colors">
                                        Public Properties Catalog
                                    </label>
                                    <p className="text-slate-400 text-sm mt-1 leading-relaxed">
                                        When enabled, guests and visitors can browse listings normally. When disabled, the properties page displays a dashboard with stats and a request/incentive to register or log in.
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleToggle('properties_page_public')}
                                    disabled={isSaving}
                                    className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${settings?.properties_page_public ? 'bg-indigo-500' : 'bg-slate-700'
                                        }`}
                                >
                                    <span
                                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings?.properties_page_public ? 'translate-x-7' : 'translate-x-0'
                                            }`}
                                    />
                                </button>
                            </div>

                            <div className="h-px bg-slate-800 w-full" />

                            {/* Setting: Open User Registration */}
                            <div className="flex items-start justify-between gap-6 group">
                                <div className="flex-1">
                                    <label className="text-lg font-bold text-white cursor-pointer group-hover:text-indigo-300 transition-colors">
                                        Open User Registration
                                    </label>
                                    <p className="text-slate-400 text-sm mt-1 leading-relaxed">
                                        When enabled, anyone can register and login immediately. When disabled, new user registrations are initially locked/pending approval and must be accepted by an administrator.
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleToggle('registration_open')}
                                    disabled={isSaving}
                                    className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${settings?.registration_open ? 'bg-indigo-500' : 'bg-slate-700'
                                        }`}
                                >
                                    <span
                                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings?.registration_open ? 'translate-x-7' : 'translate-x-0'
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Residential Proxy API Configuration */}
                    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl mt-8">
                        <div className="p-8 border-b border-slate-800">
                            <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                <Globe className="w-6 h-6 text-emerald-400" />
                                Residential Proxy API Connectivity
                            </h2>
                            <p className="text-slate-400 mt-2 text-sm">
                                Route Automated Scraper API traffic through real residential IPs to dramatically bypass Cloudflare/Bot protections.
                            </p>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-slate-350">Active Scraper Routing Proxy</span>
                                <button
                                    onClick={() => setProxyConfig({ ...proxyConfig, is_active: !proxyConfig.is_active })}
                                    className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${proxyConfig.is_active ? 'bg-emerald-500' : 'bg-slate-700'}`}
                                >
                                    <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${proxyConfig.is_active ? 'translate-x-7' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Host Endpoint</label>
                                    <input
                                        type="text"
                                        value={proxyConfig.host}
                                        onChange={(e) => setProxyConfig({ ...proxyConfig, host: e.target.value })}
                                        placeholder="e.g. pr.oxylabs.io"
                                        className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-emerald-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Port Number</label>
                                    <input
                                        type="text"
                                        value={proxyConfig.port}
                                        onChange={(e) => setProxyConfig({ ...proxyConfig, port: e.target.value })}
                                        placeholder="e.g. 7777"
                                        className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-emerald-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Username (Zone ID)</label>
                                    <input
                                        type="text"
                                        value={proxyConfig.username || ''}
                                        onChange={(e) => setProxyConfig({ ...proxyConfig, username: e.target.value })}
                                        placeholder="Proxy username or API zone"
                                        className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-emerald-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Proxy Password</label>
                                    <input
                                        type="password"
                                        value={proxyConfig.password || ''}
                                        onChange={(e) => setProxyConfig({ ...proxyConfig, password: e.target.value })}
                                        placeholder="••••••••"
                                        className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:border-emerald-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button
                                    onClick={handleSaveProxy}
                                    disabled={isSaving}
                                    className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 h-10 rounded-xl text-sm font-medium transition-all focus:ring-4 focus:ring-emerald-500/20 disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Save Proxy Network config
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Global Image Watermark & Override */}
                    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl mt-8">
                        <div className="p-8 border-b border-slate-800">
                            <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                <Image className="w-6 h-6 text-violet-400" />
                                Global Image Watermark & Override
                            </h2>
                            <p className="text-slate-400 mt-2 text-sm">
                                Enforce a platform-wide watermark overlay on all uploaded property photos, with optional override of user-configured watermarks.
                            </p>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-slate-350">Active Global Watermark</span>
                                        <button
                                            onClick={() => setGlobalWatermark({ ...globalWatermark, is_active: !globalWatermark.is_active })}
                                            className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${globalWatermark.is_active ? 'bg-violet-500' : 'bg-slate-700'}`}
                                        >
                                            <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${globalWatermark.is_active ? 'translate-x-7' : 'translate-x-0'}`} />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-slate-350 flex items-center gap-2">
                                            Override Users' Watermarks
                                        </span>
                                        <button
                                            onClick={() => setGlobalWatermark({ ...globalWatermark, override_users: !globalWatermark.override_users })}
                                            className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${globalWatermark.override_users ? 'bg-violet-500' : 'bg-slate-700'}`}
                                        >
                                            <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${globalWatermark.override_users ? 'translate-x-7' : 'translate-x-0'}`} />
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        <span className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Logo Upload</span>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="text"
                                                value={globalWatermark.logo_url}
                                                onChange={(e) => setGlobalWatermark({ ...globalWatermark, logo_url: e.target.value })}
                                                placeholder="Logo image URL"
                                                className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:border-violet-500 outline-none transition-all"
                                            />
                                            <label className="cursor-pointer bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white px-4 h-10 rounded-xl text-sm font-medium transition-all border border-slate-800 flex items-center justify-center gap-2">
                                                {isUploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                                                Browse...
                                                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" disabled={isUploadingLogo} />
                                            </label>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Opacity ({Math.round(globalWatermark.opacity * 100)}%)</label>
                                            <input
                                                type="range"
                                                min="0.1"
                                                max="1"
                                                step="0.05"
                                                value={globalWatermark.opacity}
                                                onChange={(e) => setGlobalWatermark({ ...globalWatermark, opacity: parseFloat(e.target.value) })}
                                                className="w-full accent-violet-500 bg-slate-950 cursor-pointer h-2 rounded-lg appearance-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Size ({globalWatermark.size}%)</label>
                                            <input
                                                type="range"
                                                min="10"
                                                max="50"
                                                step="1"
                                                value={globalWatermark.size}
                                                onChange={(e) => setGlobalWatermark({ ...globalWatermark, size: parseInt(e.target.value) })}
                                                className="w-full accent-violet-500 bg-slate-950 cursor-pointer h-2 rounded-lg appearance-none"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Position Placement</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center', 'tile'].map((pos) => (
                                                <button
                                                    key={pos}
                                                    onClick={() => setGlobalWatermark({ ...globalWatermark, position: pos })}
                                                    className={`px-3 py-2 text-xs font-bold rounded-lg border transition-all capitalize ${
                                                        globalWatermark.position === pos 
                                                            ? 'bg-violet-600/10 border-violet-500 text-violet-400' 
                                                            : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'
                                                    }`}
                                                >
                                                    {pos.replace('-', ' ')}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col">
                                    <span className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Preview Window</span>
                                    <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl relative overflow-hidden flex items-center justify-center min-h-[220px]">
                                        {/* Grid background placeholder */}
                                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:24px_24px] opacity-25" />
                                        
                                        {globalWatermark.logo_url ? (
                                            globalWatermark.position === 'tile' ? (
                                                <div className="absolute inset-0 grid grid-cols-4 gap-4 p-4 pointer-events-none overflow-hidden">
                                                    {Array.from({ length: 16 }).map((_, i) => (
                                                        <div key={i} className="flex items-center justify-center">
                                                            <img
                                                                src={globalWatermark.logo_url}
                                                                alt="Watermark Tile"
                                                                className="max-h-6 object-contain"
                                                                style={{ opacity: globalWatermark.opacity }}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <img
                                                    src={globalWatermark.logo_url}
                                                    alt="Watermark Preview"
                                                    className={`absolute max-h-[85%] object-contain pointer-events-none transition-all ${
                                                        globalWatermark.position === 'center' ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' :
                                                        globalWatermark.position === 'top-left' ? 'top-3 left-3' :
                                                        globalWatermark.position === 'top-right' ? 'top-3 right-3' :
                                                        globalWatermark.position === 'bottom-left' ? 'bottom-3 left-3' :
                                                        'bottom-3 right-3'
                                                    }`}
                                                    style={{
                                                        width: `${globalWatermark.size}%`,
                                                        opacity: globalWatermark.opacity
                                                    }}
                                                />
                                            )
                                        ) : (
                                            <div className="text-slate-500 text-xs italic z-10">Upload a logo to see the watermark preview</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button
                                    onClick={handleSaveWatermark}
                                    disabled={isSaving}
                                    className="flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-6 h-10 rounded-xl text-sm font-medium transition-all focus:ring-4 focus:ring-violet-500/20 disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Save Global Watermark config
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="p-8 border-b border-slate-800 flex justify-between items-center flex-wrap gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                <ShieldCheck className="w-6 h-6 text-violet-400" />
                                Configure User Menu Ordering
                            </h2>
                            <p className="text-slate-400 mt-2 text-sm">
                                Rearrange the sidebar links for each user role. Any future code updates will automatically be appended at the bottom.
                            </p>
                        </div>
                        <div>
                            <select
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value as any)}
                                className="bg-slate-950 border border-slate-850 rounded-lg px-4 py-2.5 text-white font-bold text-sm focus:border-violet-500 outline-none cursor-pointer min-w-[200px]"
                            >
                                <option value="admin">Super Admin / Admin</option>
                                <option value="agent">Agent Workspace</option>
                                <option value="owner">Property Owner</option>
                                <option value="developer">Developer</option>
                                <option value="client">Client Dashboard</option>
                            </select>
                        </div>
                    </div>

                    <div className="p-8 space-y-4">
                        <div className="bg-slate-950/40 rounded-2xl border border-slate-800 divide-y divide-slate-800 min-h-[350px] max-h-[1200px] h-[500px] overflow-auto resize-y pr-2">
                            {currentRoleOrder.map((item, idx) => {
                                const IconComp = MENU_ICONS[item.icon] || Globe;
                                const isVisible = !(disabledMenus[selectedRole] || []).includes(item.name);
                                return (
                                    <div key={item.name} className={`p-4 flex items-center justify-between gap-4 hover:bg-slate-900/20 transition-colors ${!isVisible ? 'opacity-60' : ''}`}>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-900 rounded-lg text-slate-400">
                                                <IconComp className="w-5 h-5 text-violet-400" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-white flex items-center gap-2">
                                                    {item.name}
                                                    {item.superAdminOnly && (
                                                        <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-bold">
                                                            Super Admin
                                                        </span>
                                                    )}
                                                    {item.isAgencyManagerOnly && (
                                                        <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold">
                                                            Agency Leader
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-[10px] text-slate-500 font-mono mt-0.5">{item.href}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={`text-xs font-bold ${isVisible ? 'text-violet-400' : 'text-slate-500'}`}>
                                                {isVisible ? 'Visible' : 'Hidden'}
                                            </span>
                                            <button
                                                onClick={() => handleToggleVisibility(item.name)}
                                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-violet-500/20 ${isVisible ? 'bg-violet-500' : 'bg-slate-700'}`}
                                            >
                                                <span
                                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isVisible ? 'translate-x-5' : 'translate-x-0'}`}
                                                />
                                            </button>
                                            <div className="h-4 w-px bg-slate-800" />
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    onClick={() => handleMoveItem(idx, 'up')}
                                                    disabled={idx === 0}
                                                    className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors border border-slate-700"
                                                    title="Move Up"
                                                >
                                                    ▲
                                                </button>
                                                <button
                                                    onClick={() => handleMoveItem(idx, 'down')}
                                                    disabled={idx === currentRoleOrder.length - 1}
                                                    className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors border border-slate-700"
                                                    title="Move Down"
                                                >
                                                    ▼
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                            <button
                                onClick={handleResetOrder}
                                disabled={isSaving}
                                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition-all border border-slate-700 disabled:opacity-50"
                            >
                                Reset to Default
                            </button>
                            <button
                                onClick={handleSaveOrder}
                                disabled={isSaving}
                                className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-800 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Saving Order...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Save Order
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
