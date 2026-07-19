import React from 'react';
import { getServiceCategories } from '@/app/lib/actions/services-marketplace';
import { getUserProfile } from '@/app/lib/auth';
import RegisterWizardClient from './RegisterWizardClient';

export const dynamic = 'force-dynamic';

export default async function RegisterPartnerPage() {
    const { categories } = await getServiceCategories();
    const profile = await getUserProfile();

    return (
        <RegisterWizardClient 
            categories={categories} 
            initialUser={profile} 
        />
    );
}
