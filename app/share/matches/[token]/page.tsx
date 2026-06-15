import React from 'react';
import { notFound } from 'next/navigation';
import { getPublicMatchesByToken } from '@/app/lib/actions/matches';
import PublicMatchesClient from './PublicMatchesClient';

export default async function PublicShareMatchesPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;

    const { lead, matches, error } = await getPublicMatchesByToken(token);

    if (error || !lead) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-md text-center">
                    <h2 className="text-xl font-black text-slate-900 mb-2">Link Expired or Invalid</h2>
                    <p className="text-slate-500 font-medium">This property matches link is no longer active or does not exist.</p>
                </div>
            </div>
        );
    }

    return <PublicMatchesClient token={token} lead={lead} initialMatches={matches || []} />;
}
