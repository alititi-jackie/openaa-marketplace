begin;

create table if not exists public.home_latest_sections (
  id uuid primary key default gen_random_uuid(),
  section_key text not null unique,
  section_name text not null,
  section_type text not null,
  parent_key text null,
  is_visible boolean not null default true,
  display_order integer not null default 0,
  limit_count integer not null default 3,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'home_latest_sections_type_check'
      and conrelid = 'public.home_latest_sections'::regclass
  ) then
    alter table public.home_latest_sections
      add constraint home_latest_sections_type_check check (section_type in ('main', 'news_category'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'home_latest_sections_display_order_check'
      and conrelid = 'public.home_latest_sections'::regclass
  ) then
    alter table public.home_latest_sections
      add constraint home_latest_sections_display_order_check check (display_order >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'home_latest_sections_limit_count_check'
      and conrelid = 'public.home_latest_sections'::regclass
  ) then
    alter table public.home_latest_sections
      add constraint home_latest_sections_limit_count_check check (limit_count >= 1 and limit_count <= 30);
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'set_updated_at'
  ) then
    create function public.set_updated_at()
    returns trigger
    language plpgsql
    as $fn$
    begin
      new.updated_at = now();
      return new;
    end;
    $fn$;
  end if;
end;
$$;

drop trigger if exists trg_home_latest_sections_set_updated_at on public.home_latest_sections;
create trigger trg_home_latest_sections_set_updated_at
before update on public.home_latest_sections
for each row
execute function public.set_updated_at();

create index if not exists home_latest_sections_type_parent_order_idx
  on public.home_latest_sections (section_type, parent_key, display_order, section_key);

insert into public.home_latest_sections (
  section_key,
  section_name,
  section_type,
  parent_key,
  is_visible,
  display_order,
  limit_count
)
select
  v.section_key,
  v.section_name,
  v.section_type,
  v.parent_key,
  v.is_visible,
  v.display_order,
  v.limit_count
from (
  values
    ('latest_jobs', '最新招聘', 'main', null, true, 10, 6),
    ('latest_housing', '最新房屋', 'main', null, true, 20, 6),
    ('latest_secondhand', '最新二手', 'main', null, true, 30, 6),
    ('latest_services', '本地服务', 'main', null, true, 40, 6),
    ('latest_news', '最新新闻', 'main', null, true, 50, 15),
    ('news_local', '本地新闻', 'news_category', 'latest_news', true, 10, 3),
    ('news_guide', '新手指南', 'news_category', 'latest_news', true, 20, 3),
    ('news_dmv', 'DMV教程', 'news_category', 'latest_news', true, 30, 3),
    ('news_life', '生活指南', 'news_category', 'latest_news', true, 40, 3),
    ('news_announcement', '平台公告', 'news_category', 'latest_news', true, 50, 3)
) as v(section_key, section_name, section_type, parent_key, is_visible, display_order, limit_count)
where not exists (
  select 1 from public.home_latest_sections h where h.section_key = v.section_key
);

commit;
