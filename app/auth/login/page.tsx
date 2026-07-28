'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Phone, Lock, ArrowRight, Github, Twitter, Chrome, Loader2 } from 'lucide-react';
import { supabase } from '@/app/lib/supabase/client';

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const roleParam = searchParams.get('role');
    const signupLink = roleParam ? `/auth/signup?role=${roleParam}` : '/auth/signup';

    const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const password = formData.get('password') as string;

        try {
            let result;
            if (authMethod === 'email') {
                const rawInput = ((formData.get('email') as string) || '').trim();
                let emailToUse = rawInput;
                if (!rawInput.includes('@') && rawInput.replace(/\D/g, '').length >= 6) {
                    emailToUse = `${rawInput.replace(/\D/g, '')}@client.imobum.com`;
                }
                result = await supabase.auth.signInWithPassword({
                    email: emailToUse,
                    password,
                });
            } else {
                const rawPhone = ((formData.get('phone') as string) || '').trim().replace(/\D/g, '');
                result = await supabase.auth.signInWithPassword({
                    email: `${rawPhone}@client.imobum.com`,
                    password,
                });
                if (result.error && rawPhone) {
                    result = await supabase.auth.signInWithPassword({
                        phone: rawPhone,
                        password,
                    });
                }
            }
            const { data, error } = result;

            if (error) throw error;

            if (data.user) {
                // Try to get role from metadata first (faster)
                let role = data.user.user_metadata?.role;

                // Fallback to DB profile if missing in metadata
                if (!role) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', data.user.id)
                        .single();
                    role = profile?.role;
                }

                let targetPath = '/dashboard';

                if (role === 'owner') targetPath = '/dashboard/owner';
                else if (role === 'agent') targetPath = '/dashboard/agent';
                else if (role === 'developer') targetPath = '/dashboard/developer';
                else if (role === 'super_admin') targetPath = '/dashboard/admin';
                else if (role === 'client' || role === 'client_no_agency') targetPath = '/dashboard/client';

                console.log('Login successful. Role:', role, 'Redirecting to:', targetPath);
                // Use window.location.href to force a full page reload.
                // This ensures the session cookie is correctly recognized by the server (Navbar updates)
                // and avoids any client-side router state issues.
                window.location.href = targetPath;
            } else {
                window.location.href = '/dashboard';
            }
            // router.refresh() is not needed with window.location.href as it triggers a full load
        } catch (err: any) {
            setError(err.message || 'An error occurred during sign in');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSocialLogin = async (provider: 'google' | 'github') => {
        try {
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
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                <div className="text-center">
                    <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
                        <div className="bg-orange-500 p-2 rounded-lg group-hover:scale-110 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                        </div>
                        <span className="text-2xl font-bold text-slate-900">Real Estate MLS</span>
                    </Link>
                    <h2 className="mt-2 text-3xl font-extrabold text-slate-900">Welcome back</h2>
                    <p className="mt-2 text-sm text-slate-600">
                        Sign in to access your dashboard
                    </p>
                </div>

                {/* Social Login - Moved to Top */}
                <div className="space-y-4 mb-8">
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
                        <span className="relative">Sign in with Google</span>
                    </button>
                </div>

                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500 font-medium">Or sign in with</span>
                    </div>
                </div>

                {/* Auth Method Toggle */}
                <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
                    <button
                        onClick={() => setAuthMethod('email')}
                        className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${authMethod === 'email' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Email
                    </button>
                    <button
                        onClick={() => setAuthMethod('phone')}
                        className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${authMethod === 'phone' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Phone
                    </button>
                </div>

                {/* Login Form */}
                <form className="space-y-4" onSubmit={handleLogin}>
                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    {authMethod === 'email' ? (
                        <div key="email-input-group">
                            <label htmlFor="email" className="sr-only">Email address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-20">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="appearance-none rounded-xl relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm bg-transparent"
                                    placeholder="Email address"
                                />
                            </div>
                        </div>
                    ) : (
                        <div key="phone-input-group">
                            <label htmlFor="phone" className="sr-only">Phone Number</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-20">
                                    <Phone className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    autoComplete="tel"
                                    required
                                    className="appearance-none rounded-xl relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm bg-transparent"
                                    placeholder="Phone Number"
                                />
                            </div>
                        </div>
                    )}

                    <div key="password-group">
                        <label htmlFor="password" className="sr-only">Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-20">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="appearance-none rounded-xl relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm bg-transparent"
                                placeholder="Password"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input
                                id="remember-me"
                                name="remember-me"
                                type="checkbox"
                                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                            />
                            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                                Remember me
                            </label>
                        </div>

                        <div className="text-sm">
                            <Link href="/auth/forgot-password" className="font-medium text-orange-600 hover:text-orange-500">
                                Forgot password?
                            </Link>
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
                                <span className="flex items-center">
                                    Sign in
                                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </span>
                            )}
                        </button>
                    </div>
                </form>

                <div className="text-center mt-4">
                    <p className="text-sm text-gray-600">
                        Don't have an account?{' '}
                        <Link href={signupLink} className="font-bold text-orange-600 hover:text-orange-500">
                            Create free account
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
