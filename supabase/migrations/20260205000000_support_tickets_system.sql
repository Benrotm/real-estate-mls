-- Create Enums for Tickets
create type ticket_type as enum ('bug', 'property_report', 'feature_request', 'other');
create type ticket_status as enum ('open', 'in_progress', 'resolved', 'closed');
create type ticket_priority as enum ('low', 'medium', 'high', 'critical');

-- Create Tickets Table
create table if not exists tickets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete set null,
  type ticket_type not null default 'other',
  subject text not null,
  description text not null,
  status ticket_status not null default 'open',
  priority ticket_priority not null default 'medium',
  images jsonb default '[]'::jsonb,
  admin_notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on tickets
alter table tickets enable row level security;

-- RLS Policies for Tickets

-- Users can view their own tickets
create policy "Users can view their own tickets"
  on tickets for select
  using (auth.uid() = user_id);

-- Users can create tickets
create policy "Users can create tickets"
  on tickets for insert
  with check (auth.uid() = user_id);

-- Admins can view all tickets
create policy "Admins can view all tickets"
  on tickets for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and (profiles.role = 'admin' or profiles.role = 'superadmin')
    )
  );

-- Admins can update tickets
create policy "Admins can update tickets"
  on tickets for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and (profiles.role = 'admin' or profiles.role = 'superadmin')
    )
  );

-- Update Messages Table for Attachments
alter table messages
add column if not exists attachments jsonb default '[]'::jsonb;

-- Trigger for updated_at on tickets
create trigger update_tickets_updated_at
  before update on tickets
  for each row
  execute function update_updated_at_column();
