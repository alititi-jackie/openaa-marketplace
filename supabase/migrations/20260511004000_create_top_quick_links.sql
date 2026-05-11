begin;

create table if not exists public.top_quick_links (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  open_mode text not null default 'same',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint top_quick_links_open_mode_check check (open_mode in ('same', 'new'))
);

create index if not exists top_quick_links_active_sort_idx
  on public.top_quick_links (is_active, sort_order, created_at);

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

drop trigger if exists trg_top_quick_links_set_updated_at on public.top_quick_links;
create trigger trg_top_quick_links_set_updated_at
before update on public.top_quick_links
for each row
execute function public.set_updated_at();

insert into public.top_quick_links (title, url, open_mode, sort_order, is_active)
select v.title, v.url, v.open_mode, v.sort_order, true
from (
  values
    ('招聘', '/jobs', 'same', 10),
    ('房屋', '/housing', 'same', 20),
    ('二手', '/secondhand', 'same', 30),
    ('本地服务', '/services', 'same', 40),
    ('新闻', '/news', 'same', 50),
    ('DMV', 'https://openaa.com/dmv', 'same', 60),
    ('导航', '/navigation', 'same', 70),
    ('反馈', '/feedback', 'same', 80)
) as v(title, url, open_mode, sort_order)
where not exists (
  select 1
  from public.top_quick_links t
  where t.title = v.title and t.url = v.url
);

commit;
