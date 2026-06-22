import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        hasRomimoKey: !!process.env.ROMIMO_API_KEY,
        romimoKeyLength: process.env.ROMIMO_API_KEY ? process.env.ROMIMO_API_KEY.length : 0,
        romimoKeyStart: process.env.ROMIMO_API_KEY ? process.env.ROMIMO_API_KEY.substring(0, 3) : null
    });
}
