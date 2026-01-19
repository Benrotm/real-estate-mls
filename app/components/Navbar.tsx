'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../context/LanguageContext';
import { User, Menu, Home, Plus, Globe, ChevronDown, Settings, LogOut, Shield, X, Hammer } from 'lucide-react';
import { SERVICES } from '../lib/services';

export default function Navbar() {
  const isLoggedIn = true; // Demo active
  const userEmail = "bensilion@gmail.com"; // Requested Super Admin email
  const isSuperAdmin = userEmail === 'bensilion@gmail.com';

  const { language, setLanguage } = useLanguage();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const languages = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'ro', label: 'Română', flag: '🇷🇴' },
    { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#1e293b] border-b border-white/10 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 cursor-pointer group">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center text-white group-hover:rotate-3 transition-transform shadow-lg shadow-cyan-500/50">
              <Home className="w-5 h-5 fill-current" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">
              PropList
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
            <Link href="/pricing" className="text-sm font-bold text-white hover:text-cyan-300 transition-colors hover:bg-white/10 px-3 py-2 rounded-md">
              Create Account
            </Link>

            {/* Services Dropdown */}
            <div className="relative group">
              <button
                onClick={() => setIsServicesOpen(!isServicesOpen)}
                onMouseEnter={() => setIsServicesOpen(true)}
                className="text-sm font-bold text-white hover:text-cyan-300 transition-colors hover:bg-white/10 px-3 py-2 rounded-md flex items-center gap-1"
              >
                Services <ChevronDown className="w-4 h-4 opacity-70" />
              </button>

              {/* Dropdown Menu - Kept same logic, just styling tweaks if needed */}
              {isServicesOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsServicesOpen(false)}></div>
                  <div
                    onMouseLeave={() => setIsServicesOpen(false)}
                    className="absolute left-0 mt-0 w-64 bg-slate-800 rounded-xl shadow-2xl border border-white/10 py-2 z-20 grid grid-cols-1 overflow-hidden"
                  >
                    {SERVICES.map((service) => (
                      <Link
                        key={service.slug}
                        href={`/services/${service.slug}`}
                        onClick={() => setIsServicesOpen(false)}
                        className="px-4 py-3 text-sm text-gray-200 hover:bg-cyan-500/10 hover:text-cyan-300 flex items-center gap-3 transition-colors font-medium"
                      >
                        <service.icon className="w-4 h-4 text-cyan-400" />
                        {service.title}
                      </Link>
                    ))}
                    <div className="border-t border-white/10 mt-2 pt-2">
                      <Link
                        href="/services"
                        onClick={() => setIsServicesOpen(false)}
                        className="px-4 py-2 text-xs font-bold text-center text-cyan-400 hover:text-cyan-300 block"
                      >
                        View All Services
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">

            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center gap-1 p-2 rounded-lg text-white hover:bg-white/10 hover:text-cyan-300 transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span className="text-sm font-bold uppercase">{language}</span>
                <ChevronDown className="w-3 h-3" />
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
                <Link href="/properties/add" className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-bold hover:bg-orange-600 transition-all shadow-lg hover:-translate-y-0.5">
                  <Plus className="w-4 h-4" />
                  <span>List Property</span>
                </Link>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 px-2 py-1 text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 border-2 border-orange-500">
                      <User className="w-5 h-5" />
                    </div>
                    <span className="hidden md:block text-sm font-bold">{userEmail.split('@')[0]}</span>
                  </button>

                  {isUserMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsUserMenuOpen(false)}></div>
                      <div className="absolute right-0 mt-3 w-64 bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 py-2 z-20 animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="px-4 py-4 border-b border-slate-100">
                          <div className="font-bold text-base">{userEmail.split('@')[0]}</div>
                          <div className="text-sm text-slate-500">{userEmail}</div>
                          <div className="mt-2 flex gap-2">
                            <span className="text-xs font-bold bg-orange-100 text-orange-600 px-2 py-0.5 rounded w-fit uppercase">Free</span>
                            {isSuperAdmin && (
                              <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded w-fit uppercase">Admin</span>
                            )}
                          </div>
                        </div>

                        <div className="py-2">
                          {isSuperAdmin && (
                            <Link href="/dashboard/admin" onClick={() => setIsUserMenuOpen(false)} className="px-4 py-2.5 hover:bg-red-50 flex items-center gap-3 text-sm font-bold text-red-600 hover:text-red-700">
                              <div className="w-5"><Shield className="w-4 h-4" /></div> Super Admin
                            </Link>
                          )}
                          <Link href="/dashboard/owner" onClick={() => setIsUserMenuOpen(false)} className="px-4 py-2.5 hover:bg-slate-50 flex items-center gap-3 text-sm font-medium text-slate-700 hover:text-slate-900">
                            <div className="w-5"><Home className="w-4 h-4" /></div> Dashboard
                          </Link>
                          <Link href="/dashboard/agent" onClick={() => setIsUserMenuOpen(false)} className="px-4 py-2.5 hover:bg-slate-50 flex items-center gap-3 text-sm font-medium text-slate-700 hover:text-slate-900">
                            <div className="w-5"><User className="w-4 h-4" /></div> Agent Dashboard
                          </Link>
                          <Link href="/dashboard/developer" onClick={() => setIsUserMenuOpen(false)} className="px-4 py-2.5 hover:bg-slate-50 flex items-center gap-3 text-sm font-medium text-slate-700 hover:text-slate-900">
                            <div className="w-5"><Hammer className="w-4 h-4" /></div> Developer Dashboard
                          </Link>
                          <Link href="/properties" onClick={() => setIsUserMenuOpen(false)} className="px-4 py-2.5 hover:bg-slate-50 flex items-center gap-3 text-sm font-medium text-slate-700 hover:text-slate-900">
                            <div className="w-5"><Menu className="w-4 h-4" /></div> My Properties
                          </Link>
                          <Link href="/saved" onClick={() => setIsUserMenuOpen(false)} className="px-4 py-2.5 hover:bg-slate-50 flex items-center gap-3 text-sm font-medium text-slate-700 hover:text-slate-900">
                            <div className="w-5"><Globe className="w-4 h-4" /></div> Saved Searches
                          </Link>
                        </div>

                        <div className="border-t border-slate-100 mt-1 pt-1">
                          <Link href="/profile" onClick={() => setIsUserMenuOpen(false)} className="px-4 py-2.5 hover:bg-slate-50 flex items-center gap-3 text-sm font-medium text-slate-700 hover:text-slate-900">
                            <div className="w-5"><Settings className="w-4 h-4" /></div> Profile
                          </Link>
                          <button className="w-full text-left px-4 py-2.5 hover:bg-red-50 flex items-center gap-3 text-sm font-bold text-red-500">
                            <div className="w-5 relative"><div className="w-4 h-4 border-2 border-red-500 rounded-full border-t-transparent animate-spin hidden" /> <span className="text-xl leading-none">→</span></div> Logout
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/auth/login" className="hidden md:flex items-center gap-2 text-white font-bold hover:text-cyan-300 transition-colors">
                  Sign In
                </Link>
                <Link href="/auth/signup" className="flex items-center gap-2 bg-gradient-to-r from-lime-500 to-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold hover:from-lime-400 hover:to-emerald-500 transition-all shadow-lg shadow-lime-500/50">
                  Sign Up
                </Link>

                <Link href="/properties/add" className="hidden lg:flex items-center gap-2 text-cyan-400 font-bold hover:text-cyan-300 ml-2">
                  <Plus className="w-5 h-5" />
                  <span>List Property</span>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 hover:bg-cyan-500/20 rounded-md text-white"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
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
            <Link href="/pricing" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-white hover:text-cyan-300 hover:bg-white/10">
              Create Account
            </Link>
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
