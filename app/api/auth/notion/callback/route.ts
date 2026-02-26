import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { encrypt } from "@/lib/crypto"
import { exchangeCodeForTokens } from "@/lib/notion/oauth"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ""

  if (error) {
    return NextResponse.redirect(
      new URL(`/settings?error=${encodeURIComponent("Notion認証がキャンセルされました")}`, baseUrl)
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

  const cookieStore = await cookies()
  const storedState = cookieStore.get("oauth_state")?.value

  if (!storedState || state !== storedState) {
    cookieStore.delete("oauth_state")
    return NextResponse.redirect(
      new URL(`/settings?error=${encodeURIComponent("認証状態が不正です")}`, baseUrl)
    )
  }

  cookieStore.delete("oauth_state")

  try {
    const tokens = await exchangeCodeForTokens(code)
    const encryptedAccessToken = encrypt(tokens.access_token)

    // 既存の設定を取得してdatabase_idを保持
    const { data: existingSettings, error: existingSettingsError } = await supabase
      .from("notion_settings")
      .select("database_id")
      .eq("user_id", user.id)
      .single()

    if (existingSettingsError && existingSettingsError.code !== "PGRST116") {
      console.error("Notion既存設定の取得に失敗:", existingSettingsError)
      return NextResponse.redirect(
        new URL(`/settings?error=${encodeURIComponent("設定の取得に失敗しました")}`, baseUrl)
      )
    }

    const { error: upsertError } = await supabase.from("notion_settings").upsert(
      {
        user_id: user.id,
        encrypted_access_token: encryptedAccessToken,
        workspace_name: tokens.workspace_name,
        database_id: existingSettings?.database_id || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )

    if (upsertError) {
      console.error("Notion設定の保存に失敗:", upsertError)
      return NextResponse.redirect(
        new URL(`/settings?error=${encodeURIComponent("設定の保存に失敗しました")}`, baseUrl)
      )
    }

    return NextResponse.redirect(
      new URL(`/settings?notion_success=${encodeURIComponent("Notionと連携しました")}`, baseUrl)
    )
  } catch (err) {
    console.error("Notion OAuth処理でエラー:", err)
    return NextResponse.redirect(
      new URL(`/settings?error=${encodeURIComponent("認証処理に失敗しました")}`, baseUrl)
    )
  }
}
