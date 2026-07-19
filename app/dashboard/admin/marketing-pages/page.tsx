import { getMarketingPage } from '@/app/lib/actions/marketing-pages';
import { getUserProfile } from '@/app/lib/auth';
import { redirect } from 'next/navigation';
import MarketingPagesCMS from './MarketingPagesCMS';

export const dynamic = 'force-dynamic';

export default async function MarketingPagesAdminPage() {
    const profile = await getUserProfile();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
        redirect('/dashboard');
    }

    // Load initial configs for the three pages
    const [clientsRes, ownersRes, brokersRes] = await Promise.all([
        getMarketingPage('clients'),
        getMarketingPage('owners'),
        getMarketingPage('brokers')
    ]);

    const initialPages = {
        clients: clientsRes.page || { page_key: 'clients', title: '', subtitle: '', sections: [] },
        owners: ownersRes.page || { page_key: 'owners', title: '', subtitle: '', sections: [] },
        brokers: brokersRes.page || { page_key: 'brokers', title: '', subtitle: '', sections: [] }
    };

    return (
        <div className="p-4 md:p-8 min-h-screen bg-slate-950 text-white pt-20">
            <div className="max-w-7xl mx-auto space-y-6">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                            Marketing Pages Builder
                        </h1>
                        <p className="text-xs md:text-sm text-slate-400 mt-1">
                            Personalizează paginile de marketing (For Clients, For Owners, For Brokers) și conținutul secțiunilor acestora.
                        </p>
                    </div>
                </header>

                <MarketingPagesCMS initialPages={initialPages} />
            </div>
        </div>
    );
}
