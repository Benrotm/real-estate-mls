import { NextResponse } from 'next/server';
import { saveCalculatorSettings } from '@/app/lib/actions/calculator-settings';

export async function PUT(req: Request) {
    try {
        const { key, value } = await req.json();
        
        if (!key || value === undefined) {
            return NextResponse.json({ error: 'Parametrii key și value sunt obligatorii' }, { status: 400 });
        }

        const result = await saveCalculatorSettings(key, value);
        
        if (result.error) {
            return NextResponse.json({ error: result.error }, { status: 403 });
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error('[API Admin Calculator Settings PUT] Error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
