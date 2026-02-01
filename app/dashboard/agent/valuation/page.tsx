import { hasFeature, SYSTEM_FEATURES } from '@/app/lib/auth/features';
import { redirect } from 'next/navigation';
import ValuationClient from './ValuationClient';
import { getUserProperties } from '@/app/lib/actions/properties';

export default async function ValuationPage() {
    const properties = await getUserProperties();
    return <ValuationClient properties={properties} />;
}
