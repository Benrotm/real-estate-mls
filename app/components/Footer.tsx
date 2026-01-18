import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-card border-t border-border mt-auto">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="col-span-1 md:col-span-1">
                        <Link href="/" className="font-bold text-xl tracking-tight flex items-center gap-1">
                            Estate<span className="text-secondary">MLS</span>
                        </Link>
                        <p className="mt-4 text-sm text-foreground/60">
                            Premium real estate marketplace connecting buyers, sellers, and agents with cutting-edge technology.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold tracking-wider uppercase mb-4">Discover</h3>
                        <ul className="space-y-3">
                            <li><Link href="/properties" className="text-sm text-foreground/60 hover:text-secondary">Properties</Link></li>
                            <li><Link href="/agents" className="text-sm text-foreground/60 hover:text-secondary">Find an Agent</Link></li>
                            <li><Link href="/valuation" className="text-sm text-foreground/60 hover:text-secondary">Property Valuation</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold tracking-wider uppercase mb-4">Company</h3>
                        <ul className="space-y-3">
                            <li><Link href="/about" className="text-sm text-foreground/60 hover:text-secondary">About Us</Link></li>
                            <li><Link href="/careers" className="text-sm text-foreground/60 hover:text-secondary">Careers</Link></li>
                            <li><Link href="/contact" className="text-sm text-foreground/60 hover:text-secondary">Contact</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold tracking-wider uppercase mb-4">Legal</h3>
                        <ul className="space-y-3">
                            <li><Link href="/privacy" className="text-sm text-foreground/60 hover:text-secondary">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="text-sm text-foreground/60 hover:text-secondary">Terms of Service</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 border-t border-border pt-8">
                    <p className="text-base text-center text-foreground/40">
                        &copy; 2026 EstateMLS. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
