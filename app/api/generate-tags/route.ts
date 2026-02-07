import { NextResponse } from "next/server"
import { updatePodcastMetadata } from "@/lib/gemini/update-podcast-metadata"
import { createClient } from "@/lib/supabase/server"

/**
 * ポッドキャストのタグと出演者名を生成するAPIエンドポイント
 * Web UIからバックグラウンドで非同期に呼び出される
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

    const { podcastId, title, description, platform, url } = await request.json()

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

    const { tags, speakers, geminiSummary } = await updatePodcastMetadata(
      supabase,
      podcastId,
      title,
      description || "",
      platform,
      url
    )

    return NextResponse.json({ success: true, tags, speakers, geminiSummary })
  } catch (error) {
    console.error("Error in generate-metadata API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
