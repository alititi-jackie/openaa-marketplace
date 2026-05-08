begin;

create table if not exists public.news_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  category text not null check (category in ('新手指南', '平台公告', '本地新闻', 'DMV教程', '生活指南')),
  summary text,
  cover_image_url text,
  content text not null,
  seo_title text,
  seo_description text,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint news_posts_slug_format_check check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create index if not exists news_posts_is_published_published_at_idx
  on public.news_posts (is_published, published_at desc);

create index if not exists news_posts_category_published_at_idx
  on public.news_posts (category, published_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_news_posts_set_updated_at on public.news_posts;
create trigger trg_news_posts_set_updated_at
before update on public.news_posts
for each row
execute function public.set_updated_at();

alter table public.news_posts enable row level security;

drop policy if exists "Public can read published news posts" on public.news_posts;
create policy "Public can read published news posts"
  on public.news_posts
  for select
  using (is_published = true);

drop policy if exists "Admin can manage news posts" on public.news_posts;
create policy "Admin can manage news posts"
  on public.news_posts
  for all
  to authenticated
  using ((auth.jwt() ->> 'email') = '323748@gmail.com')
  with check ((auth.jwt() ->> 'email') = '323748@gmail.com');

commit;
