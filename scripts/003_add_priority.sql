-- Podcastに優先順位（priority）カラムを追加
-- 値: 'high', 'medium', 'low'
-- デフォルト: 'medium'

alter table public.podcasts
add column if not exists priority text default 'medium' check (priority in ('high', 'medium', 'low'));

-- 優先順位でのフィルタリング・並び替え用インデックス
create index if not exists podcasts_priority_idx on public.podcasts(priority);
