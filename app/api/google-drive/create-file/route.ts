import { type NextRequest, NextResponse } from "next/server"
import { decrypt } from "@/lib/crypto"
import { createMarkdownFile, type PodcastData } from "@/lib/google/drive"
import { refreshAccessToken, TokenRefreshError } from "@/lib/google/oauth"
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

    // 暗号化されたリフレッシュトークンを復号化
    const refreshToken = decrypt(settings.encrypted_refresh_token)

    // 毎回リフレッシュトークンからアクセストークンを取得
    const tokens = await refreshAccessToken(refreshToken)
    const accessToken = tokens.access_token

    const fileId = await createMarkdownFile(accessToken, settings.folder_id, body)

    return NextResponse.json({ success: true, fileId })
  } catch (error) {
    console.error("Google Driveファイル作成エラー:", error)

    // TokenRefreshErrorでinvalid_grantの場合は再認証が必要
    if (error instanceof TokenRefreshError && error.isInvalidGrant) {
      // DBにauth_errorフラグを立てる
      await supabase.from("google_drive_settings").update({ auth_error: true }).eq("user_id", user.id)

      return NextResponse.json(
        { error: "Google Driveの再認証が必要です", code: "REAUTH_REQUIRED" },
        { status: 401 }
      )
    }

    return NextResponse.json({ error: "ファイル作成に失敗しました" }, { status: 500 })
  }
}
