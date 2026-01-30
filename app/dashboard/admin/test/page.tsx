import { createClient } from '@/app/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function TestPage() {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    let profile = null;
    let propertiesCount = 0;
    let propertiesError = null;

    if (user) {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        profile = data;

        try {
            const { count, error: countError } = await supabase.from('properties').select('*', { count: 'exact', head: true });
            propertiesCount = count || 0;
            propertiesError = countError;
        } catch (e) {
            propertiesError = e;
        }
    }

    return (
        <div className="p-10 font-mono text-sm max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">System Diagnostic: Admin Access</h1>

            <div className="grid gap-6">
                <section className="p-4 border rounded bg-slate-50">
                    <h3 className="font-bold mb-2">1. Authentication</h3>
                    <div>User ID: {user?.id || 'None'}</div>
                    <div>Email: {user?.email || 'None'}</div>
                    <div className="text-red-500">{authError?.message}</div>
                </section>

                <section className="p-4 border rounded bg-slate-50">
                    <h3 className="font-bold mb-2">2. Profile & Role</h3>
                    <div>Role: <strong>{profile?.role || 'Missing'}</strong></div>
                    <div>Name: {profile?.full_name}</div>
                    <div className="text-slate-500 text-xs mt-2">{JSON.stringify(profile)}</div>
                </section>

                <section className="p-4 border rounded bg-slate-50">
                    <h3 className="font-bold mb-2">3. Database Access (Properties)</h3>
                    <div>Total Properties: {propertiesCount}</div>
                    {propertiesError && (
                        <div className="text-red-600 bg-red-50 p-2 mt-2 border border-red-200">
                            Error: {propertiesError.message || JSON.stringify(propertiesError)}
                            <br />
                            Hint: {propertiesError.hint} | Code: {propertiesError.code}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
