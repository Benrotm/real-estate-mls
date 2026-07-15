'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, Globe, Save, Loader2, Image, UploadCloud } from 'lucide-react';
import { supabase } from '@/app/lib/supabase/client';
import { 
    getAdminSettings, 
    updateAdminSetting, 
    updateProxySetting, 
    updateGlobalWatermarkSetting,
    AdminSettings, 
    ProxyConfig,
    GlobalWatermarkConfig 
} from '@/app/lib/actions/admin-settings';

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
            {message.text && (
                <div className={`p-4 rounded-xl border ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                    {message.text}
                </div>
            )}

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

            {/* Residential Proxy Settings */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl mt-8">
                <div className="p-8 border-b border-slate-800 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-3">
                            <Globe className="w-6 h-6 text-emerald-400" />
                            Residential Proxy API Connectivity
                        </h2>
                        <p className="text-slate-400 mt-2 text-sm">
                            Route Automated Scraper API traffic through real residential IPs to dramatically bypass Cloudflare/Bot protections.
                        </p>
                    </div>

                    <button
                        onClick={() => {
                            const newVal = !proxyConfig.is_active;
                            setProxyConfig({ ...proxyConfig, is_active: newVal });
                            updateProxySetting({ ...proxyConfig, is_active: newVal });
                        }}
                        className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${proxyConfig.is_active ? 'bg-emerald-500' : 'bg-slate-700'
                            }`}
                    >
                        <span
                            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${proxyConfig.is_active ? 'translate-x-7' : 'translate-x-0'
                                }`}
                        />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Host Endpoint</label>
                            <input
                                type="text"
                                value={proxyConfig.host || ''}
                                onChange={(e) => setProxyConfig({ ...proxyConfig, host: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                placeholder="brd.superproxy.io"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Port Number</label>
                            <input
                                type="text"
                                value={proxyConfig.port || ''}
                                onChange={(e) => setProxyConfig({ ...proxyConfig, port: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                placeholder="22225"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Username (Zone ID)</label>
                            <input
                                type="text"
                                value={proxyConfig.username || ''}
                                onChange={(e) => setProxyConfig({ ...proxyConfig, username: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                placeholder="brd-customer-xxxx-zone-residential"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Proxy Password</label>
                            <input
                                type="password"
                                value={proxyConfig.password || ''}
                                onChange={(e) => setProxyConfig({ ...proxyConfig, password: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                placeholder="••••••••"
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

            {/* Global Watermark Settings */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-slate-800 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-3">
                            <Image className="w-6 h-6 text-violet-400" />
                            Global Image Watermark & Override
                        </h2>
                        <p className="text-slate-400 mt-2 text-sm">
                            Enforce a platform-wide watermark overlay on all uploaded property photos, with optional override of user-configured watermarks.
                        </p>
                    </div>

                    <button
                        onClick={() => {
                            const newVal = !globalWatermark.is_active;
                            setGlobalWatermark({ ...globalWatermark, is_active: newVal });
                        }}
                        className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${globalWatermark.is_active ? 'bg-violet-500' : 'bg-slate-700'}`}
                    >
                        <span
                            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${globalWatermark.is_active ? 'translate-x-7' : 'translate-x-0'}`}
                        />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    {/* Override users watermark setting */}
                    <div className="flex items-start justify-between gap-6 p-4 rounded-2xl bg-violet-950/20 border border-violet-800/20">
                        <div className="flex-1">
                            <label className="text-base font-bold text-white cursor-pointer hover:text-violet-300 transition-colors">
                                Override Users' Watermarks
                            </label>
                            <p className="text-slate-400 text-sm mt-1">
                                When enabled, user-level watermark settings are ignored, and this global watermark is applied to all uploaded listing photos.
                            </p>
                        </div>
                        <button
                            onClick={() => setGlobalWatermark({ ...globalWatermark, override_users: !globalWatermark.override_users })}
                            className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${globalWatermark.override_users ? 'bg-violet-500' : 'bg-slate-700'}`}
                        >
                            <span
                                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${globalWatermark.override_users ? 'translate-x-7' : 'translate-x-0'}`}
                            />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Settings Controls */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Watermark Logo (PNG recommended)</label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        id="admin-watermark-logo-input"
                                        onChange={handleLogoUpload}
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor="admin-watermark-logo-input"
                                        className="flex items-center gap-2 cursor-pointer bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg px-4 py-2 text-sm transition-colors"
                                    >
                                        <UploadCloud className="w-4 h-4" />
                                        {isUploadingLogo ? 'Uploading...' : 'Choose File'}
                                    </label>
                                    {globalWatermark.logo_url && (
                                        <span className="text-xs text-slate-400 truncate max-w-[200px]">
                                            Uploaded!
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Opacity ({Math.round(globalWatermark.opacity * 100)}%)
                                    </label>
                                    <input
                                        type="range"
                                        min="0.1"
                                        max="1.0"
                                        step="0.05"
                                        value={globalWatermark.opacity}
                                        onChange={(e) => setGlobalWatermark({ ...globalWatermark, opacity: parseFloat(e.target.value) })}
                                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Size ({globalWatermark.size}%)
                                    </label>
                                    <input
                                        type="range"
                                        min="10"
                                        max="50"
                                        step="1"
                                        value={globalWatermark.size}
                                        onChange={(e) => setGlobalWatermark({ ...globalWatermark, size: parseInt(e.target.value) })}
                                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Watermark Position</label>
                                <select
                                    value={globalWatermark.position}
                                    onChange={(e) => setGlobalWatermark({ ...globalWatermark, position: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-violet-500 transition-colors"
                                >
                                    <option value="center">Center</option>
                                    <option value="top-left">Top Left</option>
                                    <option value="top-right">Top Right</option>
                                    <option value="bottom-left">Bottom Left</option>
                                    <option value="bottom-right">Bottom Right</option>
                                    <option value="tile">Tiled (Pattern)</option>
                                </select>
                            </div>
                        </div>

                        {/* Real-time Preview Widget */}
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-300 mb-2">Live Stamp Preview</span>
                            <div className="w-full h-44 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center relative overflow-hidden">
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 select-none">
                                    <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">Property Photo Backdrop</span>
                                </div>

                                {globalWatermark.logo_url ? (
                                    globalWatermark.position === 'tile' ? (
                                        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 p-2 gap-2 pointer-events-none">
                                            {[...Array(9)].map((_, i) => (
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
                                    <div className="text-slate-500 text-xs italic">Upload a logo to see the watermark preview</div>
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
        </div>
    );
}
