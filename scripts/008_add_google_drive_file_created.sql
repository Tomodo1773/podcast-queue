ALTER TABLE public.podcasts
ADD COLUMN IF NOT EXISTS google_drive_file_created BOOLEAN DEFAULT FALSE;
