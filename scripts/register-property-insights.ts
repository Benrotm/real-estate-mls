
import { createGlobalFeature } from '../app/lib/admin';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function main() {
    console.log('Registering Property Insights feature...');
    try {
        // We mock the admin check in development or use the service role if running as script
        // The admin.ts verifyAdmin might fail if no user. 
        // ACTUALLY: admin.ts uses `auth.getUser()`. Running this as a script won't have a session.
        // I should use a direct Supabase Admin Client script instead of reusing the server action 
        // if the server action relies strictly on cookie-based auth.

        // Let's look at `createGlobalFeature` in `app/lib/admin.ts`. 
        // It calls `verifyAdmin()`.

        // Alternative: I can use the `run_command` to execute a script that explicitly constructs 
        // the direct DB insertion, bypassing the server action's auth check, 
        // OR I can just use the browser to visit the admin page and add it manually?
        // No, user assumes I do it.

        // Let's write a script that uses `supabase-js` directly with SERVICE_ROLE_KEY.

        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const featureKey = 'property_insights';
        const featureLabel = 'Property Insights';

        // 1. Get all plans
        const { data: plans, error: plansError } = await supabase.from('plans').select('role, name');
        if (plansError) throw plansError;

        console.log(`Found ${plans.length} plans.`);

        // 2. Insert for each plan
        for (const plan of plans) {
            // Check existence
            const { data: existing } = await supabase
                .from('plan_features')
                .select('id')
                .eq('role', plan.role)
                .eq('plan_name', plan.name)
                .eq('feature_key', featureKey)
                .maybeSingle();

            if (!existing) {
                const { error: insertError } = await supabase.from('plan_features').insert({
                    role: plan.role,
                    plan_name: plan.name,
                    feature_key: featureKey,
                    feature_label: featureLabel,
                    is_included: false, // Default off
                    sort_order: 99
                });
                if (insertError) console.error(`Error adding to ${plan.name}:`, insertError.message);
                else console.log(`Added to ${plan.role} - ${plan.name}`);
            } else {
                console.log(`Skipped ${plan.role} - ${plan.name} (Already exists)`);
            }
        }

        console.log('Done.');

    } catch (e) {
        console.error('Error:', e);
    }
}

main();
