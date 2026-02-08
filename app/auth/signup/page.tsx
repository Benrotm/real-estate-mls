'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { Mail, Phone, Lock, Building, Users, Briefcase, Chrome, Github, Loader2 } from 'lucide-react';
import { supabase } from '@/app/lib/supabase/client';

export default function SignUpPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialRole = searchParams.get('role') as 'client' | 'agent' | 'owner' | 'developer' | null;
    const initialPlan = searchParams.get('plan');
    const [role, setRole] = useState<'client' | 'agent' | 'owner' | 'developer'>(initialRole && ['client', 'agent', 'owner', 'developer'].includes(initialRole) ? initialRole : 'client');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        const firstName = formData.get('first-name') as string;
        const lastName = formData.get('last-name') as string;

        // Determine plan tier
        let planTier = 'free';
        if (initialPlan) {
            const lowerPlan = initialPlan.toLowerCase();
            if (lowerPlan.includes('premium') || lowerPlan.includes('pro') || lowerPlan.includes('growth')) planTier = 'pro';
            else if (lowerPlan.includes('enterprise') || lowerPlan.includes('scale')) planTier = 'enterprise';
        }

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        first_name: firstName,
                        last_name: lastName,
                        role: role,
                        plan_tier: planTier
                    },
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (error) throw error;

            if (data.session) {
                let targetPath = '/dashboard';
                if (role === 'owner') targetPath = '/dashboard/owner';
                else if (role === 'agent') targetPath = '/dashboard/agent';
                else if (role === 'developer') targetPath = '/dashboard/developer';
                else if (role === 'client') targetPath = '/dashboard/client';

                // Force full reload to update Navbar auth state
                window.location.href = targetPath;
            } else {
                // Email confirmation might be required
                setError('Check your email to confirm your account!');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred during signup');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSocialLogin = async (provider: 'google' | 'github') => {
        try {
            // Store selected role in a cookie for the callback to read
            document.cookie = `signup_role=${role}; path=/; max-age=300; SameSite=Lax`;

            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <div className="max-w-xl w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                <div className="text-center">
                    <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
                        <div className="bg-orange-500 p-2 rounded-lg group-hover:scale-110 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                        </div>
                        <span className="text-2xl font-bold text-slate-900">PropList</span>
                    </Link>
                    <h2 className="mt-2 text-3xl font-extrabold text-slate-900">Create your account</h2>
                    <p className="mt-2 text-sm text-slate-600">
                        Join thousands of users on the best real estate platform
                    </p>
                </div>

                {/* Role Selection */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <button
                        onClick={() => setRole('client')}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${role === 'client' ? 'border-orange-500 bg-orange-50' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}
                    >
                        <Users className={`mb-2 w-6 h-6 ${role === 'client' ? 'text-orange-600' : 'text-slate-400'}`} />
                        <span className={`text-xs font-bold ${role === 'client' ? 'text-orange-700' : 'text-slate-500'}`}>Client</span>
                    </button>
                    <button
                        onClick={() => setRole('owner')}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${role === 'owner' ? 'border-orange-500 bg-orange-50' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}
                    >
                        <Building className={`mb-2 w-6 h-6 ${role === 'owner' ? 'text-orange-600' : 'text-slate-400'}`} />
                        <span className={`text-xs font-bold ${role === 'owner' ? 'text-orange-700' : 'text-slate-500'}`}>Owner</span>
                    </button>
                    <button
                        onClick={() => setRole('agent')}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${role === 'agent' ? 'border-orange-500 bg-orange-50' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}
                    >
                        <Briefcase className={`mb-2 w-6 h-6 ${role === 'agent' ? 'text-orange-600' : 'text-slate-400'}`} />
                        <span className={`text-xs font-bold ${role === 'agent' ? 'text-orange-700' : 'text-slate-500'}`}>Agent</span>
                    </button>
                    <button
                        onClick={() => setRole('developer')}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${role === 'developer' ? 'border-orange-500 bg-orange-50' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}
                    >
                        <Building className={`mb-2 w-6 h-6 ${role === 'developer' ? 'text-orange-600' : 'text-slate-400'}`} />
                        <span className={`text-xs font-bold ${role === 'developer' ? 'text-orange-700' : 'text-slate-500'}`}>Developer</span>
                    </button>
                </div>

                {/* Social Login - Moved to Top */}
                <div className="mt-6 space-y-4">
                    {/* Google Button - Blue Fill with White Circle for Icon */}
                    <button
                        type="button"
                        onClick={() => handleSocialLogin('google')}
                        className="w-full inline-flex justify-center items-center py-3 px-4 rounded-xl shadow-md bg-[#4285F4] text-sm font-bold text-white hover:bg-[#3367d6] transition-all hover:shadow-lg transform active:scale-[0.98] group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent" />
                        <div className="bg-white p-1.5 rounded-full mr-3 shadow-sm group-hover:scale-110 transition-transform">
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                        </div>
                        <span className="relative">Sign up with Google</span>
                    </button>

                    {/* GitHub Button - Galaxy Gradient Fill */}
                    <button
                        type="button"
                        onClick={() => handleSocialLogin('github')}
                        className="w-full inline-flex justify-center items-center py-3 px-4 rounded-xl shadow-md bg-gradient-to-r from-[#8a3c90] to-[#2c2250] text-sm font-bold text-white hover:brightness-110 transition-all hover:shadow-lg transform active:scale-[0.98] relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <svg className="w-6 h-6 mr-3 fill-current group-hover:rotate-12 transition-transform" viewBox="0 0 24 24">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                        </svg>
                        <span className="relative">Sign up with GitHub</span>
                    </button>

                    {/* Apple Button - Aurora Gradient Icon on Black */}
                    <button
                        type="button"
                        disabled
                        className="w-full inline-flex justify-center items-center py-3 px-4 rounded-xl shadow-md bg-black text-sm font-bold text-white hover:bg-gray-900 transition-all hover:shadow-lg transform active:scale-[0.98] group relative overflow-hidden opacity-90 cursor-not-allowed"
                    >
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-50" />
                        <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24" fill="none">
                            <defs>
                                <linearGradient id="apple-aurora" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#25D9D9" />
                                    <stop offset="50%" stopColor="#A055F5" />
                                    <stop offset="100%" stopColor="#5E22E6" />
                                </linearGradient>
                            </defs>
                            <path
                                d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.09-.24 2.36-.92 3.69-.64 2.26.48 3.16 1.54 3.65 2.65-2.09 1.1-2.36 4.09-1.06 5.54-.7 1.83-1.6 3.64-3.36 4.62zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.16 2.29-2.09 4.34-3.74 4.25z"
                                fill="url(#apple-aurora)"
                                className="drop-shadow-[0_0_8px_rgba(160,85,245,0.6)]"
                            />
                        </svg>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200">
                            Sign up with Apple
                        </span>
                    </button>
                </div>

                <div className="relative mt-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500 font-medium">Or continue with email</span>
                    </div>
                </div>

                <form className="mt-6 space-y-4" onSubmit={handleSignUp}>
                    {error && (
                        <div className={`px-4 py-3 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-2 ${error.includes('email') ? 'bg-blue-50 border border-blue-100 text-blue-600' : 'bg-red-50 border border-red-100 text-red-600'}`}>
                            {error}
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="first-name" className="sr-only">First Name</label>
                            <input
                                id="first-name"
                                name="first-name"
                                type="text"
                                required
                                className="appearance-none rounded-xl relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                                placeholder="First Name"
                            />
                        </div>
                        <div>
                            <label htmlFor="last-name" className="sr-only">Last Name</label>
                            <input
                                id="last-name"
                                name="last-name"
                                type="text"
                                required
                                className="appearance-none rounded-xl relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                                placeholder="Last Name"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="email-address" className="sr-only">Email address</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="appearance-none rounded-xl relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                                placeholder="Email address"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="phone-number" className="sr-only">Phone Number</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Phone className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="phone-number"
                                name="phone"
                                type="tel"
                                autoComplete="tel"
                                required
                                className="appearance-none rounded-xl relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                                placeholder="Phone Number"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="password" className="sr-only">Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="new-password"
                                required
                                className="appearance-none rounded-xl relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                                placeholder="Create Password"
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all shadow-lg hover:shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </div>
                </form>

                <div className="text-center mt-4">
                    <p className="text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link href="/auth/login" className="font-bold text-orange-600 hover:text-orange-500">
                            Sign in directly
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
