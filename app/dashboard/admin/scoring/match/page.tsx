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

            {/* Explanation Section */}
            <div className="mt-12 bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">How the Matching Engine Works</h2>
                
                <div className="space-y-6 text-slate-600 text-sm leading-relaxed">
                    <p>
                        The AI Matching Engine compares a <strong>Lead's Preferences</strong> against a <strong>Property's Details</strong> to calculate a compatibility score. 
                        The engine separates criteria into <strong>Strict Requirements</strong> (which can instantly disqualify a property) and <strong>Bonus Preferences</strong> (which only add points).
                    </p>

                    <div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                            Strict Requirements (The "Zero-Score" Rules)
                        </h3>
                        <p className="mb-3">
                            If any of the following Core Criteria are toggled <strong>ACTIVE</strong>, they act as strict filters. If a property fails to meet an active strict requirement, its match score drops to <strong>0</strong> immediately, regardless of how well it matches everything else.
                        </p>
                        <ul className="list-disc pl-5 space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <li><strong>Transaction Type:</strong> A buyer looking for "For Sale" will score 0 on "For Rent" properties.</li>
                            <li><strong>Property Type:</strong> A lead wanting an "Apartment" will score 0 on "House" listings.</li>
                            <li><strong>City Match:</strong> If a lead specifies target city/cities, properties in other cities score 0.</li>
                            <li><strong>Neighborhood (Area) & Drawn Map Area:</strong> If the lead selects specific areas or a drawn map polygon, the property MUST match one of the requested areas or fall inside the drawn polygon. Otherwise, it scores 0.</li>
                            <li><strong>Budget:</strong> If the property price exceeds the Lead's Max Budget + the configured Margin % (e.g., 100k budget + 10% margin = 110k absolute limit), it scores 0. Same applies for Min Budget.</li>
                            <li><strong>Rooms:</strong> For residential properties, if the property has fewer rooms than the Lead's minimum preference, it scores 0. (Non-residential properties are exempt).</li>
                            <li><strong>Rental Rules (Small Kids, Pets & Smoking):</strong> For "For Rent" properties, if the property forbids Pets, Small Kids, or Smoking, any Lead with conflicting habits/kids will score 0 immediately when the rule is ACTIVE.</li>
                        </ul>
                        <p className="mt-3 text-xs italic text-slate-500">
                            * Tip: If you notice "inconsistencies" where a seemingly good property scores 0, check if it violated one of the strict rules above (most commonly the City, Budget Margin, or Area Margin). Toggle the rule to INACTIVE if you want the engine to be flexible.
                        </p>
                    </div>

                    <div className="pt-4">
                        <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            Bonus Preferences (The "Point-Stacking" Rules)
                        </h3>
                        <p className="mb-3">
                            All other criteria (Surface, Floor, Year Built, Bathrooms, Comfort, Furnishing, Features) are treated as bonuses. They <strong>never</strong> disqualify a property or drop the score to 0. 
                        </p>
                        <ul className="list-disc pl-5 space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <li>If the property matches the preference, it earns the assigned points.</li>
                            <li>If it doesn't match (or the lead left the preference blank), it simply earns 0 points for that specific rule, but keeps all other points.</li>
                            <li><strong>Features Match:</strong> Grants points <em>per matched feature</em>. If the rule is worth 1 point and the property matches 3 of the lead's requested features, it earns 3 points.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
