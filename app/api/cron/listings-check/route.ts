import { NextResponse } from 'next/server';
import { createAdminClient } from '@/app/lib/supabase/admin';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    const cronSecret = process.env.CRON_SECRET || 'listings_check_cron_2026';

    if (secret !== cronSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();

    // 1. Fetch listing_renewal setting cost
    const { data: settingsData, error: settingsError } = await supabase
        .from('platform_settings')
        .select('setting_value')
        .eq('setting_key', 'feature_costs')
        .single();

    if (settingsError) {
        console.error('Error fetching settings:', settingsError);
    }

    const costs = settingsData?.setting_value as Record<string, number> || {};
    const listingRenewalCost = typeof costs.listing_renewal === 'number' ? costs.listing_renewal : 2;

    // 2. Fetch all active properties
    const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select('id, user_id, title, published_at, created_at, status')
        .eq('status', 'active');

    if (propertiesError) {
        return NextResponse.json({ error: 'Error fetching properties', details: propertiesError.message }, { status: 500 });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const renewed: Array<{ id: string; title: string; user_id: string }> = [];
    const expired: Array<{ id: string; title: string; user_id: string }> = [];
    const skipped: Array<{ id: string; error: string }> = [];

    const expiredListings = (properties || []).filter(prop => {
        const dateToUse = prop.published_at || prop.created_at;
        if (!dateToUse) return false;
        return new Date(dateToUse).getTime() < thirtyDaysAgo.getTime();
    });

    for (const prop of expiredListings) {
        try {
            // Fetch owner's profile for current credits
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('credits')
                .eq('id', prop.user_id)
                .single();

            if (profileError) {
                skipped.push({ id: prop.id, error: `Failed to fetch profile: ${profileError.message}` });
                continue;
            }

            const currentCredits = profile?.credits || 0;

            if (currentCredits >= listingRenewalCost) {
                // RENEW listing
                const newBalance = currentCredits - listingRenewalCost;

                // Deduct credits from profile
                const { error: updateProfileError } = await supabase
                    .from('profiles')
                    .update({ credits: newBalance })
                    .eq('id', prop.user_id);

                if (updateProfileError) {
                    skipped.push({ id: prop.id, error: `Failed to deduct credits: ${updateProfileError.message}` });
                    continue;
                }

                // Log credit transaction
                const { error: logTxError } = await supabase
                    .from('credit_transactions')
                    .insert({
                        user_id: prop.user_id,
                        amount: -listingRenewalCost,
                        description: `Prelungire automată anunț: ${prop.title}`,
                        metadata: {
                            property_id: prop.id,
                            renewal: true,
                            cost: listingRenewalCost
                        }
                    });

                if (logTxError) {
                    console.error(`Error logging transaction for property ${prop.id}:`, logTxError);
                }

                // Update property published_at to current timestamp (resetting the 30-day window)
                const { error: updatePropError } = await supabase
                    .from('properties')
                    .update({ published_at: new Date().toISOString() })
                    .eq('id', prop.id);

                if (updatePropError) {
                    console.error(`Failed to update published_at for property ${prop.id}:`, updatePropError);
                }

                renewed.push({ id: prop.id, title: prop.title, user_id: prop.user_id });
            } else {
                // EXPIRE/UNPUBLISH listing (set status to 'draft')
                const { error: updatePropError } = await supabase
                    .from('properties')
                    .update({ status: 'draft' })
                    .eq('id', prop.id);

                if (updatePropError) {
                    skipped.push({ id: prop.id, error: `Failed to unpublish property: ${updatePropError.message}` });
                    continue;
                }

                // Insert notification to warn the owner
                const { error: notifyError } = await supabase
                    .from('notifications')
                    .insert({
                        user_id: prop.user_id,
                        type: 'system',
                        title: `Anunțul tău a expirat: ${prop.title}`,
                        content: `Anunțul tău "${prop.title}" a fost retras deoarece nu ai avut suficiente credite (necesar: ${listingRenewalCost} CR) pentru prelungire automată.`,
                        link: `/dashboard/owner/properties/${prop.id}/edit`,
                        is_read: false
                    });

                if (notifyError) {
                    console.error(`Error creating notification for property ${prop.id}:`, notifyError);
                }

                expired.push({ id: prop.id, title: prop.title, user_id: prop.user_id });
            }
        } catch (err: any) {
            skipped.push({ id: prop.id, error: err.message || 'Unknown error' });
        }
    }

    return NextResponse.json({
        success: true,
        checkedCount: expiredListings.length,
        renewedCount: renewed.length,
        expiredCount: expired.length,
        skippedCount: skipped.length,
        renewed,
        expired,
        skipped
    });
}
