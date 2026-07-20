import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data: allFeatures, error } = await supabase.from('plan_features').select('*');
    if (error) {
        console.error('Error:', error);
        return;
    }
    
    // Deduplicate
    const uniqueFeatures = Array.from(new Set((allFeatures || []).map(f => f.feature_key)))
      .map(key => {
        const match = allFeatures.find(f => f.feature_key === key);
        return {
          key: key,
          label: match?.feature_label || key,
          sort_order: match?.sort_order
        };
      });

    console.log('Unique Features count:', uniqueFeatures.length);
    console.log('Unique Features:', uniqueFeatures);
}
check();
