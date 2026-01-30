-- 1. Clean up potential duplicates to allow adding unique constraint
DELETE FROM scoring_rules a USING scoring_rules b WHERE a.id < b.id AND a.criteria_key = b.criteria_key;

-- 2. Add Unique Constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'scoring_rules_criteria_key_key') THEN
        ALTER TABLE scoring_rules ADD CONSTRAINT scoring_rules_criteria_key_key UNIQUE (criteria_key);
    END IF;
END $$;

-- 3. Comprehensive Seed (Upserts)
INSERT INTO scoring_rules (category, criteria_key, label, weight, is_active) VALUES
-- 1. Search Duration
('Classification', 'search_duration_under_1m', 'Search Duration: < 1 month', 10, true),
('Classification', 'search_duration_1_3m', 'Search Duration: 1-3 months', 5, true),
('Classification', 'search_duration_3_6m', 'Search Duration: 3-6 months', 0, true),
('Classification', 'search_duration_over_6m', 'Search Duration: > 6 months', -5, true),

-- 2. Variants Viewed (Total)
('Classification', 'viewed_total_0', 'Variants Viewed: 0', 0, true),
('Classification', 'viewed_total_1_2', 'Variants Viewed: 1-2', 5, true),
('Classification', 'viewed_total_3_5', 'Variants Viewed: 3-5', 10, true),
('Classification', 'viewed_total_over_5', 'Variants Viewed: > 5', 5, true),

-- 3. Move Urgency
('Classification', 'urgency_urgent', 'Urgency: Urgent (< 1 month)', 20, true),
('Classification', 'urgency_moderate', 'Urgency: Moderate (1-3 months)', 10, true),
('Classification', 'urgency_low', 'Urgency: Low (> 3 months)', 0, true),

-- 4. Financial: Bank Status
('Financial', 'bank_status_no', 'Bank Status: No / Not Started', -10, true),
('Financial', 'bank_status_in_progress', 'Bank Status: In Progress', 10, true),
('Financial', 'bank_status_pre_approved', 'Bank Status: Pre-approved', 30, true),
('Financial', 'bank_status_not_needed', 'Bank Status: Not Needed (Cash)', 30, true),

-- 5. Financial: Budget vs Market
('Financial', 'budget_market_realistic', 'Budget vs Market: Realistic', 20, true),
('Financial', 'budget_market_low', 'Budget vs Market: Low / Difficult', -20, true),
('Financial', 'budget_market_high', 'Budget vs Market: Generous', 30, true),
('Financial', 'budget_market_unsure', 'Budget vs Market: Unsure', 0, true),

-- 6. Agent Interest
('Classification', 'agent_interest_high', 'Agent Interest: High', 20, true),
('Classification', 'agent_interest_moderate', 'Agent Interest: Moderate', 10, true),
('Classification', 'agent_interest_low', 'Agent Interest: Low', -10, true),

-- 7. Viewing: Agent Activity
('Viewing', 'viewed_agent_active', 'Viewed with Agent (> 0)', 10, true),
('Viewing', 'viewed_agent_high_activity', 'High Agent Activity (> 3 viewed)', 10, true),

-- 8. Viewing: Recency
('Viewing', 'viewing_recent_7days', 'Last Viewing: < 7 days ago', 15, true),
('Viewing', 'viewing_recent_30days', 'Last Viewing: < 30 days ago', 5, true),

-- 9. Outcome Status
('Viewing', 'outcome_offer_made', 'Outcome: Offer Made', 50, true),
('Viewing', 'outcome_thinking', 'Outcome: Thinking / Interest', 20, true),
('Viewing', 'outcome_waiting_credit', 'Outcome: Waiting for Credit', 10, true),
('Viewing', 'outcome_still_searching', 'Outcome: Still Searching', 5, true),
('Viewing', 'outcome_not_interested', 'Outcome: Not Interested', -20, true)

ON CONFLICT (criteria_key) DO UPDATE SET
    label = EXCLUDED.label,
    category = EXCLUDED.category;
