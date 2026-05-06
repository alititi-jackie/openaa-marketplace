-- Create service_posts table (OpenAA Local Services)
-- This file is intended to be run manually in Supabase SQL editor.

begin;

create table if not exists public.service_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text not null,
  location text not null,
  description text not null,
  contact_name text,
  phone text,
  wechat text,
  price_note text,
  images text[] not null default '{}',
  status text not null default 'active',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint service_posts_status_check check (status in ('active', 'hidden', 'deleted'))
);

-- Enable Row Level Security
alter table public.service_posts enable row level security;

-- Policies
-- Supabase/Postgres does not support: create policy if not exists
-- Use a safe drop+create pattern.

-- 1) Public can read active service posts
drop policy if exists "Public can read active service posts" on public.service_posts;
create policy "Public can read active service posts"
  on public.service_posts
  for select
  using (status = 'active' and is_active = true);

-- 2) Authenticated users can insert own posts
drop policy if exists "Users can insert own service posts" on public.service_posts;
create policy "Users can insert own service posts"
  on public.service_posts
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- 3) Users can update own posts
drop policy if exists "Users can update own service posts" on public.service_posts;
create policy "Users can update own service posts"
  on public.service_posts
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 4) Users can delete own posts
drop policy if exists "Users can delete own service posts" on public.service_posts;
create policy "Users can delete own service posts"
  on public.service_posts
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Indexes
create index if not exists service_posts_status_is_active_idx on public.service_posts (status, is_active);
create index if not exists service_posts_user_id_idx on public.service_posts (user_id);
create index if not exists service_posts_created_at_desc_idx on public.service_posts (created_at desc);
create index if not exists service_posts_category_idx on public.service_posts (category);

commit;
