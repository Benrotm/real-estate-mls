alter table leads 
add column if not exists search_duration text,
add column if not exists viewed_count_total text,
add column if not exists move_urgency text,
add column if not exists payment_method text,
add column if not exists bank_status text,
add column if not exists budget_vs_market text,
add column if not exists agent_interest_rating text,
add column if not exists viewed_count_agent integer default 0,
add column if not exists last_viewing_date date,
add column if not exists outcome_status text,
add column if not exists next_steps_summary text;
