import { hasFeature, SYSTEM_FEATURES } from '@/app/lib/auth/features';
import { redirect } from 'next/navigation';
import ValuationClient from './ValuationClient';

export default async function ValuationPage() {
    if (!await hasFeature(SYSTEM_FEATURES.VALUATION_REPORTS)) {
        redirect('/dashboard?error=upgrade_required_valuation');
    }

    return <ValuationClient />;
}
