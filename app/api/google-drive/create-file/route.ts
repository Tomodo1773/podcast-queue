import { type NextRequest, NextResponse } from "next/server"
import { createMarkdownFile, type PodcastData } from "@/lib/google/drive"
import { refreshAccessToken } from "@/lib/google/oauth"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
  }

  // Google Drive設定を取得
  const { data: settings, error: settingsError } = await supabase
    .from("google_drive_settings")
    .select("*")
    .eq("user_id", user.id)
    .single()

  if (settingsError || !settings) {
    return NextResponse.json({ error: "Google Drive連携が設定されていません" }, { status: 400 })
  }

  if (!settings.folder_id) {
    return NextResponse.json({ error: "保存先フォルダが設定されていません" }, { status: 400 })
  }

  try {
    const body: PodcastData = await request.json()

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
        .eq("user_id", user.id)
    }

    const fileId = await createMarkdownFile(accessToken, settings.folder_id, body)

    return NextResponse.json({ success: true, fileId })
  } catch (error) {
    console.error("Google Driveファイル作成エラー:", error)
    return NextResponse.json({ error: "ファイル作成に失敗しました" }, { status: 500 })
  }
}
