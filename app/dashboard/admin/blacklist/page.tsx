import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getUserProfile } from '@/app/lib/auth';
import { getBlacklistedPhones, getBlacklistedProperties } from '@/app/lib/actions/blacklist';
import BlacklistClient from './BlacklistClient';

export const metadata: Metadata = {
    title: 'Blacklist Telefonic & Proprietăți Excluse | Admin MLS',
    description: 'Gestionează numerele de telefon din blacklist și proprietățile scoase din stadiul de publicat.',
};

export default async function AdminBlacklistPage() {
    const user = await getUserProfile();

    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        redirect('/unauthorized');
    }

    const [phonesRes, propsRes] = await Promise.all([
        getBlacklistedPhones(),
        getBlacklistedProperties(),
    ]);

    return (
        <main className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen">
            <BlacklistClient
                initialPhones={phonesRes.data || []}
                initialProperties={propsRes.data || []}
            />
        </main>
    );
}
