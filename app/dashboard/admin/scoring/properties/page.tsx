import { fetchScoringRules } from '@/app/lib/actions/scoring';
import ScoringRulesEditor from '../ScoringRulesEditor';

export default async function PropertyScoringPage() {
    const rules = await fetchScoringRules('property');

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Property Scoring Configuration</h1>
                <p className="text-slate-600">
                    Adjust the point values for different property criteria. These scores help rank properties for quality and completeness.
                </p>
            </div>

            <ScoringRulesEditor initialRules={rules} />
        </div>
    );
}
