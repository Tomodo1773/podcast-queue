-- Podcastを管理するテーブルを作成
create table if not exists public.podcasts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  url text not null,
  title text,
  description text,
  thumbnail_url text,
  platform text, -- YouTube, Spotify, NewsPicks, Pivot等
  is_watched boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 行レベルセキュリティを有効化
alter table public.podcasts enable row level security;

-- ユーザーは自分のPodcastのみ閲覧可能
create policy "podcasts_select_own"
  on public.podcasts for select
  using (auth.uid() = user_id);

-- ユーザーは自分のPodcastのみ追加可能
create policy "podcasts_insert_own"
  on public.podcasts for insert
  with check (auth.uid() = user_id);

-- ユーザーは自分のPodcastのみ更新可能
create policy "podcasts_update_own"
  on public.podcasts for update
  using (auth.uid() = user_id);

-- ユーザーは自分のPodcastのみ削除可能
create policy "podcasts_delete_own"
  on public.podcasts for delete
  using (auth.uid() = user_id);

-- インデックスを作成してパフォーマンスを向上
create index if not exists podcasts_user_id_idx on public.podcasts(user_id);
create index if not exists podcasts_is_watched_idx on public.podcasts(is_watched);
create index if not exists podcasts_created_at_idx on public.podcasts(created_at desc);
