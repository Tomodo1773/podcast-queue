-- LINE連携用のテーブルを作成
CREATE TABLE IF NOT EXISTS public.line_user_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  line_user_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id)  -- 1ユーザー1LINE連携
);

-- 行レベルセキュリティを有効化
ALTER TABLE public.line_user_links ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のデータのみ閲覧可能
CREATE POLICY "line_user_links_select_own"
  ON public.line_user_links FOR SELECT
  USING (auth.uid() = user_id);

-- ユーザーは自分のデータのみ追加可能
CREATE POLICY "line_user_links_insert_own"
  ON public.line_user_links FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分のデータのみ更新可能
CREATE POLICY "line_user_links_update_own"
  ON public.line_user_links FOR UPDATE
  USING (auth.uid() = user_id);

-- ユーザーは自分のデータのみ削除可能
CREATE POLICY "line_user_links_delete_own"
  ON public.line_user_links FOR DELETE
  USING (auth.uid() = user_id);

-- インデックスを作成
CREATE INDEX IF NOT EXISTS line_user_links_user_id_idx ON public.line_user_links(user_id);
CREATE INDEX IF NOT EXISTS line_user_links_line_user_id_idx ON public.line_user_links(line_user_id);
