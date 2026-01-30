-- Add score column to leads table
alter table leads 
add column if not exists score numeric default 0;

-- Create scoring_rules table
create table if not exists scoring_rules (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  criteria_key text not null,
  label text not null,
  weight integer not null default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Enable RLS on scoring_rules
alter table scoring_rules enable row level security;

-- Policies for scoring_rules (Admins can manage, Agents can read)
-- For now, assuming authenticated users can read, only admins (if we had roles) can edit.
-- Keeping it simple: Authenticated users can read.
create policy "Enable read for authenticated users" on scoring_rules
  for select using (auth.role() = 'authenticated');

create policy "Enable all for users" on scoring_rules
    for all using (auth.role() = 'authenticated');

-- Seed initial rules
insert into scoring_rules (category, criteria_key, label, weight) values
-- Financial
('financial', 'payment_method_cash', 'Payment: Cash', 30),
('financial', 'payment_method_credit', 'Payment: Credit', 10),
('financial', 'bank_status_pre_approved', 'Bank: Pre-approved', 20),
('financial', 'budget_vs_market_realistic', 'Budget: Realistic', 20),
-- Urgency
('urgency', 'move_urgency_urgent', 'Urgency: High (< 1 month)', 30),
('urgency', 'move_urgency_moderate', 'Urgency: Moderate (1-3 months)', 15),
-- Classification
('classification', 'agent_interest_high', 'Agent Interest: High', 20),
('classification', 'agent_interest_moderate', 'Agent Interest: Moderate', 10);
