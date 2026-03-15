create table public.market_insights (
  id uuid default gen_random_uuid() primary key,
  original_url text,
  title text,
  description text,
  price_raw text,
  price numeric,
  currency text default 'EUR',
  days_on_market integer,
  status text default 'Sold',
  property_type text,
  county text,
  city text,
  area text,
  address text,
  rooms integer,
  bathrooms integer,
  usable_area numeric,
  built_area numeric,
  year_built integer,
  floor text,
  partitioning text,
  features text[],
  images text[],
  raw_extracted_data jsonb default '{}'::jsonb,
  scraped_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references auth.users(id) on delete set null
);

alter table public.market_insights enable row level security;

create policy "Admins can manage market_insights"
  on public.market_insights for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'super_admin')
    )
  );

create policy "Users can view market_insights"
  on public.market_insights for select
  using (true);
