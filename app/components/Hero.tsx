import { Search, MapPin, Building, Users, Star, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import HomeValuationWidget from './HomeValuationWidget';
import RoleSelector from './RoleSelector';

export default function Hero() {
    return (
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-12 pb-6 md:pt-24 md:pb-8 overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-30">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-cyan-500 rounded-full blur-3xl" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-lime-500 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <div className="flex justify-center mb-6">
                    <HomeValuationWidget variant="home" />
                </div>



                <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 tracking-tight leading-tight" style={{ textShadow: '0 0 40px rgba(0,0,0,0.8), 0 4px 20px rgba(0,0,0,0.5)' }}>
                    Find <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-amber-500">Real</span> Property <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-amber-500">Price</span>
                </h1>

                <p className="text-xl text-white mb-8 max-w-2xl mx-auto leading-relaxed font-medium" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.8)' }}>
                    <span className="text-orange-500 font-bold">Buy</span>, <span className="text-emerald-500 font-bold">Sell</span>, or <span className="text-blue-500 font-bold">Rent</span>. Virtual Tours, AI, Market Insights, plus other smart features like <span className="text-purple-400 font-bold">Real Market Price Value</span> for all Properties.
                </p>

                {/* Action Button */}
                <div className="max-w-xs mx-auto mb-8">
                    <Link href="/properties" className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white p-4 rounded-xl font-bold text-lg transition-all hover:scale-105 flex items-center justify-center gap-2 shadow-2xl shadow-cyan-500/50 border-2 border-cyan-300">
                        <Search className="w-5 h-5" />
                        Find Properties
                    </Link>
                </div>

                <div className="mb-0">
                    <RoleSelector mode="navigation" />
                </div>

            </div>
        </div>
    );
}
