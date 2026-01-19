import { Search, MapPin, Building, Users, Star, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function Hero() {
    return (
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-20 pb-20 md:pt-32 md:pb-32 overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-30">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-cyan-500 rounded-full blur-3xl" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-lime-500 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <Link href="/pricing" className="inline-block mb-4 px-5 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-bold tracking-wide uppercase shadow-xl shadow-cyan-500/50 hover:scale-105 transition-transform cursor-pointer hover:from-cyan-400 hover:to-blue-400">
                    ⭐ Free Price Evaluation for Properties
                </Link>

                <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 tracking-tight leading-tight" style={{ textShadow: '0 0 40px rgba(0,0,0,0.8), 0 4px 20px rgba(0,0,0,0.5)' }}>
                    Find <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-lime-400 to-emerald-400">Your</span> Property
                </h1>

                <p className="text-2xl text-white mb-10 max-w-2xl mx-auto leading-relaxed font-medium" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.8)' }}>
                    <span className="text-orange-500 font-bold">Buy</span>, <span className="text-emerald-500 font-bold">Sell</span>, or <span className="text-blue-500 font-bold">Rent</span> with confidence on the most trusted Real Estate Platform. Virtual Tours, AI, Market Insights, and other features like <span className="text-purple-400 font-bold">Market Price Evaluation for Properties</span>.
                </p>

                {/* Search Bar */}
                <div className="max-w-3xl mx-auto flex flex-col md:flex-row gap-4 mb-16">
                    <Link href="/properties" className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white p-4 rounded-xl font-bold text-lg transition-all hover:scale-105 flex items-center justify-center gap-2 shadow-2xl shadow-cyan-500/50 border-2 border-cyan-300">
                        <Search className="w-5 h-5" />
                        Find Properties
                    </Link>
                    <div className="flex-[2] bg-white rounded-xl p-2 flex items-center shadow-2xl border-2 border-white">
                        <MapPin className="w-5 h-5 text-gray-600 ml-3" />
                        <input
                            type="text"
                            placeholder="Search by location, property type, or price..."
                            className="w-full px-4 py-2 text-gray-900 focus:outline-none placeholder-gray-500 font-semibold"
                        />
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 border-t-2 border-cyan-500/30 pt-12">
                    <div className="text-center">
                        <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg shadow-cyan-500/50">
                            <Building className="w-7 h-7" />
                        </div>
                        <div className="text-4xl font-bold text-white mb-2" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>2,500+</div>
                        <div className="text-cyan-200 text-sm font-bold uppercase tracking-wide">Properties Listed</div>
                    </div>
                    <div className="text-center">
                        <div className="w-14 h-14 bg-gradient-to-br from-lime-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg shadow-lime-500/50">
                            <Users className="w-7 h-7" />
                        </div>
                        <div className="text-4xl font-bold text-white mb-2" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>1,200+</div>
                        <div className="text-lime-200 text-sm font-bold uppercase tracking-wide">Happy Clients</div>
                    </div>
                    <div className="text-center">
                        <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg shadow-purple-500/50">
                            <Star className="w-7 h-7" />
                        </div>
                        <div className="text-4xl font-bold text-white mb-2" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>98%</div>
                        <div className="text-purple-200 text-sm font-bold uppercase tracking-wide">Satisfaction Rate</div>
                    </div>
                    <div className="text-center">
                        <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg shadow-yellow-500/50">
                            <ShieldCheck className="w-7 h-7" />
                        </div>
                        <div className="text-4xl font-bold text-white mb-2" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>24/7</div>
                        <div className="text-yellow-200 text-sm font-bold uppercase tracking-wide">Support Available</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
