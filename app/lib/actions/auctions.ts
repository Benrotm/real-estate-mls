'use server';

import { createClient } from '@/app/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { createNotification } from './notifications';

export interface PropertyAuction {
    id: string;
    property_id: string;
    owner_id: string;
    starting_price: number;
    reserve_price: number | null;
    min_increment: number;
    start_time: string;
    end_time: string;
    status: 'scheduled' | 'active' | 'ended' | 'cancelled';
    winner_bid_id?: string | null;
    created_at: string;
    updated_at: string;
    bids?: PropertyBid[];
}

export interface PropertyBid {
    id: string;
    auction_id: string;
    user_id: string;
    bid_amount: number;
    created_at: string;
    user_name?: string;
    user_email?: string;
}

// Get active, scheduled, or recently ended auction for a property
export async function getAuctionForProperty(propertyId: string): Promise<PropertyAuction | null> {
    const supabase = await createClient();

    // Query auctions for this property
    const { data: auctions, error: auctionError } = await supabase
        .from('property_auctions')
        .select('*')
        .eq('property_id', propertyId)
        .in('status', ['active', 'scheduled', 'ended'])
        .order('created_at', { ascending: false });

    if (auctionError || !auctions || auctions.length === 0) {
        return null;
    }

    // We take the latest relevant auction
    const auction = auctions[0] as PropertyAuction;

    // Check if the auction should change status based on current time
    const now = new Date();
    const startTime = new Date(auction.start_time);
    const endTime = new Date(auction.end_time);

    let updatedStatus = auction.status;
    if (auction.status === 'scheduled' && now >= startTime && now < endTime) {
        updatedStatus = 'active';
    } else if ((auction.status === 'active' || auction.status === 'scheduled') && now >= endTime) {
        updatedStatus = 'ended';
    }

    if (updatedStatus !== auction.status) {
        // Update database status
        const { error: updateError } = await supabase
            .from('property_auctions')
            .update({ status: updatedStatus, updated_at: now.toISOString() })
            .eq('id', auction.id);
        
        if (!updateError) {
            auction.status = updatedStatus;
        }
    }

    // Load bids for this auction
    const { data: bids, error: bidsError } = await supabase
        .from('property_bids')
        .select(`
            id,
            auction_id,
            user_id,
            bid_amount,
            created_at,
            profiles:user_id (
                full_name,
                email
            )
        `)
        .eq('auction_id', auction.id)
        .order('created_at', { ascending: false });

    if (!bidsError && bids) {
        auction.bids = bids.map((b: any) => ({
            id: b.id,
            auction_id: b.auction_id,
            user_id: b.user_id,
            bid_amount: Number(b.bid_amount),
            created_at: b.created_at,
            user_name: b.profiles?.full_name || 'Anonymous bidder',
            user_email: b.profiles?.email || ''
        }));
    } else {
        auction.bids = [];
    }

    return auction;
}

// Create an auction
export async function createAuction(
    propertyId: string,
    startingPrice: number,
    reservePrice: number | null,
    minIncrement: number,
    startTime: string,
    endTime: string
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'You must be logged in to create an auction.' };
    }

    // Verify property ownership
    const { data: property, error: propError } = await supabase
        .from('properties')
        .select('owner_id, title')
        .eq('id', propertyId)
        .single();

    if (propError || !property) {
        return { success: false, error: 'Property not found.' };
    }

    if (property.owner_id !== user.id) {
        // Admins can do this too
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin' && profile?.role !== 'superadmin') {
            return { success: false, error: 'You are not authorized to create an auction for this property.' };
        }
    }

    // Check if there is already an active or scheduled auction for this property
    const { data: existingAuctions } = await supabase
        .from('property_auctions')
        .select('id')
        .eq('property_id', propertyId)
        .in('status', ['active', 'scheduled']);

    if (existingAuctions && existingAuctions.length > 0) {
        return { success: false, error: 'There is already an active or scheduled auction for this property.' };
    }

    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
        return { success: false, error: 'Auction start time must be before end time.' };
    }

    if (end <= now) {
        return { success: false, error: 'Auction end time must be in the future.' };
    }

    // 1. Fetch feature cost for starting open offers
    const { getFeatureCosts } = await import('./settings');
    const costsRes = await getFeatureCosts();
    const startCost = costsRes.costs?.['open_offers_start'] !== undefined ? costsRes.costs['open_offers_start'] : 5;

    // 2. If startCost > 0, deduct credits from owner/creator
    const { deductUserCredits, rewardUserCredits } = await import('./credits');
    let creditsDeducted = false;
    if (startCost > 0) {
        const deduction = await deductUserCredits(
            startCost,
            `Deschidere sesiune oferte deschise pentru proprietatea "${property.title}"`,
            { property_id: propertyId, feature_key: 'open_offers_start' }
        );
        if (deduction.error) {
            return { success: false, error: `Fonduri insuficiente. Deschideria sesiunii costă ${startCost} credite.` };
        }
        creditsDeducted = true;
    }

    const initialStatus = now >= start ? 'active' : 'scheduled';

    const { data: auction, error: insertError } = await supabase
        .from('property_auctions')
        .insert({
            property_id: propertyId,
            owner_id: property.owner_id,
            starting_price: startingPrice,
            reserve_price: reservePrice,
            min_increment: minIncrement,
            start_time: startTime,
            end_time: endTime,
            status: initialStatus
        })
        .select()
        .single();

    if (insertError) {
        console.error('Create auction error:', insertError);
        // Refund if we already deducted credits
        if (creditsDeducted && startCost > 0) {
            await rewardUserCredits(
                user.id,
                startCost,
                `Rambursare credit - eroare activare sesiune`,
                { property_id: propertyId, feature_key: 'open_offers_start_refund' }
            );
        }
        return { success: false, error: insertError.message };
    }

    revalidatePath(`/properties/${propertyId}`);
    revalidatePath(`/dashboard/owner/properties`);
    revalidatePath(`/dashboard/agent/listings`);

    return { success: true, auction };
}

// Cancel an auction
export async function cancelAuction(auctionId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'You must be logged in to cancel an auction.' };
    }

    const { data: auction } = await supabase
        .from('property_auctions')
        .select('*')
        .eq('id', auctionId)
        .single();

    if (!auction) {
        return { success: false, error: 'Auction not found.' };
    }

    if (auction.owner_id !== user.id) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin' && profile?.role !== 'superadmin') {
            return { success: false, error: 'You are not authorized to cancel this auction.' };
        }
    }

    const { error: updateError } = await supabase
        .from('property_auctions')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', auctionId);

    if (updateError) {
        console.error('Cancel auction error:', updateError);
        return { success: false, error: updateError.message };
    }

    revalidatePath(`/properties/${auction.property_id}`);
    revalidatePath(`/dashboard/owner/properties`);
    revalidatePath(`/dashboard/agent/listings`);

    return { success: true };
}

// Close/end an auction manually (Owner cancels session)
export async function closeAuction(auctionId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'You must be logged in to close this open offers session.' };
    }

    const { data: auction } = await supabase
        .from('property_auctions')
        .select('*')
        .eq('id', auctionId)
        .single();

    if (!auction) {
        return { success: false, error: 'Offers session not found.' };
    }

    const isUserAdmin = await (async () => {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
        return profile?.role === 'admin' || profile?.role === 'superadmin' || profile?.role === 'super_admin';
    })();

    if (auction.owner_id !== user.id && !isUserAdmin) {
        return { success: false, error: 'You are not authorized to close this open offers session.' };
    }

    // 1. Fetch feature costs
    const { getFeatureCosts } = await import('./settings');
    const costsRes = await getFeatureCosts();
    const cancelCost = costsRes.costs?.['open_offers_cancel'] !== undefined ? costsRes.costs['open_offers_cancel'] : 10;
    const submitCost = costsRes.costs?.['open_offers_submit'] !== undefined ? costsRes.costs['open_offers_submit'] : 1;

    // 2. Deduct cancellation credits from owner (or admin penalty)
    const { deductUserCredits, deductUserCreditsByAdmin, rewardUserCredits } = await import('./credits');
    if (cancelCost > 0) {
        if (auction.owner_id === user.id) {
            const deduction = await deductUserCredits(
                cancelCost,
                `Penalizare anulare manuală sesiune oferte deschise pentru proprietatea #${auction.property_id}`,
                { auction_id: auctionId, feature_key: 'open_offers_cancel' }
            );
            if (deduction.error) {
                return { success: false, error: `Credit insuficient pentru a anula sesiunea. Penalizarea de anulare este de ${cancelCost} credite.` };
            }
        } else if (isUserAdmin) {
            // Admin closing it on behalf of the owner. Charge owner.
            const deduction = await deductUserCreditsByAdmin(
                auction.owner_id,
                cancelCost,
                `Penalizare anulare manuală sesiune oferte (de către admin) pentru proprietatea #${auction.property_id}`,
                { auction_id: auctionId, feature_key: 'open_offers_cancel', cancelled_by: user.id }
            );
            if (deduction.error) {
                console.warn(`Admin cancelled auction, but owner had insufficient credits for penalty:`, deduction.error);
            }
        }
    }

    // 3. Fetch all bids to refund the bidders
    const { data: bids } = await supabase
        .from('property_bids')
        .select('user_id, bid_amount')
        .eq('auction_id', auctionId);

    if (bids && bids.length > 0 && submitCost > 0) {
        for (const bid of bids) {
            try {
                await rewardUserCredits(
                    bid.user_id,
                    submitCost,
                    `Rambursare credit - anulare sesiune oferte deschise de către proprietar`,
                    { auction_id: auctionId, refund_for_bid_amount: Number(bid.bid_amount) }
                );
            } catch (err) {
                console.error(`Error refunding user ${bid.user_id} for bid of ${bid.bid_amount}:`, err);
            }
        }
    }

    // 4. Update status to 'cancelled'
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
        .from('property_auctions')
        .update({ 
            status: 'cancelled', 
            end_time: now,
            updated_at: now 
        })
        .eq('id', auctionId);

    if (updateError) {
        console.error('Close/cancel auction error:', updateError);
        return { success: false, error: updateError.message };
    }

    revalidatePath(`/properties/${auction.property_id}`);
    revalidatePath(`/dashboard/owner/properties`);
    revalidatePath(`/dashboard/agent/listings`);

    return { success: true };
}

// Choose a winner for an open offers session (no refunds, no penalty, sets status to ended)
export async function chooseOffersWinner(auctionId: string, winnerBidId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'You must be logged in to choose a winner.' };
    }

    const { data: auction } = await supabase
        .from('property_auctions')
        .select('*')
        .eq('id', auctionId)
        .single();

    if (!auction) {
        return { success: false, error: 'Offers session not found.' };
    }

    const isUserAdmin = await (async () => {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
        return profile?.role === 'admin' || profile?.role === 'superadmin' || profile?.role === 'super_admin';
    })();

    if (auction.owner_id !== user.id && !isUserAdmin) {
        return { success: false, error: 'You are not authorized to choose a winner for this session.' };
    }

    // Verify bid belongs to this auction
    const { data: bid } = await supabase
        .from('property_bids')
        .select('id, user_id, bid_amount')
        .eq('id', winnerBidId)
        .eq('auction_id', auctionId)
        .single();

    if (!bid) {
        return { success: false, error: 'Oferta selectată nu a fost găsită sau nu aparține acestei sesiuni.' };
    }

    const now = new Date().toISOString();
    const { error: updateError } = await supabase
        .from('property_auctions')
        .update({ 
            status: 'ended', 
            end_time: now,
            winner_bid_id: winnerBidId,
            updated_at: now 
        })
        .eq('id', auctionId);

    if (updateError) {
        console.error('Choose winner error:', updateError);
        return { success: false, error: updateError.message };
    }

    // Get property details for notification
    const { data: property } = await supabase
        .from('properties')
        .select('title')
        .eq('id', auction.property_id)
        .single();

    // Trigger Notification for the Winner
    try {
        await createNotification({
            user_id: bid.user_id,
            type: 'system',
            title: 'Ofertă Acceptată!',
            content: `Proprietarul a selectat oferta ta de ${Number(bid.bid_amount).toLocaleString()} EUR ca fiind câștigătoare pentru proprietatea "${property?.title || 'Proprietate'}"!`,
            link: `/properties/${auction.property_id}`
        });
    } catch (notifyError) {
        console.error('Error triggering winner notification:', notifyError);
    }

    revalidatePath(`/properties/${auction.property_id}`);
    revalidatePath(`/dashboard/owner/properties`);
    revalidatePath(`/dashboard/agent/listings`);

    return { success: true };
}

// Place a bid/offer in an open offers session
export async function placeBid(auctionId: string, bidAmount: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'You must be logged in to send an offer.' };
    }

    // Get auction details
    const { data: auction, error: auctionError } = await supabase
        .from('property_auctions')
        .select('*')
        .eq('id', auctionId)
        .single();

    if (auctionError || !auction) {
        return { success: false, error: 'Offers session not found.' };
    }

    if (auction.status !== 'active') {
        // Double check status based on current time
        const now = new Date();
        const start = new Date(auction.start_time);
        const end = new Date(auction.end_time);

        if (now < start) {
            return { success: false, error: 'This offers session has not started yet.' };
        }
        if (now >= end) {
            // Update db status to ended
            await supabase
                .from('property_auctions')
                .update({ status: 'ended', updated_at: now.toISOString() })
                .eq('id', auctionId);
            return { success: false, error: 'This offers session has ended.' };
        }
        
        // If it's within start and end, but status wasn't active in db, it's actually active
        if (auction.status !== 'scheduled') {
            return { success: false, error: 'This offers session is not active.' };
        }
    }

    // Prevent property owner from making offers on their own property
    if (auction.owner_id === user.id) {
        return { success: false, error: 'You cannot send offers on your own property.' };
    }

    // Validate offer amount
    if (bidAmount <= 0) {
        return { success: false, error: 'Your offer must be a positive amount.' };
    }
    const { data: property } = await supabase
        .from('properties')
        .select('title')
        .eq('id', auction.property_id)
        .single();

    // 1. Fetch feature cost for submitting open offers
    const { getFeatureCosts } = await import('./settings');
    const costsRes = await getFeatureCosts();
    const submitCost = costsRes.costs?.['open_offers_submit'] !== undefined ? costsRes.costs['open_offers_submit'] : 1;

    // 2. Deduct credits from bidder
    const { deductUserCredits, rewardUserCredits } = await import('./credits');
    let creditsDeducted = false;
    if (submitCost > 0) {
        const deduction = await deductUserCredits(
            submitCost,
            `Trimitere ofertă în valoare de ${bidAmount} EUR pentru proprietatea "${property?.title || 'Proprietate'}"`,
            { auction_id: auctionId, feature_key: 'open_offers_submit' }
        );
        if (deduction.error) {
            return { success: false, error: `Credit insuficient pentru a trimite oferta. Necesar: ${submitCost} credite.` };
        }
        creditsDeducted = true;
    }

    // Insert bid/offer
    const { data: bid, error: insertError } = await supabase
        .from('property_bids')
        .insert({
            auction_id: auctionId,
            user_id: user.id,
            bid_amount: bidAmount
        })
        .select()
        .single();

    if (insertError) {
        console.error('Place offer error:', insertError);
        // Refund if we already deducted credits
        if (creditsDeducted && submitCost > 0) {
            await rewardUserCredits(
                user.id,
                submitCost,
                `Rambursare credit - eroare trimitere ofertă`,
                { auction_id: auctionId, feature_key: 'open_offers_submit_refund' }
            );
        }
        return { success: false, error: insertError.message };
    }

    // Trigger Notification for Owner
    try {
        await createNotification({
            user_id: auction.owner_id,
            type: 'offer',
            title: 'New Offer Received',
            content: `A new offer of ${bidAmount} has been sent for your property "${property?.title || 'Property'}"`,
            link: `/properties/${auction.property_id}`
        });
    } catch (notifyError) {
        console.error('Error triggering offer notification:', notifyError);
    }

    revalidatePath(`/properties/${auction.property_id}`);
    return { success: true, bid };
}
