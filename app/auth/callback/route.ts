import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in search params, use it as the redirection URL
    const next = searchParams.get('next') ?? '/dashboard'

    if (code) {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        cookieStore.set({ name, value, ...options })
                    },
                    remove(name: string, options: CookieOptions) {
                        cookieStore.set({ name, value: '', ...options })
                    },
                },
            }
        )
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // Check for user role and redirect accordingly
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                // Check if we have a pending role update from signup
                const signupRole = cookieStore.get('signup_role')?.value;
                let role = user.user_metadata?.role;

                // Priority: Cookie Role > Metadata Role > Profile Role > 'client'
                if (signupRole && ['client', 'agent', 'owner', 'developer'].includes(signupRole)) {
                    // Update the user's metadata and profile with the selected role
                    // We do this because the trigger 'handle_new_user' might have already run with default 'client'
                    // or metadata was missing during social signup.

                    // 1. Update Profile (Most critical for app logic)
                    await supabase
                        .from('profiles')
                        .update({ role: signupRole, listings_limit: signupRole === 'owner' ? 1 : (signupRole === 'agent' ? 5 : 0) }) // Simple default logic, trigger does better but we override here
                        .eq('id', user.id);

                    // 2. Update Metadata (Enable future sessions to see it)
                    await supabase.auth.updateUser({
                        data: { role: signupRole }
                    });

                    role = signupRole;

                    // Cleanup cookie
                    cookieStore.set({ name: 'signup_role', value: '', maxAge: 0, path: '/' });
                }

                // Fallback to DB profile if missing in metadata and no cookie override
                if (!role) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', user.id)
                        .single();
                    role = profile?.role;
                }

                let targetPath = next;
                if (next === '/dashboard' || next === '/') {
                    if (role === 'owner') targetPath = '/dashboard/owner';
                    else if (role === 'agent') targetPath = '/dashboard/agent';
                    else if (role === 'developer') targetPath = '/dashboard/developer';
                    else if (role === 'super_admin') targetPath = '/dashboard/admin';
                    else if (role === 'client') targetPath = '/properties';
                }

                return NextResponse.redirect(`${origin}${targetPath}`)
            }

            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
