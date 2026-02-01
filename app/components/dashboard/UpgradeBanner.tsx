
import Link from 'next/link';
import { Lock, Sparkles, ArrowRight } from 'lucide-react';

interface UpgradeBannerProps {
    title?: string;
    description?: string;
    buttonText?: string;
    buttonLink?: string;
}

export default function UpgradeBanner({
    title = "Upgrade to Pro to Access Leads",
    description = "Unlock the full potential of your property management. Get access to verified leads, detailed insights, and direct communication tools with our Pro plan.",
    buttonText = "View Plans & Pricing",
    buttonLink = "/pricing" // Or contact sales
}: UpgradeBannerProps) {
    return (
        <div className="w-full max-w-4xl mx-auto my-8">
            <div className="relative overflow-hidden bg-slate-900 rounded-2xl p-8 md:p-12 text-center border border-slate-800 shadow-2xl">
                {/* Background decorative elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-500/10 blur-[100px] rounded-full"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[100px] rounded-full"></div>
                </div>

                <div className="relative z-10 flex flex-col items-center max-w-2xl mx-auto">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-6 border border-slate-700 shadow-inner">
                        <Lock className="w-8 h-8 text-orange-500" />
                    </div>

                    <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">
                        {title}
                    </h2>

                    <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                        {description}
                    </p>

                    <Link
                        href={buttonLink}
                        className="group relative inline-flex items-center justify-center px-8 py-3.5 text-base font-bold text-white bg-orange-600 rounded-lg overflow-hidden transition-all hover:bg-orange-500 hover:shadow-[0_0_20px_rgba(234,88,12,0.3)]"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            {buttonText}
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                    </Link>

                    <p className="mt-6 text-sm text-slate-500">
                        Have questions? <Link href="/contact" className="text-slate-400 hover:text-white underline decoration-slate-600 underline-offset-4">Contact our sales team</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
