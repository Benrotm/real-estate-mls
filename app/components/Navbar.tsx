'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../context/LanguageContext';
import { User, Menu, Home, Plus, Globe, ChevronDown } from 'lucide-react';
import { SERVICES } from '../lib/services';

export default function Navbar() {
  const isLoggedIn = false; // Mock auth state for demo
  const { language, setLanguage } = useLanguage();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);

  const languages = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'ro', label: 'Română', flag: '🇷🇴' },
    { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b-2 border-cyan-500/30 shadow-xl">
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
              <Home className="w-4 h-4" /> Home
            </Link>

            {/* Services Dropdown */}
            <div className="relative group">
              <button
                onClick={() => setIsServicesOpen(!isServicesOpen)}
                onMouseEnter={() => setIsServicesOpen(true)}
                className="text-sm font-bold text-white hover:text-cyan-300 transition-colors hover:bg-cyan-500/20 px-3 py-2 rounded-md flex items-center gap-1"
              >
                Services <ChevronDown className="w-4 h-4 opacity-70" />
              </button>

              {/* Dropdown Menu */}
              {isServicesOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsServicesOpen(false)}></div>
                  <div
                    onMouseLeave={() => setIsServicesOpen(false)}
                    className="absolute left-0 mt-0 w-64 bg-slate-800 rounded-xl shadow-2xl border-2 border-cyan-500/30 py-2 z-20 grid grid-cols-1 overflow-hidden"
                  >
                    {SERVICES.map((service) => (
                      <Link
                        key={service.slug}
                        href={`/services/${service.slug}`}
                        onClick={() => setIsServicesOpen(false)}
                        className="px-4 py-3 text-sm text-gray-200 hover:bg-cyan-500/20 hover:text-cyan-300 flex items-center gap-3 transition-colors font-medium"
                      >
                        <service.icon className="w-4 h-4 text-cyan-400" />
                        {service.title}
                      </Link>
                    ))}
                    <div className="border-t border-cyan-500/30 mt-2 pt-2">
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

            <Link href="/properties" className="text-sm font-bold text-white hover:text-cyan-300 transition-colors hover:bg-cyan-500/20 px-3 py-2 rounded-md">
              Properties
            </Link>
            <Link href="/pricing" className="text-sm font-bold text-white hover:text-cyan-300 transition-colors hover:bg-cyan-500/20 px-3 py-2 rounded-md">
              Pricing
            </Link>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">

            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center gap-1 p-2 rounded-lg text-white hover:bg-cyan-500/20 hover:text-cyan-300 transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span className="text-sm font-bold uppercase">{language}</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {isLangOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsLangOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-40 bg-slate-800 rounded-xl shadow-2xl border-2 border-cyan-500/30 py-1 z-20">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code as any);
                          setIsLangOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-cyan-500/20 hover:text-cyan-300 flex items-center gap-2 font-medium ${language === lang.code ? 'text-cyan-400 font-bold bg-cyan-500/20' : 'text-gray-200'}`}
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
                <Link href="/properties/add" className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg text-sm font-bold hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/50 transform hover:-translate-y-0.5">
                  <Plus className="w-4 h-4" />
                  <span>List Property</span>
                </Link>

                <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 text-white font-bold hover:bg-cyan-500/20 rounded-lg transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/50">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="hidden md:block text-sm">ben.sillion</span>
                </Link>
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
            <button className="md:hidden p-2 hover:bg-cyan-500/20 rounded-md text-white">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
