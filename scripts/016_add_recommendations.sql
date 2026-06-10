-- レコメンド機能用: pgvector拡張・embedding列・YouTubeチャンネル登録テーブル

-- pgvector拡張を有効化
create extension if not exists vector;

-- ポッドキャストのembedding列（gemini-embedding-001 / 768次元）
alter table public.podcasts add column if not exists embedding vector(768);

-- ユーザーの興味プロファイル（登録済みポッドキャストのembedding平均）を返す関数
-- security invoker のため、認証ユーザーが呼んでもRLSにより自分の行のみ集計される
create or replace function public.get_profile_embedding(p_user_id uuid)
returns vector(768)
language sql
stable
as $$
  select avg(embedding)::vector(768)
  from public.podcasts
  where user_id = p_user_id
    and embedding is not null
$$;

-- レコメンド対象のYouTubeチャンネル登録テーブル
create table if not exists public.youtube_channels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  channel_id text not null, -- UCから始まるYouTubeチャンネルID
  label text, -- 表示用のチャンネル名（任意）
  last_published_at timestamp with time zone, -- 前回処理した最新動画の公開日時
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, channel_id)
);

-- 行レベルセキュリティを有効化
alter table public.youtube_channels enable row level security;

create policy "youtube_channels_select_own"
  on public.youtube_channels for select
  using (auth.uid() = user_id);

create policy "youtube_channels_insert_own"
  on public.youtube_channels for insert
  with check (auth.uid() = user_id);

create policy "youtube_channels_update_own"
  on public.youtube_channels for update
  using (auth.uid() = user_id);

create policy "youtube_channels_delete_own"
  on public.youtube_channels for delete
  using (auth.uid() = user_id);

create index if not exists youtube_channels_user_id_idx on public.youtube_channels(user_id);
