
import { createClient } from '@/app/lib/supabase/server';

export default async function DebugFeaturesPage() {
    const supabase = await createClient();

    const { data: features, error: featuresError } = await supabase
        .from('plan_features')
        .select('*')
        .order('role')
        .order('plan_name');

    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, role, plan_tier')
        .limit(20);

    const { data: plans, error: plansError } = await supabase
        .from('plans')
        .select('*');

    return (
        <div className="p-8">
            <h1 className="text-2xl mb-4">Debug Features</h1>
            <h2 className="text-xl mb-2">Errors</h2>
            <pre className="bg-red-100 p-4 rounded mb-4">
                {JSON.stringify({ featuresError, profilesError, plansError }, null, 2)}
            </pre>

            <h2 className="text-xl mb-2">Plans (Source of Truth)</h2>
            <pre className="bg-blue-100 p-4 rounded mb-4 text-xs overflow-auto max-h-96">
                {JSON.stringify(plans, null, 2)}
            </pre>

            <h2 className="text-xl mb-2">Plan Features</h2>
            <pre className="bg-gray-100 p-4 rounded mb-4 text-xs overflow-auto max-h-96">
                {JSON.stringify(features, null, 2)}
            </pre>

            <h2 className="text-xl mb-2">Profiles</h2>
            <pre className="bg-gray-100 p-4 rounded mb-4 text-xs overflow-auto max-h-96">
                {JSON.stringify(profiles, null, 2)}
            </pre>
        </div>
    );
}
