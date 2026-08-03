import { NextResponse } from 'next/server';
import { createAdminClient } from '@/app/lib/supabase/admin';
import { sanitizeLocationText } from '@/app/lib/constants/locations';

export async function GET() {
    return runCleanup();
}

export async function POST() {
    return runCleanup();
}

async function runCleanup() {
    try {
        const supabase = createAdminClient();

        // 1. Fetch all properties
        const { data: properties, error } = await supabase
            .from('properties')
            .select('id, title, location_city, location_area, location_county, address');

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        let updatedCount = 0;
        const updatedList: any[] = [];

        const noiseRegex = /(storia|olx|romimo|imobiliare|publi24|immoflux|whatsapp|\+40|\b07\d{8})/i;

        for (const prop of (properties || [])) {
            const currentCity = prop.location_city || '';
            const currentArea = prop.location_area || '';
            const currentAddress = prop.address || '';

            const needsCleaning = noiseRegex.test(currentCity) || noiseRegex.test(currentArea) || noiseRegex.test(currentAddress) || currentCity.toLowerCase().startsWith('tm ');

            if (!needsCleaning) continue;

            // Sanitize city
            const citySan = sanitizeLocationText(currentCity);
            let newCity = citySan.city || 'Timisoara';
            let newArea = currentArea;

            if (!newArea && citySan.area) {
                newArea = citySan.area;
            }

            if (newArea) {
                newArea = sanitizeLocationText(newArea).cleanText;
            }

            // Synthesize clean address
            const addrParts = [newArea, newCity, prop.location_county || 'Timis', 'Romania'].filter(Boolean);
            const newAddress = sanitizeLocationText(addrParts.join(', ')).cleanText;

            const { error: updateErr } = await supabase
                .from('properties')
                .update({
                    location_city: newCity,
                    location_area: newArea,
                    address: newAddress,
                    updated_at: new Date().toISOString()
                })
                .eq('id', prop.id);

            if (!updateErr) {
                updatedCount++;
                updatedList.push({
                    id: prop.id,
                    oldCity: currentCity,
                    newCity,
                    oldArea: currentArea,
                    newArea,
                    oldAddress: currentAddress,
                    newAddress
                });
            }
        }

        return NextResponse.json({
            success: true,
            totalChecked: properties?.length || 0,
            updatedCount,
            samples: updatedList.slice(0, 20)
        });

    } catch (e: any) {
        console.error('Location Cleanup Error:', e);
        return NextResponse.json({ success: false, error: e.message || 'Internal Server Error' }, { status: 500 });
    }
}
