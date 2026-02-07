-- Add speakers column to podcasts table
ALTER TABLE podcasts ADD COLUMN speakers TEXT[] DEFAULT '{}';

-- Create GIN index for efficient array searching
CREATE INDEX podcasts_speakers_idx ON podcasts USING GIN (speakers);
