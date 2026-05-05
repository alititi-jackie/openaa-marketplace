-- site_settings table
-- Run this in your Supabase SQL Editor to enable the daily post limit feature.

CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed the default daily post limit (can be changed via /admin/settings)
INSERT INTO public.site_settings (key, value)
VALUES ('daily_post_limit', '5')
ON CONFLICT (key) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- No client-side reads needed: the service role API route handles all reads.
-- Admin writes go through the service role API as well.
-- If you want to allow direct client reads, add:
-- CREATE POLICY "Anyone can read site settings" ON public.site_settings
--   FOR SELECT USING (true);
