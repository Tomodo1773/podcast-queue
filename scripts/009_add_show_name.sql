-- 番組名・チャンネル名を保存するカラムを追加
-- YouTube: チャンネル名（例: "テレ東BIZ"）
-- Spotify: 番組名（例: "Pivot"）
-- その他: NULL（未登録）

ALTER TABLE public.podcasts
ADD COLUMN IF NOT EXISTS show_name TEXT;

-- コメントを追加
COMMENT ON COLUMN public.podcasts.show_name IS '番組名またはチャンネル名（YouTubeはチャンネル名、Spotifyは番組名）';
