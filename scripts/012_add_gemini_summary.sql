-- Add summary column to podcasts table
ALTER TABLE public.podcasts ADD COLUMN IF NOT EXISTS summary TEXT DEFAULT NULL;
