import { type NextRequest, NextResponse } from "next/server"
import { exchangeCodeForTokens } from "@/lib/google/oauth"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ""

  if (error) {
    return NextResponse.redirect(
      new URL(`/settings?error=${encodeURIComponent("Google認証がキャンセルされました")}`, baseUrl)
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL(`/settings?error=${encodeURIComponent("認証パラメータが不正です")}`, baseUrl)
    )
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL("/auth/login", baseUrl))
  }

  // CSRFチェック: stateがユーザーIDと一致するか確認
  if (state !== user.id) {
    return NextResponse.redirect(
      new URL(`/settings?error=${encodeURIComponent("認証状態が不正です")}`, baseUrl)
    )
  }

  try {
    const tokens = await exchangeCodeForTokens(code)

    // トークンの有効期限を計算
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000)

    // 既存の設定があれば更新、なければ挿入
    const { error: upsertError } = await supabase.from("google_drive_settings").upsert(
      {
        user_id: user.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: expiresAt.toISOString(),
        folder_id: "", // フォルダIDは後から設定
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )

    if (upsertError) {
      console.error("Google Drive設定の保存に失敗:", upsertError)
      return NextResponse.redirect(
        new URL(`/settings?error=${encodeURIComponent("設定の保存に失敗しました")}`, baseUrl)
      )
    }

    return NextResponse.redirect(
      new URL(`/settings?success=${encodeURIComponent("Google Driveと連携しました")}`, baseUrl)
    )
  } catch (err) {
    console.error("Google OAuth処理でエラー:", err)
    return NextResponse.redirect(
      new URL(`/settings?error=${encodeURIComponent("認証処理に失敗しました")}`, baseUrl)
    )
  }
}
