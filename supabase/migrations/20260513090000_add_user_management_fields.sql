begin;

alter table public.users
add column if not exists status text not null default 'active',
add column if not exists admin_note text,
add column if not exists banned_reason text,
add column if not exists banned_at timestamptz,
add column if not exists banned_by text,
add column if not exists last_admin_action_at timestamptz;

alter table public.users
drop constraint if exists users_status_check;

alter table public.users
add constraint users_status_check
check (status in ('active', 'restricted', 'banned'));

create index if not exists users_status_idx on public.users(status);
create index if not exists users_created_at_idx on public.users(created_at);

commit;
