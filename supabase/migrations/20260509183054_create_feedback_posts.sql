begin;

create table if not exists public.feedback_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  type text not null,
  contact text,
  related_url text,
  content text not null,
  status text not null default 'pending',
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint feedback_posts_status_check check (status in ('pending', 'processing', 'resolved', 'ignored'))
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

drop trigger if exists trg_feedback_posts_set_updated_at on public.feedback_posts;
create trigger trg_feedback_posts_set_updated_at
before update on public.feedback_posts
for each row
execute function public.set_updated_at();

alter table public.feedback_posts enable row level security;

drop policy if exists "Anyone can insert feedback posts" on public.feedback_posts;
create policy "Anyone can insert feedback posts"
  on public.feedback_posts
  for insert
  with check (true);

drop policy if exists "Users can read own feedback posts" on public.feedback_posts;
create policy "Users can read own feedback posts"
  on public.feedback_posts
  for select
  to authenticated
  using (auth.uid() = user_id);

create index if not exists feedback_posts_user_id_idx on public.feedback_posts (user_id);
create index if not exists feedback_posts_status_idx on public.feedback_posts (status);
create index if not exists feedback_posts_created_at_desc_idx on public.feedback_posts (created_at desc);

commit;
