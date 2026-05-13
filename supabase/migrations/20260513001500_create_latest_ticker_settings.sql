begin;

create table if not exists public.latest_ticker_global_settings (
  id integer primary key default 1,
  is_enabled boolean not null default true,
  interval_seconds integer not null default 4,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint latest_ticker_global_settings_singleton_check check (id = 1),
  constraint latest_ticker_global_settings_interval_check check (interval_seconds >= 3 and interval_seconds <= 10)
);

create table if not exists public.latest_ticker_sections (
  id uuid primary key default gen_random_uuid(),
  section_key text not null unique,
  section_name text not null,
  is_enabled boolean not null default true,
  sort_order integer not null default 0,
  display_count integer not null default 3,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint latest_ticker_sections_key_check check (section_key in ('news', 'jobs', 'housing', 'secondhand', 'services')),
  constraint latest_ticker_sections_display_count_check check (display_count >= 1 and display_count <= 20)
);

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

drop trigger if exists trg_latest_ticker_global_settings_set_updated_at on public.latest_ticker_global_settings;
create trigger trg_latest_ticker_global_settings_set_updated_at
before update on public.latest_ticker_global_settings
for each row
execute function public.set_updated_at();

drop trigger if exists trg_latest_ticker_sections_set_updated_at on public.latest_ticker_sections;
create trigger trg_latest_ticker_sections_set_updated_at
before update on public.latest_ticker_sections
for each row
execute function public.set_updated_at();

create index if not exists latest_ticker_sections_sort_order_idx
  on public.latest_ticker_sections (sort_order, section_key);

insert into public.latest_ticker_global_settings (id, is_enabled, interval_seconds)
values (1, true, 4)
on conflict (id) do nothing;

insert into public.latest_ticker_sections (section_key, section_name, is_enabled, sort_order, display_count)
values
  ('news', '新闻', true, 10, 5),
  ('jobs', '招聘', true, 20, 3),
  ('housing', '房屋', true, 30, 3),
  ('secondhand', '二手', true, 40, 3),
  ('services', '本地服务', true, 50, 3)
on conflict (section_key) do nothing;

commit;
