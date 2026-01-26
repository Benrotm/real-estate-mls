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
                let role = user.user_metadata?.role;

                // Fallback to DB profile if missing in metadata
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
