-- Ads table for OpenAA Marketplace
-- Run this in your Supabase SQL Editor (or add to supabase/migrations)

-- Create ads table
CREATE TABLE IF NOT EXISTS public.ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  link_url TEXT NOT NULL,
  position TEXT NOT NULL CHECK (position IN ('home', 'jobs', 'secondhand')),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient active-ad queries
CREATE INDEX IF NOT EXISTS idx_ads_position_active_dates
  ON public.ads (position, is_active, start_date, end_date, created_at);

-- Enable Row Level Security
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

-- Anyone can read active ads (API route handles date filtering)
CREATE POLICY "Anyone can view ads" ON public.ads
  FOR SELECT USING (true);

-- Only service role / admin can insert/update/delete (admin API routes use service key)
-- Public anon key cannot write to this table

-- Storage bucket for ad images
INSERT INTO storage.buckets (id, name, public)
VALUES ('ads', 'ads', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for ads bucket
CREATE POLICY "Anyone can view ad images" ON storage.objects
  FOR SELECT USING (bucket_id = 'ads');

CREATE POLICY "Service role can upload ad images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'ads');

CREATE POLICY "Service role can delete ad images" ON storage.objects
  FOR DELETE USING (bucket_id = 'ads');
