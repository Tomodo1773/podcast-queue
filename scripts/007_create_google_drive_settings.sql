-- pgcrypto拡張機能を有効化（暗号化用）
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- テーブル作成（access_token, token_expires_at は保存しない）
CREATE TABLE IF NOT EXISTS public.google_drive_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  encrypted_refresh_token TEXT NOT NULL,
  folder_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- RLS有効化
ALTER TABLE public.google_drive_settings ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のデータのみアクセス可能
CREATE POLICY "Users can manage their own google drive settings"
  ON public.google_drive_settings
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 注: 暗号化・復号化はアプリケーション層で実施
-- encrypted_refresh_tokenは既にpgcryptoで暗号化された状態で保存される
