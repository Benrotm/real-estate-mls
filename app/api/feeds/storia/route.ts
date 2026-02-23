import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

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
            .eq('publish_storia', true);

        if (error) {
            console.error('Error fetching Storia feed:', error);
            return new NextResponse('Internal Server Error', { status: 500 });
        }

        let xml = `<?xml version="1.0" encoding="utf-8"?>\n<adverts>\n`;

        for (const p of (properties || [])) {
            xml += `  <advert>\n`;
            xml += `    <id>${p.id}</id>\n`;
            xml += `    <title><![CDATA[${p.title}]]></title>\n`;
            xml += `    <description><![CDATA[${p.description}]]></description>\n`;
            xml += `    <category>${mapToStoriaCategory(p.type)}</category>\n`;
            xml += `    <price value="${p.price}" currency="${p.currency}" />\n`;

            // Location
            xml += `    <location>\n`;
            xml += `      <region><![CDATA[${escapeXml(p.location_county || '')}]]></region>\n`;
            xml += `      <city><![CDATA[${escapeXml(p.location_city || '')}]]></city>\n`;
            if (p.location_area) xml += `      <district><![CDATA[${escapeXml(p.location_area)}]]></district>\n`;
            xml += `    </location>\n`;

            // Attributes
            xml += `    <attributes>\n`;
            if (p.area_usable) xml += `      <attribute name="m"><![CDATA[${p.area_usable}]]></attribute>\n`;
            if (p.rooms) xml += `      <attribute name="rooms_num"><![CDATA[${p.rooms}]]></attribute>\n`;
            if (p.floor !== null) xml += `      <attribute name="floor_no"><![CDATA[${p.floor}]]></attribute>\n`;
            if (p.year_built) xml += `      <attribute name="build_year"><![CDATA[${p.year_built}]]></attribute>\n`;
            xml += `    </attributes>\n`;

            // Photos
            if (p.images && Array.isArray(p.images) && p.images.length > 0) {
                xml += `    <photos>\n`;
                p.images.forEach((img: string) => {
                    xml += `      <photo><![CDATA[${escapeXml(img)}]]></photo>\n`;
                });
                xml += `    </photos>\n`;
            }

            // Contact
            if (p.owner) {
                xml += `    <contact>\n`;
                xml += `      <name><![CDATA[${escapeXml(p.owner.full_name || 'Agent')}]]></name>\n`;
                if (p.owner.phone) xml += `      <phone><![CDATA[${escapeXml(p.owner.phone)}]]></phone>\n`;
                if (p.owner.email) xml += `      <email><![CDATA[${escapeXml(p.owner.email)}]]></email>\n`;
                xml += `    </contact>\n`;
            }

            xml += `  </advert>\n`;
        }

        xml += `</adverts>`;

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

function mapToStoriaCategory(propertyType: string) {
    // Basic mapping, in reality Storia has specific numeric IDs or predefined English strings
    switch (propertyType) {
        case 'Apartment': return 'apartments';
        case 'House': return 'houses';
        case 'Land': return 'land';
        case 'Commercial': return 'commercial';
        default: return 'apartments';
    }
}

function escapeXml(unsafe: string) {
    if (!unsafe) return '';
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
