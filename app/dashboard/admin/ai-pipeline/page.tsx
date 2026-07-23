import React from 'react';
import { getAIPipelineData } from '@/app/lib/actions/user-activity';
import AIPipelineClient from './AIPipelineClient';

export const dynamic = 'force-dynamic';

export default async function AIPipelinePage() {
    const data = await getAIPipelineData();

    if ('error' in data && data.error) {
        return (
            <div className="p-8 text-center text-red-600 bg-red-50 rounded-xl m-6 border border-red-200">
                <h3 className="font-bold text-lg">Eroare la încărcarea AI Pipeline</h3>
                <p className="text-sm mt-1">{data.error}</p>
            </div>
        );
    }

    return (
        <AIPipelineClient 
            initialUsers={data.users || []} 
            initialRecommendation={data.recommendationConfig || { text: '', points: 50 }} 
        />
    );
}
