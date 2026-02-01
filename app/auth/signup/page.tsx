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

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        first_name: firstName,
                        last_name: lastName,
                        role: role,
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

                <form className="mt-8 space-y-4" onSubmit={handleSignUp}>
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

                <div className="mt-6">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">Or sign up with</span>
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-3 gap-3">
                        <button
                            type="button"
                            onClick={() => handleSocialLogin('google')}
                            className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                        >
                            <span className="sr-only">Sign up with Google</span>
                            <Chrome className="w-5 h-5" />
                        </button>
                        <button
                            type="button"
                            className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 opacity-50 cursor-not-allowed"
                            disabled
                        >
                            <span className="sr-only">Sign up with Apple</span>
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M14.25.18l.9.2.73.26.59.3.5.32.41.34.34.41.32.5.3.59.26.73.2.9.13.98v.24l-.13.98-.2.9-.26.73-.3.59-.32.5-.41.34-.34.41-.5.32-.59.3-.73.26-.9.2-.98.13h-.24l-.98-.13-.9-.2-.73-.26-.59-.3-.5-.32-.41-.34-.34.41-.32-.5-.3-.59-.26-.73-.2-.9-.13-.98V9l.13-.98.2-.9.26-.73.3-.59.32-.5.41-.34.34-.41.5-.32.59-.3.73-.26.9-.2.98-.13h.24l.98.13zM12 2a10 10 0 100 20 10 10 0 000-20zm0 2a8 8 0 110 16 8 8 0 010-16z" /></svg>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSocialLogin('github')}
                            className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                        >
                            <span className="sr-only">Sign up with GitHub</span>
                            <Github className="w-5 h-5" />
                        </button>
                    </div>
                </div>

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
