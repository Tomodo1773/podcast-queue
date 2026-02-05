-- Google Drive連携用の設定テーブルを作成
CREATE TABLE IF NOT EXISTS public.google_drive_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  folder_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id)  -- 1ユーザー1Google連携
);

-- 行レベルセキュリティを有効化
ALTER TABLE public.google_drive_settings ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のデータのみ閲覧可能
CREATE POLICY "google_drive_settings_select_own"
  ON public.google_drive_settings FOR SELECT
  USING (auth.uid() = user_id);

-- ユーザーは自分のデータのみ追加可能
CREATE POLICY "google_drive_settings_insert_own"
  ON public.google_drive_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分のデータのみ更新可能
CREATE POLICY "google_drive_settings_update_own"
  ON public.google_drive_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- ユーザーは自分のデータのみ削除可能
CREATE POLICY "google_drive_settings_delete_own"
  ON public.google_drive_settings FOR DELETE
  USING (auth.uid() = user_id);

-- インデックスを作成
CREATE INDEX IF NOT EXISTS google_drive_settings_user_id_idx ON public.google_drive_settings(user_id);
