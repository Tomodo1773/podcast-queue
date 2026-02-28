-- is_watched, is_watching の2カラムを status カラム1つに統合する
-- status: 'unwatched' | 'watching' | 'watched'

-- status カラムを追加
alter table public.podcasts
  add column if not exists status text not null default 'unwatched'
  check (status in ('unwatched', 'watching', 'watched'));

-- 既存データを移行
update public.podcasts
set status = case
  when is_watching = true then 'watching'
  when is_watched = true then 'watched'
  else 'unwatched'
end;

-- インデックスを追加
create index if not exists podcasts_status_idx on public.podcasts(status);

-- 旧カラムを削除
alter table public.podcasts drop column if exists is_watched;
alter table public.podcasts drop column if exists is_watching;
