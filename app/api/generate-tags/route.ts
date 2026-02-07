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

    const { podcastId } = await request.json()

    if (!podcastId) {
      return NextResponse.json({ error: "podcastId is required" }, { status: 400 })
    }

    // ユーザーが対象のポッドキャストにアクセス権限を持っているか確認し、必要なデータを取得
    const { data: podcast, error: fetchError } = await supabase
      .from("podcasts")
      .select("id, title, description, platform, url")
      .eq("id", podcastId)
      .eq("user_id", user.id)
      .single()

    if (fetchError || !podcast) {
      return NextResponse.json({ error: "Podcast not found or access denied" }, { status: 403 })
    }

    const { tags, speakers, geminiSummary } = await updatePodcastMetadata(
      supabase,
      podcastId,
      podcast.title || "",
      podcast.description || "",
      podcast.platform || undefined,
      podcast.url
    )

    return NextResponse.json({ success: true, tags, speakers, geminiSummary })
  } catch (error) {
    console.error("Error in generate-metadata API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
