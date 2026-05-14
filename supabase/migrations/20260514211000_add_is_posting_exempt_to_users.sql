alter table public.users
add column if not exists is_posting_exempt boolean not null default false;
