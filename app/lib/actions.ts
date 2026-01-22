'use server';

import { createClient } from '../lib/supabase/server';
import { resend } from '../lib/resend';

export async function submitContactForm(formData: FormData) {
    const supabase = await createClient();
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const message = formData.get('message') as string;
    const propertyId = formData.get('propertyId') as string;
    const propertyTitle = formData.get('propertyTitle') as string;

    try {
        // 1. Save to Supabase
        const { error: dbError } = await supabase
            .from('messages')
            .insert([
                {
                    sender_name: name,
                    sender_email: email,
                    sender_phone: phone,
                    message_body: message,
                    property_id: propertyId
                }
            ]);

        if (dbError) throw dbError;

        // 2. Send Email via Resend
        // Note: For production, you'd want to use a verified domain in Resend
        const { data: emailData, error: emailError } = await resend.emails.send({
            from: 'PropList <onboarding@resend.dev>',
            to: [email], // In demo, we send to the user, in production to the agent/owner
            subject: `Inquiry for ${propertyTitle}`,
            html: `
                <h1>New Property Inquiry</h1>
                <p><strong>Property:</strong> ${propertyTitle}</p>
                <p><strong>From:</strong> ${name} (${email})</p>
                <p><strong>Phone:</strong> ${phone}</p>
                <p><strong>Message:</strong></p>
                <p>${message}</p>
                <hr />
                <p>This inquiry has also been saved to your PropList Dashboard.</p>
            `,
        });

        if (emailError) throw emailError;

        return { success: true };
    } catch (error: any) {
        console.error('Contact form submission error:', error);
        return { success: false, error: error.message };
    }
}

export async function scheduleAppointment(formData: FormData) {
    const supabase = await createClient();
    const name = formData.get('clientName') as string;
    const phone = formData.get('clientPhone') as string;
    const date = formData.get('date') as string;
    const notes = formData.get('notes') as string;
    const propertyId = formData.get('propertyId') as string;

    try {
        const { error: dbError } = await supabase
            .from('appointments')
            .insert([
                {
                    client_name: name,
                    client_phone: phone,
                    appointment_date: date,
                    notes: notes,
                    property_id: propertyId,
                    status: 'pending'
                }
            ]);

        if (dbError) throw dbError;

        return { success: true };
    } catch (error: any) {
        console.error('Appointment scheduling error:', error);
        return { success: false, error: error.message };
    }
}


import { calculateValuation } from './valuation';
import { Property } from './properties';

export async function createProperty(formData: FormData) {
    const supabase = await createClient();
    try {
        const rawData: any = Object.fromEntries(formData.entries());

        // Parse complex fields
        const features = rawData.features ? JSON.parse(rawData.features as string) : [];
        const images = rawData.images ? JSON.parse(rawData.images as string) : [];
        const location = rawData.location ? JSON.parse(rawData.location as string) : null;
        const specs = rawData.specs ? JSON.parse(rawData.specs as string) : null;

        if (!location || !specs) {
            throw new Error('Missing required property data');
        }

        // --- ENFORCE PLAN LIMITS ---
        const { getUserProfile, getUsageStats } = await import('./auth');
        const userProfile = await getUserProfile();

        if (userProfile) { // If no profile (e.g. mock), we skip check or enforce default
            const currentUsage = await getUsageStats(userProfile.id);
            if (currentUsage >= userProfile.listings_limit) {
                throw new Error(`Plan limit reached (${currentUsage}/${userProfile.listings_limit} listings). Please upgrade your plan.`);
            }
        }
        // ---------------------------

        // Construct Property object for valuation
        const propertyForValuation: Property = {
            id: 'temp-id', // Placeholder
            listingType: rawData.listingType,
            currency: rawData.currency,
            title: rawData.title,
            description: rawData.description,
            location: location,
            price: Number(rawData.price),
            specs: {
                ...specs,
                beds: Number(specs.beds),
                baths: Number(specs.baths),
                sqft: Number(specs.sqft),
                yearBuilt: Number(specs.yearBuilt),
                floor: specs.floor ? Number(specs.floor) : undefined,
                stories: specs.stories ? Number(specs.stories) : undefined,
                interiorRating: specs.interiorRating ? Number(specs.interiorRating) : undefined,
                totalFloors: specs.totalFloors ? Number(specs.totalFloors) : undefined,
                lotSize: specs.lotSize ? Number(specs.lotSize) : undefined,
            },
            features: features,
            images: images,
            agent: { id: '', name: '', image: '', phone: '' }, // Placeholder, handled by DB auth default or RLS
            virtualTourUrl: rawData.virtualTourUrl,
            virtualTourType: rawData.virtualTourType || 'No Virtual Tour'
        };

        // Calculate Valuation
        const valuation = calculateValuation(propertyForValuation);

        // Prepare for Database Insert
        const dbPayload = {
            listing_type: rawData.listingType,
            currency: rawData.currency,
            title: rawData.title,
            description: rawData.description,
            address: location.address,
            city: location.city,
            state: location.state,
            zip: location.zip,
            lat: location.lat,
            lng: location.lng,
            price: Number(rawData.price),
            beds: Number(specs.beds),
            baths: Number(specs.baths),
            sqft: Number(specs.sqft),
            year_built: Number(specs.yearBuilt),
            property_type: specs.type,
            stories: specs.stories ? Number(specs.stories) : null,
            floor: specs.floor ? Number(specs.floor) : null,
            interior_rating: specs.interiorRating ? Number(specs.interiorRating) : null,
            lot_size: specs.lotSize ? Number(specs.lotSize) : null,
            total_floors: specs.totalFloors ? Number(specs.totalFloors) : null,
            building_type: specs.buildingType,
            interior_condition: specs.interiorCondition,
            furnishing: specs.furnishing,
            virtual_tour_type: rawData.virtualTourType,
            valuation_estimated_price: valuation.estimatedValue,
            valuation_confidence: 85, // Default high confidence for algorithm
            valuation_last_updated: new Date().toISOString(),
            features: features,
            images: images,
            virtual_tour_url: rawData.virtualTourUrl
            // agent_id and owner_id would be set by Supabase RLS based on auth.uid()
        };

        const { data, error } = await supabase
            .from('properties')
            .insert([dbPayload])
            .select()
            .single();

        if (error) throw error;

        return { success: true, propertyId: data.id };
    } catch (error: any) {
        console.error('Create property error:', error);
        return { success: false, error: error.message };
    }
}
