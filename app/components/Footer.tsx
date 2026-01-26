import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-t border-slate-800 mt-auto relative overflow-hidden">
            {/* Background Decor matched from Hero */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-10">
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-cyan-500 rounded-full blur-3xl" />
                <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-lime-500 rounded-full blur-3xl" />
            </div>

            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="col-span-1 md:col-span-1">
                        <Link href="/" className="font-bold text-xl tracking-tight flex items-center gap-1 text-white">
                            Imobum
                        </Link>
                        <p className="mt-4 text-sm text-slate-400">
                            Premium real estate marketplace connecting buyers, sellers, and agents with cutting-edge technology.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold tracking-wider uppercase mb-4 text-white">Discover</h3>
                        <ul className="space-y-3">
                            <li><Link href="/properties" className="text-sm text-slate-400 hover:text-cyan-400 transition-colors">Properties</Link></li>
                            <li><Link href="/agents" className="text-sm text-slate-400 hover:text-cyan-400 transition-colors">Find an Agent</Link></li>
                            <li><Link href="/valuation" className="text-sm text-slate-400 hover:text-cyan-400 transition-colors">Property Valuation</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold tracking-wider uppercase mb-4 text-white">Company</h3>
                        <ul className="space-y-3">
                            <li><Link href="/about" className="text-sm text-slate-400 hover:text-cyan-400 transition-colors">About Us</Link></li>
                            <li><Link href="/careers" className="text-sm text-slate-400 hover:text-cyan-400 transition-colors">Careers</Link></li>
                            <li><Link href="/contact" className="text-sm text-slate-400 hover:text-cyan-400 transition-colors">Contact</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold tracking-wider uppercase mb-4 text-white">Legal</h3>
                        <ul className="space-y-3">
                            <li><Link href="/privacy" className="text-sm text-slate-400 hover:text-cyan-400 transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="text-sm text-slate-400 hover:text-cyan-400 transition-colors">Terms of Service</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 border-t border-slate-800 pt-8">
                    <p className="text-base text-center text-slate-500">
                        &copy; 2026 Imobum. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
