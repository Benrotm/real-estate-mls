import { fetchScoringRules } from '@/app/lib/actions/scoring';
import ScoringRulesEditor from '../ScoringRulesEditor';

export default async function MatchScoringPage() {
    // Fetch all rules initially to support tab switching in client
    const allRules = await fetchScoringRules();

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">AI Matching Configuration</h1>
                <p className="text-slate-600">
                    Adjust the weights for the compatibility engine that matches Properties to Leads.
                    Higher weights make a criteria more important for the final score.
                </p>
            </div>

            <ScoringRulesEditor initialRules={allRules} initialScope="match" />
        </div>
    );
}
