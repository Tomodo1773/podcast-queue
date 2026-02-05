import type { SupabaseClient } from "@supabase/supabase-js"
import { createMarkdownFile, type PodcastData } from "./drive"
import { refreshAccessToken } from "./oauth"

/**
 * Podcast登録時にGoogle Driveにマークダウンファイルを作成する
 * 失敗しても例外を投げず、ログのみ出力する（Podcast登録は成功させる）
 */
export async function createPodcastFileInDrive(
  supabase: SupabaseClient,
  userId: string,
  podcast: PodcastData
): Promise<void> {
  try {
    // Google Drive設定を取得
    const { data: settings, error: settingsError } = await supabase
      .from("google_drive_settings")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (settingsError || !settings) {
      // 連携していない場合はスキップ（エラーではない）
      return
    }

    if (!settings.folder_id) {
      // フォルダIDが設定されていない場合はスキップ
      console.log("Google Drive folder_id not configured, skipping file creation")
      return
    }

    let accessToken = settings.access_token
    const tokenExpiresAt = new Date(settings.token_expires_at)

    // トークンが期限切れの場合は更新
    if (tokenExpiresAt < new Date()) {
      const newTokens = await refreshAccessToken(settings.refresh_token)
      accessToken = newTokens.access_token

      // 新しいトークンを保存
      await supabase
        .from("google_drive_settings")
        .update({
          access_token: newTokens.access_token,
          token_expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
    }

    const fileId = await createMarkdownFile(accessToken, settings.folder_id, podcast)
    console.log(`Google Drive file created: ${fileId}`)
  } catch (error) {
    // ファイル作成失敗時はログのみ出力（Podcast登録は成功させる）
    console.error("Failed to create Google Drive file:", error)
  }
}
