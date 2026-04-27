-- Create housing_posts table (OpenAA)
-- This file is intended to be run manually in Supabase SQL editor.

begin;

create table if not exists public.housing_posts (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null default 'renting',
  title text not null default '房屋信息',
  description text not null,
  price numeric not null default 0,
  location text not null default '其它地区',
  room_type text,
  contact text,
  images jsonb not null default '[]'::jsonb,
  status text not null default 'published',
  views integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint housing_posts_type_check check (type in ('renting', 'seeking')),
  constraint housing_posts_status_check check (status in ('published', 'hidden', 'deleted'))
);

-- Enable Row Level Security
alter table public.housing_posts enable row level security;

-- Policies
-- Supabase/Postgres does not support: create policy if not exists
-- Use a safe drop+create pattern.

-- 1) Public can read published housing posts
drop policy if exists "Public can read published housing posts" on public.housing_posts;
create policy "Public can read published housing posts"
  on public.housing_posts
  for select
  using (status = 'published');

-- 2) Authenticated users can insert own posts
drop policy if exists "Users can insert own housing posts" on public.housing_posts;
create policy "Users can insert own housing posts"
  on public.housing_posts
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- 3) Users can update own posts
drop policy if exists "Users can update own housing posts" on public.housing_posts;
create policy "Users can update own housing posts"
  on public.housing_posts
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 4) Users can delete own posts
drop policy if exists "Users can delete own housing posts" on public.housing_posts;
create policy "Users can delete own housing posts"
  on public.housing_posts
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Indexes
create index if not exists housing_posts_type_idx on public.housing_posts (type);
create index if not exists housing_posts_status_idx on public.housing_posts (status);
create index if not exists housing_posts_user_id_idx on public.housing_posts (user_id);
create index if not exists housing_posts_created_at_desc_idx on public.housing_posts (created_at desc);

commit;
