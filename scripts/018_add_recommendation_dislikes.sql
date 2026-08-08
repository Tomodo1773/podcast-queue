-- レコメンドの「興味なし」フィードバック
-- 通知履歴は保存せず、ユーザーが明示的に「興味なし」と押した負例だけを保持する

create table if not exists public.recommendation_dislikes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  video_id text not null, -- YouTubeの動画ID
  title text, -- 確認・デバッグ用
  embedding vector(768) not null, -- embedding生成に成功したときだけ行を作るためnot null
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, video_id) -- ボタン連打・webhook再送での重複を防ぐ
);

-- 行レベルセキュリティを有効化
-- webhook/cronはservice roleでRLSをバイパスするが、有効化を忘れるとanonキーで全行読めてしまう
alter table public.recommendation_dislikes enable row level security;

create policy "recommendation_dislikes_select_own"
  on public.recommendation_dislikes for select
  using (auth.uid() = user_id);

create policy "recommendation_dislikes_insert_own"
  on public.recommendation_dislikes for insert
  with check (auth.uid() = user_id);

create policy "recommendation_dislikes_update_own"
  on public.recommendation_dislikes for update
  using (auth.uid() = user_id);

create policy "recommendation_dislikes_delete_own"
  on public.recommendation_dislikes for delete
  using (auth.uid() = user_id);

create index if not exists recommendation_dislikes_user_id_idx on public.recommendation_dislikes(user_id);

-- 負例のembedding平均を返す関数（get_profile_embeddingと対称）
-- security invoker のため、認証ユーザーが呼んでもRLSにより自分の行のみ集計される
create or replace function public.get_dislike_embedding(p_user_id uuid)
returns vector(768)
language sql
stable
as $$
  select avg(embedding)::vector(768)
  from public.recommendation_dislikes
  where user_id = p_user_id
$$;
