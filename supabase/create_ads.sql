-- Create ads table
create table if not exists public.ads (
  id           uuid primary key default gen_random_uuid(),
  image_url    text not null,
  link_url     text,
  position     text not null check (position in ('home', 'jobs', 'secondhand')),
  start_date   timestamptz null,
  end_date     timestamptz null,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  -- Dual link type support
  link_type    text not null default 'external' check (link_type in ('external', 'internal')),
  external_url text,
  slug         text,
  content      text,
  -- Open mode: controls how clicking the ad navigates the user
  open_mode    text not null default 'external_new' check (open_mode in ('internal', 'external_new', 'external_same'))
  -- Note: link_url is kept for backward compatibility with existing rows.
  -- New external ads should use external_url; link_url mirrors it on insert.
);

-- Index for efficient active-ad queries
create index if not exists idx_ads_position_active
  on public.ads (position, is_active, start_date, end_date, created_at);

-- Partial unique index: internal ads must have unique slugs
create unique index if not exists ads_internal_slug_unique
  on public.ads (slug)
  where link_type = 'internal' and slug is not null;

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

-- Migration: add dual link type columns to existing ads table
-- Run this if the table already exists without these columns:
--
-- alter table public.ads
--   add column if not exists link_type    text not null default 'external'
--     check (link_type in ('external', 'internal')),
--   add column if not exists external_url text,
--   add column if not exists slug         text,
--   add column if not exists content      text;
--
-- -- In PostgreSQL, ADD COLUMN ... NOT NULL DEFAULT ... applies the default to
-- -- all existing rows atomically, so this is safe to run in a single statement.
-- alter table public.ads
--   add column if not exists open_mode    text not null default 'external_new'
--     check (open_mode in ('internal', 'external_new', 'external_same'));
--
-- update public.ads set external_url = link_url where link_type = 'external';
-- update public.ads set open_mode = 'internal' where link_type = 'internal';
-- update public.ads set open_mode = 'external_new' where link_type = 'external';
--
-- create unique index if not exists ads_internal_slug_unique
--   on public.ads (slug)
--   where link_type = 'internal' and slug is not null;
