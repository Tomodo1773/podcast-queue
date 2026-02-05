-- ポッドキャストにメモカラムを追加
ALTER TABLE public.podcasts
ADD COLUMN notes text;

-- メモ全文検索用のインデックス（将来的に使用予定）
-- CREATE INDEX IF NOT EXISTS podcasts_notes_idx ON public.podcasts USING gin(to_tsvector('japanese', notes));
