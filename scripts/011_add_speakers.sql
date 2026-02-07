-- Add speakers column to podcasts table
ALTER TABLE public.podcasts ADD COLUMN IF NOT EXISTS speakers TEXT[] DEFAULT '{}';

-- Create GIN index for efficient array searching
CREATE INDEX IF NOT EXISTS podcasts_speakers_idx ON public.podcasts USING GIN (speakers);
