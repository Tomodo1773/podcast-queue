-- watched_atカラムを追加
alter table public.podcasts add column if not exists watched_at timestamp with time zone;

-- インデックスを作成
create index if not exists podcasts_watched_at_idx on public.podcasts(watched_at desc);

-- 既存のis_watched=trueのレコードにwatched_atを設定（updated_atを使用）
update public.podcasts
set watched_at = updated_at
where is_watched = true and watched_at is null;
