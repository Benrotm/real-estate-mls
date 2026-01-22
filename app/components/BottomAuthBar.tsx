'use client';

import Link from 'next/link';
import { UserProfile } from '../lib/auth';
import { usePathname } from 'next/navigation';

interface BottomAuthBarProps {
    user: UserProfile | null;
}

export default function BottomAuthBar({ user }: BottomAuthBarProps) {
    const pathname = usePathname();

    // Don't show if user is logged in
    if (user) return null;

    // Don't show on auth pages to avoid clutter
    if (pathname.startsWith('/auth')) return null;

    return (
        <div className="fixed bottom-0 left-0 w-full bg-slate-900/95 backdrop-blur-md border-t border-white/10 p-4 z-50 animate-in slide-in-from-bottom-full duration-300">
            <div className="flex gap-4 max-w-7xl mx-auto">
                <Link
                    href="/auth/login"
                    className="flex-1 flex justify-center items-center py-3 rounded-xl font-bold text-white bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors"
                >
                    Sign In
                </Link>
                <Link
                    href="/auth/signup"
                    className="flex-1 flex justify-center items-center py-3 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 shadow-lg shadow-orange-500/20 transition-all"
                >
                    Sign Up
                </Link>
            </div>
        </div>
    );
}
