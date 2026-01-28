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

// createProperty moved to app/lib/actions/properties.ts
