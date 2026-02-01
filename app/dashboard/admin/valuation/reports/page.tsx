import ValuationClient from '@/app/dashboard/agent/valuation/ValuationClient';
import { getProperties } from '@/app/lib/actions/properties';

export default async function AdminValuationReportsPage() {
    // Admin seeing all properties to run valuations
    const properties = await getProperties({});

    return (
        <div className="space-y-6">
            <ValuationClient properties={properties} />
        </div>
    );
}
