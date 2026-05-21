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
        .order('bid_amount', { ascending: false });

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

// Place a bid in an auction
export async function placeBid(auctionId: string, bidAmount: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'You must be logged in to place a bid.' };
    }

    // Get auction details
    const { data: auction, error: auctionError } = await supabase
        .from('property_auctions')
        .select('*')
        .eq('id', auctionId)
        .single();

    if (auctionError || !auction) {
        return { success: false, error: 'Auction not found.' };
    }

    if (auction.status !== 'active') {
        // Double check status based on current time
        const now = new Date();
        const start = new Date(auction.start_time);
        const end = new Date(auction.end_time);

        if (now < start) {
            return { success: false, error: 'This auction has not started yet.' };
        }
        if (now >= end) {
            // Update db status to ended
            await supabase
                .from('property_auctions')
                .update({ status: 'ended', updated_at: now.toISOString() })
                .eq('id', auctionId);
            return { success: false, error: 'This auction has ended.' };
        }
        
        // If it's within start and end, but status wasn't active in db, it's actually active
        if (auction.status !== 'scheduled') {
            return { success: false, error: 'This auction is not active.' };
        }
    }

    // Prevent property owner from bidding on their own property
    if (auction.owner_id === user.id) {
        return { success: false, error: 'You cannot bid on your own property.' };
    }

    // Get current highest bid
    const { data: highestBids } = await supabase
        .from('property_bids')
        .select('bid_amount')
        .eq('auction_id', auctionId)
        .order('bid_amount', { ascending: false })
        .limit(1);

    const currentHighestBid = highestBids && highestBids.length > 0 ? Number(highestBids[0].bid_amount) : 0;

    // Validate bid amount
    const minRequiredBid = currentHighestBid > 0 
        ? currentHighestBid + Number(auction.min_increment)
        : Number(auction.starting_price);

    if (bidAmount < minRequiredBid) {
        return { 
            success: false, 
            error: `Your bid must be at least ${minRequiredBid} (Minimum increment is ${auction.min_increment}).` 
        };
    }

    // Insert bid
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
        console.error('Place bid error:', insertError);
        return { success: false, error: insertError.message };
    }

    // Get property details for notification
    const { data: property } = await supabase
        .from('properties')
        .select('title')
        .eq('id', auction.property_id)
        .single();

    // Trigger Notification for Owner
    try {
        await createNotification({
            user_id: auction.owner_id,
            type: 'offer', // Use offer type for bids as well
            title: 'New Bid Received',
            content: `A new bid of ${bidAmount} has been placed on your property "${property?.title || 'Property'}"`,
            link: `/properties/${auction.property_id}`
        });
    } catch (notifyError) {
        console.error('Error triggering bid notification:', notifyError);
    }

    revalidatePath(`/properties/${auction.property_id}`);
    return { success: true, bid };
}
