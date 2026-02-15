create table if not exists scraper_configs (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  domain text not null,
  selectors jsonb not null default '{}'::jsonb,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies
alter table scraper_configs enable row level security;

create policy "Admins can view scraper configs"
  on scraper_configs for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'superadmin')
    )
  );

create policy "Admins can insert scraper configs"
  on scraper_configs for insert
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'superadmin')
    )
  );

create policy "Admins can update scraper configs"
  on scraper_configs for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'superadmin')
    )
  );

create policy "Admins can delete scraper configs"
  on scraper_configs for delete
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'superadmin')
    )
  );
