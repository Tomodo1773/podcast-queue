-- Add tags column to podcasts table
ALTER TABLE public.podcasts
ADD COLUMN tags TEXT[] DEFAULT '{}';

-- Create GIN index for tag search
CREATE INDEX podcasts_tags_idx ON public.podcasts USING GIN (tags);
