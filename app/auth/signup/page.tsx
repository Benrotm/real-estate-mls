'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { Mail, Phone, Lock, Loader2 } from 'lucide-react';
import { supabase } from '@/app/lib/supabase/client';
import RoleSelector from '@/app/components/RoleSelector';

export default function SignUpPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialRole = searchParams.get('role') as 'client' | 'agent' | 'owner' | 'developer' | null;
    const initialPlan = searchParams.get('plan');
    
    // Default to null to enable Step 1 (Role Selection) first
    const [role, setRole] = useState<'client' | 'agent' | 'owner' | 'developer' | null>(
        initialRole && ['client', 'agent', 'owner', 'developer'].includes(initialRole) ? initialRole : null
    );
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        if (!role) {
            setError('Te rugăm să alegi un rol înainte de a continua.');
            setIsLoading(false);
            return;
        }

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
                setError('Verifică-ți adresa de email pentru a confirma contul!');
            }
        } catch (err: any) {
            setError(err?.message || 'A apărut o eroare la crearea contului');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSocialLogin = async (provider: 'google') => {
        if (!role) {
            setError('Te rugăm să alegi un rol înainte de a continua.');
            return;
        }
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

                {/* Step 1: Role Selection */}
                <div className="-mx-4 sm:mx-0">
                    <RoleSelector
                        mode="selection"
                        selectedRole={role || undefined}
                        onSelect={setRole}
                        title="Choose Your Role"
                        verticalOnly={true}
                    />
                </div>

                {/* Step 2: Sign Up Methods (Google / Email) - Only shows up after a role is selected */}
                {role ? (
                    <div className="space-y-6 animate-fade-in">
                        {/* Social Login - Google Only */}
                        <div className="mt-6">
                            <button
                                type="button"
                                onClick={() => handleSocialLogin('google')}
                                className="w-full inline-flex justify-center items-center py-3 px-4 rounded-xl shadow-md bg-[#4285F4] text-sm font-bold text-white hover:bg-[#3367d6] transition-all hover:shadow-lg transform active:scale-[0.98] group relative overflow-hidden cursor-pointer"
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
                        </div>

                        {/* Divider */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500 font-medium">Or continue with email</span>
                            </div>
                        </div>

                        {/* Email Sign Up Form */}
                        <form className="space-y-4" onSubmit={handleSignUp}>
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
                                        className="appearance-none rounded-xl relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm bg-white"
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
                                        className="appearance-none rounded-xl relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm bg-white"
                                        placeholder="Last Name"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="email-address" className="sr-only">Email address</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-20">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="email-address"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        className="appearance-none rounded-xl relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm bg-transparent"
                                        placeholder="Email address"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="phone-number" className="sr-only">Phone Number</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-20">
                                        <Phone className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="phone-number"
                                        name="phone"
                                        type="tel"
                                        autoComplete="tel"
                                        required
                                        className="appearance-none rounded-xl relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm bg-transparent"
                                        placeholder="Phone Number"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="sr-only">Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-20">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="new-password"
                                        required
                                        className="appearance-none rounded-xl relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm bg-transparent"
                                        placeholder="Create Password"
                                    />
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all shadow-lg hover:shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        'Create Account'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                ) : null}

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
