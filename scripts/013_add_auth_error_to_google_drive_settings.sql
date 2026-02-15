-- google_drive_settingsテーブルにauth_errorフィールドを追加
-- 認証エラー状態を永続的に管理するため
ALTER TABLE public.google_drive_settings
ADD COLUMN IF NOT EXISTS auth_error BOOLEAN DEFAULT FALSE NOT NULL;

-- 既存のレコードはすべてauth_error = FALSEに設定
UPDATE public.google_drive_settings
SET auth_error = FALSE
WHERE auth_error IS NULL;
