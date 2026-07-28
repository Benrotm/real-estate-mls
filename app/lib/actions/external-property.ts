'use server';

import { createClient } from '@/app/lib/supabase/server';
import { createAdminClient } from '@/app/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function scrapeExternalPropertyUrl(inputUrl: string) {
    if (!inputUrl || typeof inputUrl !== 'string') {
        return { error: 'URL invalid' };
    }

    let formattedUrl = inputUrl.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = 'https://' + formattedUrl;
    }

    const isFacebook = formattedUrl.includes('facebook.com') || formattedUrl.includes('fb.watch') || formattedUrl.includes('fb.me');
    const userAgent = isFacebook
        ? 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'
        : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

    try {
        const response = await fetch(formattedUrl, {
            headers: {
                'User-Agent': userAgent,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'ro-RO,ro;q=0.9,en-US;q=0.8,en;q=0.7'
            },
            signal: AbortSignal.timeout(6000)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const html = await response.text();

        // Regex helpers to extract OpenGraph & Meta tags
        const getMetaTag = (attr: string, value: string) => {
            const regex = new RegExp(`<meta\\s+[^>]*${attr}=["']${value}["'][^>]*content=["']([^"']+)["']`, 'i');
            const match = html.match(regex);
            if (match) return match[1];

            // Alternative order: content first, property second
            const reverseRegex = new RegExp(`<meta\\s+[^>]*content=["']([^"']+)["'][^>]*${attr}=["']${value}["']`, 'i');
            const reverseMatch = html.match(reverseRegex);
            return reverseMatch ? reverseMatch[1] : null;
        };

        const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        let title = getMetaTag('property', 'og:title') ||
            getMetaTag('name', 'twitter:title') ||
            (titleTag ? titleTag[1].trim() : '');

        const description = getMetaTag('property', 'og:description') ||
            getMetaTag('name', 'description') ||
            getMetaTag('name', 'twitter:description') || '';

        let coverImage = getMetaTag('property', 'og:image') ||
            getMetaTag('name', 'twitter:image') || '';

        if (coverImage && coverImage.startsWith('//')) {
            coverImage = 'https:' + coverImage;
        }

        let siteName = getMetaTag('property', 'og:site_name') || (isFacebook ? 'Facebook' : '');

        if (isFacebook && (!title || title.toLowerCase().includes('facebook') || title.toLowerCase().includes('log in'))) {
            title = 'Anunț Imobiliar Facebook';
        }

        return {
            success: true,
            title: title ? title.replace(/&amp;/g, '&').replace(/&quot;/g, '"') : (isFacebook ? 'Anunț Imobiliar Facebook' : ''),
            description: description ? description.replace(/&amp;/g, '&').replace(/&quot;/g, '"') : '',
            coverImage: coverImage,
            siteName: siteName,
            originalUrl: formattedUrl
        };
    } catch (err: any) {
        console.warn('Error scraping external URL:', err.message);
        return {
            success: true,
            title: isFacebook ? 'Anunț Imobiliar Facebook' : '',
            description: '',
            coverImage: '',
            siteName: isFacebook ? 'Facebook' : '',
            originalUrl: formattedUrl,
            fallback: true
        };
    }
}

export async function saveExternalPropertyForLead(params: {
    leadId: string;
    url: string;
    title?: string;
    description?: string;
    coverImage?: string;
    ownerPhone?: string;
    notes?: string;
    price?: number;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Unauthorized' };
    }

    const { leadId, url, title, description, coverImage, ownerPhone, notes, price } = params;
    if (!leadId || !url) {
        return { error: 'Lead ID și URL sunt obligatorii.' };
    }

    const adminSupabase = createAdminClient();

    // Check if property with exact URL already exists
    let propertyId: string | null = null;
    let existingProperty: any = null;

    const { data: foundProp } = await adminSupabase
        .from('properties')
        .select('*')
        .eq('url', url)
        .maybeSingle();

    if (foundProp) {
        propertyId = foundProp.id;
        existingProperty = foundProp;
        // Update owner phone if provided
        if (ownerPhone && ownerPhone !== foundProp.owner_phone) {
            await adminSupabase
                .from('properties')
                .update({ owner_phone: ownerPhone })
                .eq('id', propertyId);
            existingProperty.owner_phone = ownerPhone;
        }
    } else {
        // Create new external property record
        const fallbackImg = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&auto=format&fit=crop&q=60';
        const imgList = coverImage ? [coverImage] : [fallbackImg];

        const { data: newProp, error: createErr } = await adminSupabase
            .from('properties')
            .insert({
                title: title || 'Proprietate Externă (Facebook / OLX)',
                description: description || 'Proprietate adăugată manual de client',
                images: imgList,
                owner_phone: ownerPhone || null,
                url: url,
                source: 'External Manual',
                status: 'active',
                price: price || 0,
                currency: 'EUR',
                type: 'Apartment',
                owner_id: user.id
            })
            .select()
            .single();

        if (createErr || !newProp) {
            console.error('Error creating external property:', createErr);
            return { error: createErr?.message || 'Eroare la salvari proprietate externă' };
        }

        propertyId = newProp.id;
        existingProperty = newProp;
    }

    // Save match status as 'saved' (De Văzut / Favorite)
    const { data: match, error: matchErr } = await adminSupabase
        .from('lead_property_matches')
        .upsert({
            lead_id: leadId,
            property_id: propertyId,
            status: 'saved',
            agent_notes: notes || null,
            updated_at: new Date().toISOString()
        }, { onConflict: 'lead_id,property_id' })
        .select(`
            id,
            status,
            agent_notes,
            created_at,
            updated_at,
            property:properties (*)
        `)
        .single();

    if (matchErr) {
        console.error('Error upserting external match:', matchErr);
        return { error: matchErr.message };
    }

    revalidatePath('/dashboard/client/ai-matching');
    revalidatePath(`/dashboard/agent/leads/${leadId}`);

    return { success: true, match };
}
