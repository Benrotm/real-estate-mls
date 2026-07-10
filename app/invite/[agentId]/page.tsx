import React from 'react';
import InviteLeadForm from './InviteLeadForm';
import { Metadata } from 'next';

interface Props {
    params: Promise<{
        agentId: string;
    }>;
}

export const metadata: Metadata = {
    title: 'Trimite Cerere Proprietate | Imobum',
    description: 'Completează preferințele tale de căutare pentru a găsi proprietatea potrivită.',
};

export default async function InvitePage({ params }: Props) {
    const { agentId } = await params;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-xl w-full mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
                {/* Form Header */}
                <div className="bg-gradient-to-r from-orange-500 to-rose-500 p-8 text-white text-center space-y-3">
                    <h1 className="text-xl sm:text-2xl font-normal tracking-tight leading-tight">
                        Let me know what property you are looking for so I can find the perfect match!
                    </h1>
                    <div className="w-16 h-1 bg-white/30 mx-auto rounded-full" />
                    <p className="text-sm font-semibold text-orange-100">
                        You will receive back a link with all properties matching your needs.
                    </p>
                </div>

                {/* Form Wrapper */}
                <div className="p-6 sm:p-8">
                    <InviteLeadForm agentId={agentId} />
                </div>
            </div>
        </div>
    );
}
