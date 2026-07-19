import React from 'react';
import { redirect } from 'next/navigation';
import { getUserProfile } from '@/app/lib/auth';
import { 
    getServiceCategories, 
    getPendingServiceProviders, 
    getAllServiceProviders 
} from '@/app/lib/actions/services-marketplace';
import ServicesCMS from './ServicesCMS';

export const dynamic = 'force-dynamic';

export default async function ServicesAdminPage() {
    const profile = await getUserProfile();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
        redirect('/dashboard');
    }

    const [categoriesRes, pendingRes, allRes] = await Promise.all([
        getServiceCategories(),
        getPendingServiceProviders(),
        getAllServiceProviders()
    ]);

    return (
        <div className="p-4 md:p-8 min-h-screen bg-slate-950 text-white pt-20">
            <div className="max-w-7xl mx-auto space-y-6">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5 text-left">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                            Services Marketplace Admin
                        </h1>
                        <p className="text-xs md:text-sm text-slate-400 mt-1">
                            Gestionează categoriile de servicii imobiliare premium și aprobă solicitările furnizorilor de parteneriat.
                        </p>
                    </div>
                </header>

                <ServicesCMS 
                    initialCategories={categoriesRes.categories || []}
                    initialPending={pendingRes.providers || []}
                    initialAll={allRes.providers || []}
                />
            </div>
        </div>
    );
}
