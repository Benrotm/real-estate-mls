import React from 'react';
import Link from 'next/link';
import { 
    Video, Users, TrendingUp, Calculator, Target, Shield, 
    ArrowRight, BadgeCheck, CheckCircle2 
} from 'lucide-react';
import { getMarketingPage } from '@/app/lib/actions/marketing-pages';

interface MarketingPageLayoutProps {
    pageKey: string;
}

const ICON_MAP: Record<string, any> = {
    Video,
    Users,
    TrendingUp,
    Calculator,
    Target,
    Shield
};

export default async function MarketingPageLayout({ pageKey }: MarketingPageLayoutProps) {
    const { page } = await getMarketingPage(pageKey);

    if (!page) {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-8 pt-24 text-center">
                <h1 className="text-2xl font-bold">Pagina nu a fost găsită</h1>
                <p className="text-slate-400 mt-2">Această pagină de marketing nu este configurată în baza de date.</p>
                <Link href="/" className="mt-6 px-6 py-2.5 bg-orange-600 rounded-xl text-xs uppercase font-bold tracking-wider">
                    Mergi la Acasă
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white pt-24 pb-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto space-y-12">
                {/* Hero Header Area */}
                <header className="text-center space-y-4 max-w-3xl mx-auto">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20 uppercase tracking-widest">
                        <BadgeCheck className="w-3.5 h-3.5" />
                        Imobum Platform
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
                        {page.title}
                    </h1>
                    {page.subtitle && (
                        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                            {page.subtitle}
                        </p>
                    )}
                </header>

                {/* Dynamic Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-6">
                    {page.sections.map((section: any, idx: number) => {
                        const IconComponent = ICON_MAP[section.icon] || Target;
                        const bgGradientClass = section.bg_gradient || 'from-slate-900 via-slate-900 to-indigo-950/40';

                        return (
                            <div 
                                key={section.id || idx} 
                                className={`bg-gradient-to-br ${bgGradientClass} border border-white/5 text-white rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:border-white/10 group flex flex-col justify-between`}
                            >
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
                                <div className="relative z-10 space-y-5 flex-1">
                                    <div className="space-y-3">
                                        <span className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white mb-4 border border-white/10">
                                            <IconComponent className="w-5 h-5" />
                                        </span>
                                        <h3 className="text-lg font-bold tracking-tight leading-snug">
                                            {section.title}
                                        </h3>
                                        <p className="text-indigo-100/80 text-xs leading-relaxed font-medium">
                                            {section.desc}
                                        </p>
                                    </div>

                                    {section.items && section.items.length > 0 && (
                                        <ul className="space-y-2 pt-2 text-left">
                                            {section.items.map((item: string, itemIdx: number) => (
                                                <li 
                                                    key={itemIdx} 
                                                    className="text-xs text-indigo-50/80 leading-relaxed pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-orange-400 font-normal"
                                                >
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                {/* Card CTAs */}
                                <div className="mt-8 pt-4 border-t border-white/5 relative z-10 space-y-3">
                                    {section.cta_text && section.cta_link && (
                                        <Link 
                                            href={section.cta_link}
                                            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg hover:shadow-orange-500/10 active:scale-95"
                                        >
                                            {section.cta_text}
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </Link>
                                    )}
                                    {section.secondary_cta_text && section.secondary_cta_link && (
                                        <Link 
                                            href={section.secondary_cta_link}
                                            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all border border-white/10 active:scale-95"
                                        >
                                            {section.secondary_cta_text}
                                        </Link>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
