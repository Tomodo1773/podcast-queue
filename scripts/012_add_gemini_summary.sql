-- Add gemini_summary column to podcasts table
ALTER TABLE public.podcasts ADD COLUMN IF NOT EXISTS gemini_summary TEXT DEFAULT NULL;
