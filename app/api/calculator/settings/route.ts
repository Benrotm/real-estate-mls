import { NextResponse } from 'next/server';
import { getCalculatorSettings } from '@/app/lib/actions/calculator-settings';

export async function GET() {
    try {
        const response = await getCalculatorSettings();
        return NextResponse.json(response);
    } catch (e: any) {
        console.error('[API Public Calculator Settings GET] Error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
