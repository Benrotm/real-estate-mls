'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
    Video, Users, TrendingUp, Calculator, Target, Shield, Compass, Truck, Sparkles, Hammer, Palette, Armchair, Zap, FileText,
    ChevronDown, ChevronUp, Menu
} from 'lucide-react';

interface Category {
    id: string;
    title: string;
    slug: string;
    description: string;
    icon: string;
}

interface CategoriesSidebarClientProps {
    categories: Category[];
    activeCategorySlug: string;
}

const ICON_MAP: Record<string, any> = {
    Video, Users, TrendingUp, Calculator, Target, Shield, Compass, Truck, Sparkles, Hammer, Palette, Armchair, Zap, FileText
};

export default function CategoriesSidebarClient({ categories, activeCategorySlug }: CategoriesSidebarClientProps) {
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const getIcon = (iconName: string) => {
        const Comp = ICON_MAP[iconName] || Target;
        return <Comp className="w-4 h-4" />;
    };

    const activeCategory = categories.find(c => c.slug === activeCategorySlug) || categories[0];

    return (
        <div className="lg:col-span-3 space-y-3">
            {/* Mobile Toggle Trigger */}
            <div className="block lg:hidden">
                <button
                    onClick={() => setIsMobileOpen(!isMobileOpen)}
                    className="w-full flex items-center justify-between px-5 py-3.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-white font-bold rounded-2xl text-xs uppercase tracking-wider transition-all"
                >
                    <span className="flex items-center gap-2">
                        <Menu className="w-4 h-4 text-orange-500" />
                        <span>{activeCategory ? activeCategory.title : 'Alege serviciul de care ai nevoie'}</span>
                    </span>
                    {isMobileOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>
            </div>

            {/* Categories container */}
            <div className={`${isMobileOpen ? 'block' : 'hidden'} lg:block bg-slate-900/30 p-5 rounded-3xl border border-slate-800 text-left animate-in slide-in-from-top-2 duration-200`}>
                <h3 className="hidden lg:block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">
                    Categorii Servicii
                </h3>
                <div className="flex flex-col gap-1.5 max-h-[60vh] lg:max-h-[70vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                    {categories.map((cat) => (
                        <Link
                            key={cat.slug}
                            href={`/services?category=${cat.slug}`}
                            onClick={() => setIsMobileOpen(false)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                                activeCategorySlug === cat.slug
                                    ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg shadow-orange-500/10'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <span className={activeCategorySlug === cat.slug ? 'text-white' : 'text-slate-500 group-hover:text-white'}>
                                {getIcon(cat.icon)}
                            </span>
                            <span>{cat.title}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
