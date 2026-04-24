-- Create ads table
create table if not exists public.ads (
  id           uuid primary key default gen_random_uuid(),
  image_url    text not null,
  link_url     text not null,
  position     text not null check (position in ('home', 'jobs', 'secondhand')),
  start_date   timestamptz null,
  end_date     timestamptz null,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

-- Index for efficient active-ad queries
create index if not exists idx_ads_position_active
  on public.ads (position, is_active, start_date, end_date, created_at);

-- Enable Row Level Security
alter table public.ads enable row level security;

-- Public read policy: allow anyone to select active ads
create policy "Public can read active ads"
  on public.ads
  for select
  using (true);

-- Note: insert/update/delete are handled by API routes using the service role key
-- (SUPABASE_SERVICE_ROLE_KEY env var), which bypasses RLS.
-- Add SUPABASE_SERVICE_ROLE_KEY to your .env.local before running admin routes.
