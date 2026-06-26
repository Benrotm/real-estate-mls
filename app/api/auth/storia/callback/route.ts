import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/app/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

const STORIA_TOKEN_URL = process.env.STORIA_TOKEN_URL || 'https://www.olx.ro/api/open/oauth/token';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // The userId we sent as state

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    const defaultRedirectUrl = `${appUrl}/cont/profil`;

    if (!code || !state) {
        console.error('Callback received missing parameters');
        return NextResponse.redirect(`${defaultRedirectUrl}?storia_error=missing_params`);
    }

    const clientId = process.env.STORIA_CLIENT_ID;
    const clientSecret = process.env.STORIA_CLIENT_SECRET;
    const redirectUri = process.env.STORIA_REDIRECT_URI || `${appUrl}/api/auth/storia/callback`;

    if (!clientId || !clientSecret) {
        console.error('STORIA_CLIENT_ID or STORIA_CLIENT_SECRET is missing');
        return NextResponse.redirect(`${defaultRedirectUrl}?storia_error=missing_config`);
    }

    try {
        console.log('Exchanging authorization code for tokens...');
        const params = new URLSearchParams();
        params.append('grant_type', 'authorization_code');
        params.append('client_id', clientId);
        params.append('client_secret', clientSecret);
        params.append('code', code);
        params.append('redirect_uri', redirectUri);

        const response = await fetch(STORIA_TOKEN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Imobum/1.0'
            },
            body: params.toString()
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Token exchange failed:', response.status, errorText);
            return NextResponse.redirect(`${defaultRedirectUrl}?storia_error=token_exchange_failed`);
        }

        const data = await response.json();
        const accessToken = data.access_token;
        const refreshToken = data.refresh_token;
        const expiresIn = data.expires_in || 3600;

        if (!accessToken || !refreshToken) {
            console.error('Access token or refresh token was missing in the response');
            return NextResponse.redirect(`${defaultRedirectUrl}?storia_error=invalid_token_response`);
        }

        // Save to Database
        const supabase = await createAdminClient();
        const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

        const { error } = await supabase
            .from('storia_tokens')
            .upsert({
                user_id: state,
                access_token: accessToken,
                refresh_token: refreshToken,
                expires_at: expiresAt,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

        if (error) {
            console.error('Error saving Storia token to database:', error);
            return NextResponse.redirect(`${defaultRedirectUrl}?storia_error=database_save_failed`);
        }

        console.log('Storia/OLX account successfully connected!');
        revalidatePath('/cont/profil');
        return NextResponse.redirect(`${defaultRedirectUrl}?storia_connected=true`);

    } catch (e: any) {
        console.error('Exception in Storia callback handler:', e);
        return NextResponse.redirect(`${defaultRedirectUrl}?storia_error=${encodeURIComponent(e.message)}`);
    }
}
