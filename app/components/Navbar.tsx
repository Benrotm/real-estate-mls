'use client';

import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from '../context/LanguageContext';
import { User, Menu, Home, Plus, Globe, ChevronDown, Settings, LogOut, Shield, X, Hammer, Calculator, Sparkles, Loader2, Coins } from 'lucide-react';
import { SERVICES } from '../lib/services';
import { UserProfile } from '../lib/auth';
import NotificationBell from './notifications/NotificationBell';
import { upgradeToAgencyAccount } from '@/app/lib/actions/credits';
import { getFeatureCosts } from '@/app/lib/actions/settings';

interface NavbarProps {
  user: UserProfile | null;
}

export default function Navbar({ user }: NavbarProps) {
  const isLoggedIn = !!user;
  const userEmail = user?.full_name || "User";
  const userRole = user?.role;
  const isSuperAdmin = userRole === 'super_admin';
  const pathname = usePathname();
  const router = useRouter();

  if (pathname && pathname.startsWith('/invite/')) {
    return null;
  }
  const [agencyCost, setAgencyCost] = useState<number>(500);
  const [loadingCost, setLoadingCost] = useState<boolean>(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (isLoggedIn) {
      getFeatureCosts().then(res => {
        if (res && res.costs && res.costs['upgrade_agency_cost'] !== undefined) {
          setAgencyCost(res.costs['upgrade_agency_cost']);
        }
        setLoadingCost(false);
      }).catch(err => {
        console.error('Error fetching upgrade agency cost:', err);
        setLoadingCost(false);
      });
    }
  }, [isLoggedIn]);

  const handleUpgradeToAgency = async () => {
    if (!confirm(`Sunteți sigur că doriți să faceți upgrade la contul Agency pentru ${agencyCost} credite?`)) {
      return;
    }

    startTransition(async () => {
      const res = await upgradeToAgencyAccount();
      if (res.success) {
        alert('Contul tău a fost promovat la Agency cu succes!');
        setIsUserMenuOpen(false);
        window.location.reload();
      } else {
        alert(`Eroare: ${res.error}`);
      }
    });
  };

  const { language, setLanguage } = useLanguage();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const dashboardUrl = userRole === 'super_admin' ? '/dashboard/admin' :
    userRole === 'agent' ? '/dashboard/agent' :
    userRole === 'owner' ? '/dashboard/owner' :
    userRole === 'developer' ? '/dashboard/developer' :
    '/dashboard';

  const languages = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'ro', label: 'Română', flag: '🇷🇴' },
    { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  ];

  return (
    <nav className="sticky top-0 w-full z-50 bg-[#1e293b] border-b border-white/10 shadow-xl">
      <div className="max-w-7xl mx-auto px-2 md:px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 md:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 cursor-pointer group">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center text-white group-hover:rotate-3 transition-transform shadow-lg shadow-cyan-500/50">
              <Home className="w-5 h-5 fill-current" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">
              Imobum
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-sm font-bold text-white hover:text-cyan-300 transition-colors flex items-center gap-2">
              Home
            </Link>
            <Link href="/properties" className="text-sm font-bold text-white hover:text-cyan-300 transition-colors hover:bg-white/10 px-3 py-2 rounded-md">
              Properties
            </Link>
            {isLoggedIn && (
              <Link
                href={dashboardUrl}
                className="text-[10px] font-black bg-cyan-500/10 text-cyan-400 border border-cyan-500/50 px-3 py-1.5 rounded-lg hover:bg-cyan-500/20 hover:border-cyan-400 transition-all shadow-lg shadow-cyan-500/10 flex items-center gap-1.5 active:scale-95 group/dash uppercase tracking-wider"
              >
                <Home className="w-3.5 h-3.5 group-hover/dash:scale-110 transition-transform" />
                Dashboard
              </Link>
            )}
            {isLoggedIn ? (
              <Link href="/calculator-comisioane" className="text-sm font-bold text-white hover:text-orange-300 transition-colors hover:bg-white/10 px-3 py-2 rounded-md flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-orange-400" />
                Calculator
              </Link>
            ) : (
              <>
                <Link href="/for-clients" className="text-sm font-bold text-white hover:text-cyan-300 transition-colors hover:bg-white/10 px-3 py-2 rounded-md">
                  For Clients
                </Link>
                <Link href="/for-owners" className="text-sm font-bold text-white hover:text-cyan-300 transition-colors hover:bg-white/10 px-3 py-2 rounded-md">
                  For Owners
                </Link>
                <Link href="/for-brokers" className="text-sm font-bold text-white hover:text-cyan-300 transition-colors hover:bg-white/10 px-3 py-2 rounded-md">
                  For Brokers
                </Link>
              </>
            )}

            {/* Services Dropdown */}
            <div className="relative group">
              <button
                onClick={() => setIsServicesOpen(!isServicesOpen)}
                className="text-sm font-bold text-white hover:text-cyan-300 transition-colors hover:bg-white/10 px-3 py-2 rounded-md flex items-center gap-1"
              >
                Services <ChevronDown className={`w-4 h-4 opacity-70 transition-transform duration-200 ${isServicesOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu - Scrollable max-height */}
              {isServicesOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsServicesOpen(false)}></div>
                  <div
                    className="absolute left-0 mt-1 w-72 bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-700/60 z-20 flex flex-col max-h-[calc(100vh-90px)] overflow-hidden"
                  >
                    <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Servicii Imobiliare</span>
                      <span className="text-[10px] font-semibold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">{SERVICES.length}</span>
                    </div>

                    <div className="overflow-y-auto py-1 divide-y divide-slate-800/40 flex-1">
                      {SERVICES.map((service) => (
                        <Link
                          key={service.slug}
                          href={`/services/${service.slug}`}
                          onClick={() => setIsServicesOpen(false)}
                          className="px-4 py-2.5 text-xs text-slate-200 hover:bg-cyan-500/10 hover:text-cyan-300 flex items-center gap-3 transition-all font-semibold group/item"
                        >
                          <div className="w-7 h-7 rounded-lg bg-slate-800/80 border border-slate-700/50 flex items-center justify-center text-cyan-400 group-hover/item:scale-110 group-hover/item:border-cyan-500/40 transition-all shrink-0">
                            <service.icon className="w-3.5 h-3.5" />
                          </div>
                          <span className="truncate">{service.title}</span>
                        </Link>
                      ))}
                    </div>

                    <div className="border-t border-slate-800 p-2 bg-slate-950/80 shrink-0">
                      <Link
                        href="/services"
                        onClick={() => setIsServicesOpen(false)}
                        className="w-full py-2 px-3 text-xs font-bold text-center text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-xl transition-all flex items-center justify-center gap-1.5 border border-cyan-500/20"
                      >
                        Vezi Toate Serviciile ({SERVICES.length})
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 md:gap-4">

            {/* Notification Bell */}
            {isLoggedIn && user?.id && (
              <NotificationBell userId={user.id} />
            )}

            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center gap-0.5 p-1 md:p-2 rounded-lg text-white hover:bg-white/10 hover:text-cyan-300 transition-colors"
              >
                <Globe className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="text-xs md:text-sm font-bold uppercase">{language}</span>
                <ChevronDown className="w-2.5 h-2.5 md:w-3 md:h-3" />
              </button>

              {isLangOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsLangOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-40 bg-slate-800 rounded-xl shadow-2xl border border-white/10 py-1 z-20">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code as any);
                          setIsLangOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-white/10 hover:text-cyan-300 flex items-center gap-2 font-medium ${language === lang.code ? 'text-cyan-400 font-bold bg-cyan-500/20' : 'text-gray-200'}`}
                      >
                        <span>{lang.flag}</span>
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Auth State Demo */}
            {isLoggedIn ? (
              <>


                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 px-2 py-1 text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    {user?.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.full_name || "User"}
                        className="w-9 h-9 rounded-full object-cover border-2 border-orange-500"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 border-2 border-orange-500">
                        <User className="w-5 h-5" />
                      </div>
                    )}
                    <span className="hidden md:block text-sm font-bold">{user?.full_name?.split(' ')[0] || "User"}</span>
                  </button>

                  {isUserMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsUserMenuOpen(false)}></div>
                      <div className="absolute right-0 mt-3 w-64 bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 py-2 z-20 animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="px-4 py-4 border-b border-slate-100">
                          <div className="font-bold text-base">{user?.full_name || "User"}</div>
                          <div className="text-sm text-slate-500 truncate">{user?.role}</div>
                          {user?.phone && (
                            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1 text-orange-600">
                              <span className="font-medium">{user.phone}</span>
                            </div>
                          )}
                          <div className="mt-2 flex gap-2">
                            <span className="text-xs font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded w-fit uppercase">{user?.plan_tier || 'Free'}</span>
                            {isSuperAdmin && (
                              <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded w-fit uppercase">Admin</span>
                            )}
                          </div>
                        </div>

                        <div className="py-2">
                          {/* Dynamic Dashboard Link - Only for Clients or fallback */}
                          {(!userRole || userRole === 'client') && (
                            <Link
                              href={
                                isSuperAdmin ? '/dashboard/admin' : '/dashboard'
                              }
                              onClick={() => setIsUserMenuOpen(false)}
                              className="px-4 py-2.5 hover:bg-slate-50 flex items-center gap-3 text-sm font-bold text-slate-700 hover:text-slate-900"
                            >
                              <div className="w-5"><Home className="w-4 h-4" /></div> Dashboard
                            </Link>
                          )}
                          {isSuperAdmin && (
                            <Link href="/dashboard/admin" onClick={() => setIsUserMenuOpen(false)} className="px-4 py-2.5 hover:bg-red-50 flex items-center gap-3 text-sm font-bold text-red-600 hover:text-red-700">
                              <div className="w-5"><Shield className="w-4 h-4" /></div> Super Admin
                            </Link>
                          )}
                          {userRole === 'owner' && (
                            <Link href="/dashboard/owner" onClick={() => setIsUserMenuOpen(false)} className="px-4 py-2.5 hover:bg-slate-50 flex items-center gap-3 text-sm font-medium text-slate-700 hover:text-slate-900">
                              <div className="w-5"><Home className="w-4 h-4" /></div> Property Owner Dashboard
                            </Link>
                          )}
                          {userRole === 'agent' && (
                            <Link href="/dashboard/agent" onClick={() => setIsUserMenuOpen(false)} className="px-4 py-2.5 hover:bg-slate-50 flex items-center gap-3 text-sm font-medium text-slate-700 hover:text-slate-900">
                              <div className="w-5"><User className="w-4 h-4" /></div> Agent Dashboard
                            </Link>
                          )}
                          {userRole === 'developer' && (
                            <Link href="/dashboard/developer" onClick={() => setIsUserMenuOpen(false)} className="px-4 py-2.5 hover:bg-slate-50 flex items-center gap-3 text-sm font-medium text-slate-700 hover:text-slate-900">
                              <div className="w-5"><Hammer className="w-4 h-4" /></div> Developer Dashboard
                            </Link>
                          )}
                          {userRole !== 'agent' && userRole !== 'client' && userRole !== 'super_admin' && (
                            <Link href={userRole === 'owner' ? "/dashboard/owner/properties" : "/properties"} onClick={() => setIsUserMenuOpen(false)} className="px-4 py-2.5 hover:bg-slate-50 flex items-center gap-3 text-sm font-medium text-slate-700 hover:text-slate-900">
                              <div className="w-5"><Menu className="w-4 h-4" /></div> My Properties
                            </Link>
                          )}
                          {userRole !== 'agent' && userRole !== 'client' && userRole !== 'owner' && userRole !== 'super_admin' && (
                            <Link href="/saved" onClick={() => setIsUserMenuOpen(false)} className="px-4 py-2.5 hover:bg-slate-50 flex items-center gap-3 text-sm font-medium text-slate-700 hover:text-slate-900">
                              <div className="w-5"><Globe className="w-4 h-4" /></div> Saved Searches
                            </Link>
                          )}
                        </div>

                        <div className="border-t border-slate-100 mt-1 pt-1">
                          <Link href="/profile" onClick={() => setIsUserMenuOpen(false)} className="px-4 py-2.5 hover:bg-slate-50 flex items-center gap-3 text-sm font-medium text-slate-700 hover:text-slate-900">
                            <div className="w-5"><Settings className="w-4 h-4" /></div> Profile
                          </Link>
                          {user?.plan_tier !== 'enterprise' && (
                            <button
                              onClick={handleUpgradeToAgency}
                              disabled={isPending || loadingCost}
                              className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-3 text-sm font-bold text-orange-600 hover:text-orange-700 disabled:opacity-50 transition-colors cursor-pointer"
                            >
                              <div className="w-5">
                                {isPending ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Sparkles className="w-4 h-4 text-orange-500 animate-pulse" />
                                )}
                              </div>
                              {loadingCost ? 'Loading...' : `Upgrade to Agency account (${agencyCost} CR)`}
                            </button>
                          )}
                          <form action="/auth/signout" method="post">
                            <button className="w-full text-left px-4 py-2.5 hover:bg-red-50 flex items-center gap-3 text-sm font-bold text-red-500">
                              <div className="w-5"><LogOut className="w-4 h-4" /></div> Logout
                            </button>
                          </form>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1.5 md:gap-3">
                {/* Sign In - Orange to green gradient, subdued on signup page */}
                <Link
                  href="/auth/login"
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-bold transition-all text-xs md:text-sm md:px-4 md:py-2 md:rounded-xl ${pathname === '/auth/signup'
                    ? 'bg-white/10 text-white/70 hover:bg-white/20 border border-white/20'
                    : 'bg-gradient-to-r from-orange-500 to-emerald-500 text-white hover:from-orange-400 hover:to-emerald-400 shadow-lg shadow-orange-500/30'
                    }`}
                >
                  Sign In
                </Link>

                {/* Sign Up - Green gradient, subdued on login page */}
                <Link
                  href="/auth/signup"
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition-all text-xs md:text-sm md:px-5 md:py-2.5 md:rounded-xl ${pathname === '/auth/login'
                    ? 'bg-white/10 text-white/70 hover:bg-white/20 border border-white/20'
                    : 'bg-gradient-to-r from-lime-500 to-emerald-600 text-white hover:from-lime-400 hover:to-emerald-500 shadow-lg shadow-lime-500/50'
                    }`}
                >
                  Sign Up
                </Link>

              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-1.5 hover:bg-cyan-500/20 rounded-md text-white shrink-0"
            >
              {isMobileMenuOpen ? <X className="w-5.5 h-5.5" /> : <Menu className="w-5.5 h-5.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-white/10 animate-in slide-in-from-top-4 duration-200">
          <div className="px-4 py-4 space-y-2">
            <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-white hover:text-cyan-300 hover:bg-white/10">
              Home
            </Link>
            <Link href="/properties" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-white hover:text-cyan-300 hover:bg-white/10">
              Properties
            </Link>
            {isLoggedIn && (
              <Link
                href={dashboardUrl}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-black bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-lg shadow-cyan-500/10"
              >
                <Home className="w-5 h-5 text-cyan-400" />
                DASHBOARD
              </Link>
            )}

            {isLoggedIn ? (
              <Link href="/calculator-comisioane" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-orange-400 hover:text-orange-300 hover:bg-white/10">
                <Calculator className="w-4 h-4" />
                Calculator Comisioane
              </Link>
            ) : (
              <>
                <Link href="/for-clients" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-cyan-300 hover:bg-white/10">
                  For Clients
                </Link>
                <Link href="/for-owners" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-cyan-300 hover:bg-white/10">
                  For Owners
                </Link>
                <Link href="/for-brokers" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-cyan-300 hover:bg-white/10">
                  For Brokers, Agencies &amp; Developers
                </Link>
              </>
            )}
            <div className="space-y-1">
              <div className="px-3 py-2 text-base font-medium text-gray-400 uppercase text-xs tracking-wider">Services</div>
              {SERVICES.map((service) => (
                <Link
                  key={service.slug}
                  href={`/services/${service.slug}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 pl-6 rounded-md text-sm font-medium text-gray-300 hover:text-cyan-300 hover:bg-white/5"
                >
                  {service.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
