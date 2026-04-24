-- Migration: add dual link type fields to ads table
-- Run this in Supabase SQL editor after create_ads.sql

alter table public.ads
  add column if not exists link_type  text not null default 'external'
    check (link_type in ('external', 'internal')),
  add column if not exists external_url text null,
  add column if not exists slug        text null,
  add column if not exists content     text null;

-- Unique index on slug for internal ads (allow multiple nulls)
create unique index if not exists idx_ads_slug
  on public.ads (slug)
  where slug is not null;
