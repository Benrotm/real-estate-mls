
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    'https://cwfhcrftwsxsovexkero.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3ZmhjcmZ0d3N4c292ZXhrZXJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3MDc5NDAsImV4cCI6MjA4NDI4Mzk0MH0.v1zvSTkuE_lyn6IqtN4Vs2oPFguWzPe6DWrXMfTbXe0'
);

async function inspect() {
    console.log('--- PLANS ---');
    const { data: plans } = await supabase.from('plans').select('id, role, name');
    console.table(plans);

    console.log('--- FEATURE COUNTS ---');
    const { data: features } = await supabase.from('plan_features').select('plan_name, role, feature_key');
    const counts: any = {};
    if (features) {
        features.forEach(f => {
            const k = `${f.role}::${f.plan_name}`;
            counts[k] = (counts[k] || 0) + 1;
        });
    }
    console.table(counts);
}
inspect();
