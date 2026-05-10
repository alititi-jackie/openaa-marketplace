alter table public.ads
add column if not exists contact_name text,
add column if not exists phone text,
add column if not exists wechat text;

alter table public.job_postings
add column if not exists contact_name text,
add column if not exists phone text,
add column if not exists wechat text;

alter table public.secondhand_items
add column if not exists contact_name text,
add column if not exists phone text,
add column if not exists wechat text;

alter table public.housing_posts
add column if not exists contact_name text,
add column if not exists phone text,
add column if not exists wechat text;
