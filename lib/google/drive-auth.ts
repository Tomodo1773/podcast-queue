import type { SupabaseClient } from "@supabase/supabase-js"
import { decrypt } from "@/lib/crypto"
import { refreshAccessToken, TokenRefreshError } from "@/lib/google/oauth"

export interface DriveAuthResult {
  accessToken: string
  folderId: string
}

/**
 * Google Drive用のアクセストークンとフォルダIDを取得する。
 * 設定取得→トークン復号化→アクセストークン取得を一括で行う。
 * invalid_grant時はDBのトークンをクリアしてTokenRefreshErrorをthrowする。
 */
export async function getDriveAuth(supabase: SupabaseClient, userId: string): Promise<DriveAuthResult> {
  const { data: settings, error: settingsError } = await supabase
    .from("google_drive_settings")
    .select("*")
    .eq("user_id", userId)
    .single()

  if (settingsError || !settings) {
    throw new DriveAuthError("Google Drive連携が設定されていません", 400)
  }

  if (!settings.folder_id) {
    throw new DriveAuthError("保存先フォルダが設定されていません", 400)
  }

  try {
    const refreshToken = decrypt(settings.encrypted_refresh_token)
    const tokens = await refreshAccessToken(refreshToken)
    return { accessToken: tokens.access_token, folderId: settings.folder_id }
  } catch (error) {
    if (error instanceof TokenRefreshError && error.isInvalidGrant) {
      await supabase
        .from("google_drive_settings")
        .update({ encrypted_refresh_token: "", updated_at: new Date().toISOString() })
        .eq("user_id", userId)

      throw new DriveAuthError("Google Driveの再認証が必要です", 401, "REAUTH_REQUIRED")
    }
    throw error
  }
}

export class DriveAuthError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code?: string
  ) {
    super(message)
    this.name = "DriveAuthError"
  }
}
