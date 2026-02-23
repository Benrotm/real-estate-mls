import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Note: Using Service Role Key because this feed might be accessed publicly by portal crawlers 
// and we want to guarantee retrieval of explicitly 'published' properties even without user sessions.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
    try {
        const { data: properties, error } = await supabase
            .from('properties')
            .select(`
                *,
                owner:profiles(*)
            `)
            .eq('status', 'active')
            .eq('publish_imobiliare', true);

        if (error) {
            console.error('Error fetching Imobiliare feed:', error);
            return new NextResponse('Internal Server Error', { status: 500 });
        }

        let xml = `<?xml version="1.0" encoding="utf-8"?>\n<imobiliare>\n  <oferte>\n`;

        for (const p of (properties || [])) {
            xml += `    <oferta id="${p.id}" id_agentie="${p.owner_id}">\n`;
            xml += `      <tip_oferta>${p.listing_type === 'For Rent' ? 'inchiriere' : 'vanzare'}</tip_oferta>\n`;
            xml += `      <titlu><![CDATA[${p.title}]]></titlu>\n`;
            xml += `      <descriere><![CDATA[${p.description}]]></descriere>\n`;
            xml += `      <pret valoare="${p.price}" moneda="${p.currency}" />\n`;
            xml += `      <adresa \n`;
            xml += `        judet="${escapeXml(p.location_county || '')}" \n`;
            xml += `        localitate="${escapeXml(p.location_city || '')}" \n`;
            xml += `        zona="${escapeXml(p.location_area || '')}" \n`;
            xml += `        strada="${escapeXml(p.address || '')}" />\n`;

            // Details
            xml += `      <detalii>\n`;
            if (p.rooms) xml += `        <camere>${p.rooms}</camere>\n`;
            if (p.bathrooms) xml += `        <bai>${p.bathrooms}</bai>\n`;
            if (p.area_usable) xml += `        <suprafata_utila>${p.area_usable}</suprafata_utila>\n`;
            if (p.area_built) xml += `        <suprafata_construita>${p.area_built}</suprafata_construita>\n`;
            if (p.year_built) xml += `        <an_constructie>${p.year_built}</an_constructie>\n`;
            if (p.floor !== null) xml += `        <etaj>${p.floor}</etaj>\n`;
            xml += `      </detalii>\n`;

            // Images
            if (p.images && Array.isArray(p.images) && p.images.length > 0) {
                xml += `      <imagini>\n`;
                p.images.forEach((img: string, idx: number) => {
                    xml += `        <imagine index="${idx + 1}" url="${escapeXml(img)}" />\n`;
                });
                xml += `      </imagini>\n`;
            }

            xml += `    </oferta>\n`;
        }

        xml += `  </oferte>\n</imobiliare>`;

        return new NextResponse(xml, {
            status: 200,
            headers: {
                'Content-Type': 'application/xml',
                'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
            },
        });
    } catch (err) {
        return new NextResponse('Server Error', { status: 500 });
    }
}

function escapeXml(unsafe: string) {
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case "'": return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
}
