import { type NextRequest, NextResponse } from "next/server"
import { createNotionDatabase } from "@/lib/notion/notion"
import { NotionAuthError } from "@/lib/notion/notion-auth"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
  }

  try {
    const { parentPageId } = await request.json()

    if (!parentPageId) {
      return NextResponse.json({ error: "親ページIDが必要です" }, { status: 400 })
    }

    // データベースIDのチェックをスキップして直接アクセストークンを取得
    const { data: settings, error: settingsError } = await supabase
      .from("notion_settings")
      .select("encrypted_access_token")
      .eq("user_id", user.id)
      .single()

    if (settingsError || !settings) {
      throw new NotionAuthError("Notion連携が設定されていません", 400)
    }

    const { decrypt } = await import("@/lib/crypto")
    const accessToken = decrypt(settings.encrypted_access_token)

    const databaseId = await createNotionDatabase(accessToken, parentPageId)

    // database_idを保存
    const { error: updateError } = await supabase
      .from("notion_settings")
      .update({ database_id: databaseId, updated_at: new Date().toISOString() })
      .eq("user_id", user.id)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ success: true, databaseId })
  } catch (error) {
    if (error instanceof NotionAuthError) {
      return NextResponse.json(
        { error: error.message, ...(error.code && { code: error.code }) },
        { status: error.statusCode }
      )
    }

    console.error("Notionデータベース作成エラー:", error)
    return NextResponse.json({ error: "データベース作成に失敗しました" }, { status: 500 })
  }
}
