import { Building, Users, Star, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import RoleSelector from './RoleSelector';


export default function TrustStats() {
    return (
        <div className="bg-slate-900 py-20 px-4">
            <div className="max-w-7xl mx-auto flex flex-col items-center">

                <Link href="/auth/signup" className="inline-block mb-10 px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-bold tracking-wide uppercase shadow-xl shadow-cyan-500/50 hover:scale-105 transition-transform cursor-pointer hover:from-cyan-400 hover:to-blue-400">
                    ⭐ Find out the current market value of a property
                </Link>

                <div className="w-full mb-16">
                    <RoleSelector mode="navigation" />
                </div>



                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 w-full max-w-3xl mx-auto">
                    <div className="text-center">
                        <div className="w-14 h-14 bg-gradient-to-br from-lime-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg shadow-lime-500/50">
                            <Users className="w-7 h-7" />
                        </div>
                        <div className="text-lime-200 text-sm font-bold uppercase tracking-wide">Happy Clients</div>
                    </div>
                    <div className="text-center">
                        <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg shadow-purple-500/50">
                            <Star className="w-7 h-7" />
                        </div>
                        <div className="text-4xl font-bold text-white mb-2">98%</div>
                        <div className="text-purple-200 text-sm font-bold uppercase tracking-wide">Satisfaction Rate</div>
                    </div>
                    <div className="text-center">
                        <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg shadow-yellow-500/50">
                            <ShieldCheck className="w-7 h-7" />
                        </div>
                        <div className="text-4xl font-bold text-white mb-2">24/7</div>
                        <div className="text-yellow-200 text-sm font-bold uppercase tracking-wide">Support Available</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
