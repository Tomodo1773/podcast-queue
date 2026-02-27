import { type NextRequest, NextResponse } from "next/server"
import type { PodcastData } from "@/lib/google/drive"
import { createNotionPage, ensureDatabaseProperties } from "@/lib/notion/notion"
import { getNotionAuth, NotionAuthError } from "@/lib/notion/notion-auth"
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
    const body: PodcastData = await request.json()
    const { accessToken, databaseId } = await getNotionAuth(supabase, user.id)
    await ensureDatabaseProperties(accessToken, databaseId)
    const pageId = await createNotionPage(accessToken, databaseId, body)

    return NextResponse.json({ success: true, pageId })
  } catch (error) {
    if (error instanceof NotionAuthError) {
      return NextResponse.json(
        { error: error.message, ...(error.code && { code: error.code }) },
        { status: error.statusCode }
      )
    }

    console.error("Notionページ作成エラー:", error)
    return NextResponse.json({ error: "ページ作成に失敗しました" }, { status: 500 })
  }
}
