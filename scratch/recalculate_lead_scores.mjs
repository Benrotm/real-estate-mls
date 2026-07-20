import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function recalculateScores() {
    console.log('Fetching leads...');
    const { data: leads, error } = await supabase.from('leads').select('*');
    if (error) {
        console.error('Failed to fetch leads:', error);
        return;
    }

    console.log(`Found ${leads.length} leads. Recalculating scores...`);

    let updatedCount = 0;
    for (const lead of leads) {
        let score = 0;

        // Move Urgency
        if (lead.move_urgency?.includes('Urgent') || lead.move_urgency === '< 1 month (Urgent)') score += 20;
        else if (lead.move_urgency?.includes('Moderate') || lead.move_urgency === '1-3 months (Moderate)') score += 15;
        else if (lead.move_urgency?.includes('Low') || lead.move_urgency === '> 3 months (Low)') score += 10;

        // Financial & Agent fields if present
        if (lead.payment_method === 'Cash') score += 15;
        if (lead.agent_interest_rating === 'High') score += 20;

        // Essential Preferences
        const maxB = Number(lead.budget_max) || 0;
        if (maxB > 0) score += maxB >= 100000 ? 20 : 15;

        if (lead.phone && lead.phone.trim().length >= 6) score += 15;
        if (lead.email && lead.email.trim().length >= 5) score += 5;

        if (lead.preference_type) score += 10;
        if (lead.preference_listing_type) score += 10;
        if (lead.preference_location_city || lead.preference_location_area) score += 10;
        if (lead.preference_rooms_min) score += 5;

        if (lead.source === 'Shared Link Form' || lead.created_via === 'invite_form') score += 10;

        const finalScore = Math.min(100, Math.max(0, score));

        if (finalScore !== lead.score) {
            const { error: updateErr } = await supabase.from('leads').update({ score: finalScore }).eq('id', lead.id);
            if (!updateErr) {
                console.log(`Updated lead ${lead.name} (${lead.id}): ${lead.score} -> ${finalScore}`);
                updatedCount++;
            } else {
                console.error(`Failed updating lead ${lead.id}:`, updateErr);
            }
        }
    }

    console.log(`Done! Recalculated and updated ${updatedCount} leads.`);
}

recalculateScores();
