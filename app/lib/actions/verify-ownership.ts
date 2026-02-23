'use server';

import twilio from 'twilio';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID!;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN!;
// Set a default Twilio number or messaging service SID here when you purchase one
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '+1234567890';

const GOOGLE_SMTP_USER = process.env.GOOGLE_SMTP_USER!;
const GOOGLE_SMTP_PASS = process.env.GOOGLE_SMTP_PASS!;

/**
 * Generate a 6-digit OTP
 */
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send an OTP via SMS
 */
export async function sendSmsOTP(phone: string): Promise<{ success: boolean; message: string; otp?: string }> {
    if (!TWILIO_SID || !TWILIO_TOKEN) {
        return { success: false, message: 'Twilio is not configured.' };
    }

    try {
        const client = twilio(TWILIO_SID, TWILIO_TOKEN);
        const otp = generateOTP();

        await client.messages.create({
            body: `Your Real Estate MLS verification code is: ${otp}. Do not share this code.`,
            from: TWILIO_PHONE_NUMBER,
            to: phone,
        });

        // In a real production app, store the OTP in a Redis cache or Supabase table with an expiration.
        // For security, don't return the OTP to the client. But for this phase, we will store it securely in DB.
        await storeOtpInDb(phone, otp);

        return { success: true, message: 'SMS sent successfully.' };
    } catch (error: any) {
        console.error('Twilio Error:', error);
        return { success: false, message: error.message || 'Failed to send SMS.' };
    }
}

/**
 * Send an OTP via Email
 */
export async function sendEmailOTP(email: string): Promise<{ success: boolean; message: string }> {
    if (!GOOGLE_SMTP_USER || !GOOGLE_SMTP_PASS) {
        return { success: false, message: 'Google SMTP is not configured.' };
    }

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: GOOGLE_SMTP_USER,
                pass: GOOGLE_SMTP_PASS,
            },
        });

        const otp = generateOTP();

        await transporter.sendMail({
            from: `"Real Estate MLS" <${GOOGLE_SMTP_USER}>`,
            to: email,
            subject: 'Your Property Import Verification Code',
            text: `Your verification code is: ${otp}`,
            html: `<p>Your verification code is: <strong>${otp}</strong></p>`,
        });

        await storeOtpInDb(email, otp);

        return { success: true, message: 'Email sent successfully.' };
    } catch (error: any) {
        console.error('Nodemailer Error:', error);
        return { success: false, message: error.message || 'Failed to send Email.' };
    }
}

/**
 * Helper to store OTP in DB with an expiration (5 minutes)
 */
async function storeOtpInDb(identifier: string, code: string) {
    // Upsert into a new verification table
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    await supabase.from('otp_verifications').upsert({
        identifier, // phone or email
        code,
        expires_at: expiresAt.toISOString(),
    }, { onConflict: 'identifier' });
}

/**
 * Verify checking the DB
 */
export async function verifyOTP(identifier: string, code: string): Promise<{ success: boolean; message: string }> {
    try {
        const { data, error } = await supabase
            .from('otp_verifications')
            .select('*')
            .eq('identifier', identifier)
            .single();

        if (error || !data) {
            return { success: false, message: 'Invalid or expired code.' };
        }

        if (data.code !== code) {
            return { success: false, message: 'Incorrect code.' };
        }

        if (new Date(data.expires_at) < new Date()) {
            return { success: false, message: 'Code has expired.' };
        }

        // Clean up after successful verification
        await supabase.from('otp_verifications').delete().eq('identifier', identifier);

        return { success: true, message: 'Verified accurately.' };
    } catch (err: any) {
        return { success: false, message: 'Internal verification error.' };
    }
}
