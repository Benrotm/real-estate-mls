import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY || '';

if (!resendApiKey) {
    console.warn('Resend API Key missing. Ensure RESEND_API_KEY is set in .env');
}

export const resend = new Resend(resendApiKey);
