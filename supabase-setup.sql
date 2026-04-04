-- ============================================
-- Supabase SQL Setup for Trading Journal
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================

-- 1. Create trades table
CREATE TABLE IF NOT EXISTS trades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_id TEXT UNIQUE NOT NULL,
  pair TEXT NOT NULL,
  direction TEXT NOT NULL,
  trade_type TEXT DEFAULT '',
  target_ratio TEXT DEFAULT '',
  closed_ratio TEXT DEFAULT '',
  risk_amount TEXT DEFAULT '',
  outcome TEXT DEFAULT '',
  profit TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  analysis JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create scenarios table
CREATE TABLE IF NOT EXISTS scenarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scenario_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  notes JSONB DEFAULT '[]',
  images JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable Row Level Security (public access for now — add auth later)
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anon users (tighten this with auth later)
CREATE POLICY "Allow all on trades" ON trades FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on scenarios" ON scenarios FOR ALL USING (true) WITH CHECK (true);

-- 4. Create storage bucket for screenshots
-- Note: Create this in Supabase Dashboard > Storage > New Bucket
-- Bucket name: "screenshots"
-- Make it PUBLIC so images can be viewed without auth

-- 5. Storage policy (run in SQL editor):
-- Allow anyone to upload/read/delete from screenshots bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('screenshots', 'screenshots', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow public uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'screenshots');

CREATE POLICY "Allow public reads" ON storage.objects
  FOR SELECT USING (bucket_id = 'screenshots');

CREATE POLICY "Allow public deletes" ON storage.objects
  FOR DELETE USING (bucket_id = 'screenshots');
