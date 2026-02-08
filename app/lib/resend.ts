import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;

// Only initialize if key is present to prevent module-level crash
export const resend = resendApiKey
    ? new Resend(resendApiKey)
    : {
        emails: {
            send: async () => {
                console.error('RESEND_API_KEY is missing. Email not sent.');
                throw new Error('Email service unavailable. Please configure RESEND_API_KEY.');
            }
        }
    } as unknown as Resend;
