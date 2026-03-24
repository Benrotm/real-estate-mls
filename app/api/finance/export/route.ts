import { NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Extremely basic CSV stringifier for safe backend export
function toCsv(rows: any[]) {
    if (!rows || rows.length === 0) return '';
    const keys = Object.keys(rows[0]);
    const header = keys.join(',');
    const body = rows.map(r => keys.map(k => `"${String(r[k]).replace(/"/g, '""')}"`).join(',')).join('\n');
    return `${header}\n${body}`;
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const format = searchParams.get('format') || 'csv';
        const type = searchParams.get('type') || 'all'; // all, transactions, expenses
        const viewTeam = searchParams.get('viewTeam') === 'true';

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return new NextResponse('Unauthorized', { status: 401 });

        const supabaseAdmin = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        let exportData: any[] = [];

        if (type === 'all' || type === 'transactions') {
            let txQuery = supabaseAdmin.from('transactions').select('*');
            txQuery = viewTeam ? txQuery.eq('agency_id', user.id) : txQuery.eq('agent_id', user.id);
            const { data: tx } = await txQuery;
            if (tx) exportData.push(...tx.map(t => ({ source: 'deal', ...t })));
        }

        if (type === 'all' || type === 'expenses') {
            let recordQuery = supabaseAdmin.from('financial_records').select('*');
            recordQuery = viewTeam ? recordQuery.eq('agency_id', user.id) : recordQuery.eq('user_id', user.id);
            const { data: rec } = await recordQuery;
            if (rec) exportData.push(...rec.map(r => ({ source: 'record', ...r })));
        }

        // Generate response
        if (format === 'csv') {
            const csvData = toCsv(exportData);
            return new NextResponse(csvData, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': 'attachment; filename="financial_export.csv"',
                },
            });
        }

        return NextResponse.json({ data: exportData });
    } catch (e: any) {
        console.error('[Finance Export] Error:', e);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
