-- 視聴中フラグを追加
ALTER TABLE public.podcasts ADD COLUMN is_watching BOOLEAN DEFAULT false;

-- インデックス追加（視聴中の検索を高速化）
CREATE INDEX IF NOT EXISTS podcasts_is_watching_idx ON public.podcasts(is_watching);
