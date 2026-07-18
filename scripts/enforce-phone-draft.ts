import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function main() {
    console.log('Fetching all non-draft properties in batches...');
    let offset = 0;
    const batchSize = 1000;
    let allProperties: any[] = [];

    while (true) {
        const { data: properties, error: fetchError } = await supabase
            .from('properties')
            .select('id, title, owner_phone, status')
            .neq('status', 'draft')
            .range(offset, offset + batchSize - 1);

        if (fetchError) {
            console.error('Error fetching properties:', fetchError);
            process.exit(1);
        }

        if (!properties || properties.length === 0) {
            break;
        }

        allProperties = allProperties.concat(properties);
        if (properties.length < batchSize) {
            break;
        }
        offset += batchSize;
    }

    console.log(`Found ${allProperties.length} total non-draft properties across all batches.`);

    const idsToDraft: string[] = [];
    for (const prop of allProperties) {
        const phone = (prop.owner_phone || '').trim();
        const hasValidPhone = phone !== '' && phone.toLowerCase() !== 'n/a' && phone.replace(/\D/g, '').length >= 6;
        if (!hasValidPhone) {
            idsToDraft.push(prop.id);
        }
    }

    console.log(`Identified ${idsToDraft.length} properties missing valid owner_phone that need to be demoted to draft.`);

    if (idsToDraft.length > 0) {
        const updateBatchSize = 500;
        for (let i = 0; i < idsToDraft.length; i += updateBatchSize) {
            const batch = idsToDraft.slice(i, i + updateBatchSize);
            const { error: updateError } = await supabase
                .from('properties')
                .update({ status: 'draft', updated_at: new Date().toISOString() })
                .in('id', batch);

            if (updateError) {
                console.error(`Error updating batch ${i} to draft:`, updateError);
                process.exit(1);
            }
        }
        console.log(`Successfully updated all ${idsToDraft.length} properties to draft!`);
    } else {
        console.log('No properties to update. All active properties already have valid owner_phone!');
    }
}

main();
