alter table public.feedback_posts
add column if not exists visitor_id text;

create index if not exists feedback_posts_visitor_id_created_at_idx
on public.feedback_posts (visitor_id, created_at desc);

create index if not exists feedback_posts_user_id_created_at_idx
on public.feedback_posts (user_id, created_at desc);
