import { createClient } from '@/app/lib/supabase/server';
import { MOCK_PROPERTIES } from '@/app/lib/properties';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const isUuid = uuidRegex.test(id);

        let property: any = null;

        if (isUuid) {
            // Use admin client to bypass RLS so we can fetch cover images even for new/pending properties
            const { createAdminClient } = await import('@/app/lib/supabase/admin');
            const adminSupabase = createAdminClient();
            const { data: dbProperty } = await adminSupabase
                .from('properties')
                .select('images')
                .eq('id', id)
                .single();
            property = dbProperty;
        }

        if (!property) {
            property = MOCK_PROPERTIES.find(p => p.id === id);
        }

        let imageUrl = "https://www.imobum.com/icon.png";
        if (property && property.images && property.images.length > 0) {
            imageUrl = property.images[0];
        }

        // Fetch the actual image from the source URL
        const imageResponse = await fetch(imageUrl, {
            next: { revalidate: 3600 } // Cache at Next.js layer for 1 hour
        });

        if (!imageResponse.ok) {
            // Fallback to logo if image fetch fails
            const logoResponse = await fetch("https://www.imobum.com/icon.png");
            const logoData = await logoResponse.arrayBuffer();
            return new Response(logoData, {
                headers: {
                    'Content-Type': 'image/png',
                    'Cache-Control': 'public, max-age=86400',
                }
            });
        }

        const imageData = await imageResponse.arrayBuffer();
        let buffer = Buffer.from(imageData);
        let contentType = imageResponse.headers.get('Content-Type') || 'image/jpeg';

        if (contentType.includes('webp') || imageUrl.toLowerCase().endsWith('.webp')) {
            try {
                const sharp = (await import('sharp')).default;
                buffer = await sharp(buffer).jpeg({ quality: 85 }).toBuffer();
                contentType = 'image/jpeg';
            } catch (err) {
                console.error("Failed to convert webp to jpeg:", err);
            }
        }

        // Return the image directly from our domain with clean headers (no x-robots-tag: none)
        return new Response(buffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
            }
        });

    } catch (error) {
        console.error('Error in property image proxy:', error);
        // Fallback to logo on error
        try {
            const logoResponse = await fetch("https://www.imobum.com/icon.png");
            const logoData = await logoResponse.arrayBuffer();
            return new Response(logoData, {
                headers: {
                    'Content-Type': 'image/png',
                    'Cache-Control': 'public, max-age=3600',
                }
            });
        } catch (e) {
            return new Response('Error loading image', { status: 500 });
        }
    }
}
