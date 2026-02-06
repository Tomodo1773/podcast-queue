import { NextResponse } from "next/server"
import { generateTags } from "@/lib/gemini/generate-tags"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * ポッドキャストのタグを生成するAPIエンドポイント
 * バックグラウンドで非同期に実行される想定
 */
export async function POST(request: Request) {
  try {
    const { podcastId, title, description } = await request.json()

    if (!podcastId || !title) {
      return NextResponse.json({ error: "podcastId and title are required" }, { status: 400 })
    }

    // タグ生成（Gemini API）
    const tags = await generateTags(title, description || "")

    // タグが生成された場合のみDBを更新
    if (tags.length > 0) {
      const supabase = createAdminClient()
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
