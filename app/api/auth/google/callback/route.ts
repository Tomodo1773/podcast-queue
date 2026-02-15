import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { encrypt } from "@/lib/crypto"
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

  // CSRFチェック: クッキーのトークンとstateパラメータを比較
  const cookieStore = await cookies()
  const storedState = cookieStore.get("oauth_state")?.value

  if (!storedState || state !== storedState) {
    // 検証失敗時はクッキーを削除
    cookieStore.delete("oauth_state")
    return NextResponse.redirect(
      new URL(`/settings?error=${encodeURIComponent("認証状態が不正です")}`, baseUrl)
    )
  }

  // 検証成功後、クッキーを削除（ワンタイム使用）
  cookieStore.delete("oauth_state")

  try {
    const tokens = await exchangeCodeForTokens(code)

    // リフレッシュトークンを暗号化
    const encryptedRefreshToken = encrypt(tokens.refresh_token)

    // 既存の設定があれば更新、なければ挿入
    const { error: upsertError } = await supabase.from("google_drive_settings").upsert(
      {
        user_id: user.id,
        encrypted_refresh_token: encryptedRefreshToken,
        folder_id: null,
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
