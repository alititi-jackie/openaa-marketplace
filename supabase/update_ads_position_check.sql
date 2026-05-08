-- Migration: add 'news' to ads_position_check constraint
-- Run this against the production database if the table was created before 'news' was added.

alter table public.ads
drop constraint if exists ads_position_check;

alter table public.ads
add constraint ads_position_check
check (
  position in (
    'home',
    'jobs',
    'housing',
    'secondhand',
    'navigation',
    'services',
    'news'
  )
);
