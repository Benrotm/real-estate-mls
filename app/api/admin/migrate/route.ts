
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret');

    if (secret !== 'force_migration_2026') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        return NextResponse.json({ error: 'Missing env vars' }, { status: 500 });
    }

    // Initialize Supabase with Service Role Key (Admin access)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    try {
        const featureLabel = "Direct Message";
        const featureKey = "direct_message";

        // 1. Get all plans
        const { data: plans, error: plansError } = await supabase.from('plans').select('role, name');
        if (plansError) throw plansError;
        if (!plans || plans.length === 0) return NextResponse.json({ message: "No plans found" });

        // 2. Check for existing features
        const { data: existing, error: existingError } = await supabase
            .from('plan_features')
            .select('role, plan_name')
            .eq('feature_key', featureKey);

        if (existingError) throw existingError;

        const existingSet = new Set(existing?.map(e => `${e.role}:${e.plan_name}`));

        // 3. Prepare inserts
        const inserts = plans
            .filter(p => !existingSet.has(`${p.role}:${p.name}`))
            .map(p => ({
                role: p.role,
                plan_name: p.name,
                feature_key: featureKey,
                feature_label: featureLabel,
                is_included: true, // Default to ENABLED for visibility, user can toggle off
                sort_order: 10 // Arbitrary sort order
            }));

        if (inserts.length > 0) {
            const { error: insertError } = await supabase.from('plan_features').insert(inserts);
            if (insertError) throw insertError;
            return NextResponse.json({ success: true, message: `Added ${inserts.length} 'Direct Message' feature entries.` });
        } else {
            return NextResponse.json({ success: true, message: "'Direct Message' feature already exists for all plans." });
        }

    } catch (e: any) {
        return NextResponse.json({ error: 'Unexpected error: ' + e.message }, { status: 500 });
    }
}
