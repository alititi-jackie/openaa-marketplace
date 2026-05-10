-- Migration: widen status constraint for job_postings and secondhand_items
-- to include 'hidden' and 'deleted', aligning with housing_posts which already supports them.
-- 'unpublished' is retained for backward-compat with existing rows.

-- job_postings
alter table public.job_postings
  drop constraint if exists job_postings_status_check;

alter table public.job_postings
  add constraint job_postings_status_check
  check (status in ('published', 'hidden', 'deleted', 'unpublished'));

-- secondhand_items
alter table public.secondhand_items
  drop constraint if exists secondhand_items_status_check;

alter table public.secondhand_items
  add constraint secondhand_items_status_check
  check (status in ('published', 'hidden', 'deleted', 'unpublished'));
