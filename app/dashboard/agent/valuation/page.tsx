import { hasFeature, SYSTEM_FEATURES } from '@/app/lib/auth/features';
import { redirect } from 'next/navigation';
import ValuationClient from './ValuationClient';

export default async function ValuationPage() {
    // Feature verification removed per user request
    return <ValuationClient />;
}
