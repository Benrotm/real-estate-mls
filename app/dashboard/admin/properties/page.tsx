import { fetchAllPropertiesAdmin } from '@/app/lib/actions/admin';
import { createClient } from '@/app/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminPropertiesPage() {
    let properties: any[] = [];
    let errorMsg = null;

    try {
        properties = await fetchAllPropertiesAdmin();
    } catch (err: any) {
        errorMsg = err.message;
    }

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Properties Restore Step 1</h1>
            {errorMsg && <div className="text-red-500 font-bold">Fetch Error: {errorMsg}</div>}

            <div className="mb-4 font-mono text-sm">
                Total Properties: {properties.length}
            </div>

            <ul className="list-disc pl-5">
                {properties.map((p: any) => (
                    <li key={p.id}>
                        {p.title} - Status: {p.status} - Owner: {p.owner?.full_name || 'No Owner'}
                    </li>
                ))}
            </ul>
        </div>
    );
}
