import { NextResponse } from "next/server"
import { generateMetadata } from "@/lib/gemini/generate-metadata"
import { createClient } from "@/lib/supabase/server"

/**
 * ポッドキャストのタグと出演者名を生成するAPIエンドポイント
 * バックグラウンドで非同期に実行される想定
 */
export async function POST(request: Request) {
  try {
    // 認証チェック
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { podcastId, title, description } = await request.json()

    if (!podcastId || !title) {
      return NextResponse.json({ error: "podcastId and title are required" }, { status: 400 })
    }

    // ユーザーが対象のポッドキャストにアクセス権限を持っているか確認
    const { data: podcast, error: fetchError } = await supabase
      .from("podcasts")
      .select("id")
      .eq("id", podcastId)
      .eq("user_id", user.id)
      .single()

    if (fetchError || !podcast) {
      return NextResponse.json({ error: "Podcast not found or access denied" }, { status: 403 })
    }

    // タグと出演者名を生成（Gemini API）
    const { tags, speakers } = await generateMetadata(title, description || "")

    // タグまたは出演者名が生成された場合のみDBを更新
    const updateData: Record<string, unknown> = {}
    if (tags.length > 0) updateData.tags = tags
    if (speakers.length > 0) updateData.speakers = speakers

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase.from("podcasts").update(updateData).eq("id", podcastId)

      if (updateError) {
        console.error("Failed to update metadata:", updateError)
        return NextResponse.json({ error: "Failed to update metadata" }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, tags, speakers })
  } catch (error) {
    console.error("Error in generate-metadata API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
