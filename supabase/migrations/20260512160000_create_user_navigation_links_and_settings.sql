begin;

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

create table if not exists public.user_navigation_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  url text not null,
  description text,
  open_mode text not null default 'auto',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_navigation_links_open_mode_check check (open_mode in ('auto', 'same', 'new'))
);

create index if not exists user_navigation_links_user_sort_idx
  on public.user_navigation_links (user_id, is_active, sort_order, created_at);

drop trigger if exists trg_user_navigation_links_set_updated_at on public.user_navigation_links;
create trigger trg_user_navigation_links_set_updated_at
before update on public.user_navigation_links
for each row
execute function public.set_updated_at();

alter table public.user_navigation_links enable row level security;

drop policy if exists "Users can read own navigation links" on public.user_navigation_links;
create policy "Users can read own navigation links"
on public.user_navigation_links
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own navigation links" on public.user_navigation_links;
create policy "Users can insert own navigation links"
on public.user_navigation_links
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own navigation links" on public.user_navigation_links;
create policy "Users can update own navigation links"
on public.user_navigation_links
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  navigation_default text not null default 'public',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_settings_navigation_default_check check (navigation_default in ('public', 'my'))
);

drop trigger if exists trg_user_settings_set_updated_at on public.user_settings;
create trigger trg_user_settings_set_updated_at
before update on public.user_settings
for each row
execute function public.set_updated_at();

alter table public.user_settings enable row level security;

drop policy if exists "Users can read own settings" on public.user_settings;
create policy "Users can read own settings"
on public.user_settings
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own settings" on public.user_settings;
create policy "Users can insert own settings"
on public.user_settings
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own settings" on public.user_settings;
create policy "Users can update own settings"
on public.user_settings
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

commit;
