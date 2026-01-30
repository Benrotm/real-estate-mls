import { fetchScoringRules } from '@/app/lib/actions/scoring';
import ScoringRulesEditor from './ScoringRulesEditor';

export default async function ScoringPage() {
    const rules = await fetchScoringRules();

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Lead Scoring Configuration</h1>
                <p className="text-slate-600">
                    Adjust the point values for different lead criteria. These scores are used to calculate the "Lead Score"
                    which helps agents prioritize their pipeline. Changes apply to the next lead update.
                </p>
            </div>

            <ScoringRulesEditor initialRules={rules} />
        </div>
    );
}
