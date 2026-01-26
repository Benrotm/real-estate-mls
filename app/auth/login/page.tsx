'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Phone, Lock, ArrowRight, Github, Twitter, Chrome, Loader2 } from 'lucide-react';
import { supabase } from '@/app/lib/supabase/client';

export default function LoginPage() {
    const router = useRouter();
    const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            if (data.user) {
                // Fetch profile to get role
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', data.user.id)
                    .single();

                const role = profile?.role;
                let targetPath = '/dashboard';

                if (role === 'owner') targetPath = '/dashboard/owner';
                else if (role === 'agent') targetPath = '/dashboard/agent';
                else if (role === 'developer') targetPath = '/dashboard/developer';
                else if (role === 'super_admin') targetPath = '/dashboard/admin';

                router.push(targetPath);
            } else {
                router.push('/dashboard');
            }
            router.refresh();
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
                        <span className="text-2xl font-bold text-slate-900">PropList</span>
                    </Link>
                    <h2 className="mt-2 text-3xl font-extrabold text-slate-900">Welcome back</h2>
                    <p className="mt-2 text-sm text-slate-600">
                        Sign in to access your dashboard
                    </p>
                </div>

                {/* Auth Method Toggle */}
                <div className="flex bg-gray-100 p-1 rounded-lg">
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

                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}
                    <input type="hidden" name="remember" defaultValue="true" />
                    <div className="rounded-md shadow-sm space-y-4">
                        {authMethod === 'email' ? (
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
                        ) : (
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
                        )}

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
                                    autoComplete="current-password"
                                    required
                                    className="appearance-none rounded-xl relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                                    placeholder="Password"
                                />
                            </div>
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
                            <Link href="#" className="font-medium text-orange-600 hover:text-orange-500">
                                Forgot your password?
                            </Link>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                'Sign in'
                            )}
                        </button>
                    </div>
                </form>

                <div className="mt-6">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">Or continue with</span>
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-3 gap-3">
                        <button
                            type="button"
                            onClick={() => handleSocialLogin('google')}
                            className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                        >
                            <span className="sr-only">Sign in with Google</span>
                            <Chrome className="w-5 h-5" />
                        </button>
                        <button
                            type="button"
                            className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 opacity-50 cursor-not-allowed"
                            disabled
                        >
                            <span className="sr-only">Sign in with Apple</span>
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M14.25.18l.9.2.73.26.59.3.5.32.41.34.34.41.32.5.3.59.26.73.2.9.13.98v.24l-.13.98-.2.9-.26.73-.3.59-.32.5-.41.34-.34.41-.5.32-.59.3-.73.26-.9.2-.98.13h-.24l-.98-.13-.9-.2-.73-.26-.59-.3-.5-.32-.41-.34-.34-.41-.32-.5-.3-.59-.26-.73-.2-.9-.13-.98V9l.13-.98.2-.9.26-.73.3-.59.32-.5.41-.34.34-.41.5-.32.59-.3.73-.26.9-.2.98-.13h.24l.98.13zM12 2a10 10 0 100 20 10 10 0 000-20zm0 2a8 8 0 110 16 8 8 0 010-16z" /></svg>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSocialLogin('github')}
                            className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                        >
                            <span className="sr-only">Sign in with GitHub</span>
                            <Github className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="text-center mt-4">
                    <p className="text-sm text-gray-600">
                        Don't have an account?{' '}
                        <Link href="/auth/signup" className="font-bold text-orange-600 hover:text-orange-500">
                            Create free account
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
