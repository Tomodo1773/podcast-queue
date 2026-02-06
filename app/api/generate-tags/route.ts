import { NextResponse } from "next/server"
import { generateTags } from "@/lib/gemini/generate-tags"
import { createClient } from "@/lib/supabase/server"

/**
 * ポッドキャストのタグを生成するAPIエンドポイント
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

    // タグ生成（Gemini API）
    const tags = await generateTags(title, description || "")

    // タグが生成された場合のみDBを更新
    if (tags.length > 0) {
      const { error: updateError } = await supabase.from("podcasts").update({ tags }).eq("id", podcastId)

      if (updateError) {
        console.error("Failed to update tags:", updateError)
        return NextResponse.json({ error: "Failed to update tags" }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, tags })
  } catch (error) {
    console.error("Error in generate-tags API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
