import { fetchScoringRules } from '@/app/lib/actions/scoring';
import ScoringRulesEditor from './ScoringRulesEditor';

export default async function ScoringPage() {
    // Fetch all rules initially to support tab switching in client
    const allRules = await fetchScoringRules();

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Scoring & Matching Configuration</h1>
                <p className="text-slate-600">
                    Adjust the point values for different criteria across Leads, Properties, and Property Matching.
                    These weights directly influence agent prioritization and lead-property compatibility scores.
                </p>
            </div>

            <ScoringRulesEditor initialRules={allRules} />
        </div>
    );
}
