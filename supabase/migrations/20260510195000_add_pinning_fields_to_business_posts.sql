alter table public.news_posts
add column if not exists is_pinned boolean not null default false,
add column if not exists pinned_until timestamptz,
add column if not exists pinned_order integer not null default 0;

alter table public.job_postings
add column if not exists is_pinned boolean not null default false,
add column if not exists pinned_until timestamptz,
add column if not exists pinned_order integer not null default 0;

alter table public.housing_posts
add column if not exists is_pinned boolean not null default false,
add column if not exists pinned_until timestamptz,
add column if not exists pinned_order integer not null default 0;

alter table public.secondhand_items
add column if not exists is_pinned boolean not null default false,
add column if not exists pinned_until timestamptz,
add column if not exists pinned_order integer not null default 0;

alter table public.service_posts
add column if not exists is_pinned boolean not null default false,
add column if not exists pinned_until timestamptz,
add column if not exists pinned_order integer not null default 0;

create index if not exists news_posts_pinned_idx
on public.news_posts (is_published, is_pinned, pinned_order, created_at desc);

create index if not exists job_postings_pinned_idx
on public.job_postings (status, is_pinned, pinned_order, created_at desc);

create index if not exists housing_posts_pinned_idx
on public.housing_posts (status, is_pinned, pinned_order, created_at desc);

create index if not exists secondhand_items_pinned_idx
on public.secondhand_items (status, is_pinned, pinned_order, created_at desc);

create index if not exists service_posts_pinned_idx
on public.service_posts (status, is_active, is_pinned, pinned_order, created_at desc);
