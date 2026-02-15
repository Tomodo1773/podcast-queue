import type { SupabaseClient } from "@supabase/supabase-js"
import { sanitizeForLog } from "@/lib/utils"
import { generateMetadata } from "./generate-metadata"
import { generateYoutubeSummary } from "./generate-youtube-summary"

/**
 * ポッドキャストのタグと出演者名を生成してDBに保存する共通関数
 * Web UI（/api/generate-tags経由）とLINE webhook両方から利用される
 */
export async function updatePodcastMetadata(
  supabase: SupabaseClient,
  podcastId: string,
  title: string,
  description: string,
  platform?: string,
  url?: string
): Promise<{ tags: string[]; speakers: string[]; summary: string | null }> {
  console.log("[updatePodcastMetadata] Starting for podcast:", podcastId)
  console.log("[updatePodcastMetadata] Title:", title)
  console.log("[updatePodcastMetadata] Platform:", sanitizeForLog(platform))

  // YouTube 要約生成を行うかどうかの判定（URL のホスト名が YouTube か検証）
  const shouldGenerateYoutubeSummary =
    platform === "youtube" &&
    (() => {
      if (!url) return false
      try {
        const parsedUrl = new URL(url)
        const hostname = parsedUrl.hostname.toLowerCase()
        const isYouTubeHost =
          hostname === "youtube.com" ||
          hostname === "www.youtube.com" ||
          hostname.endsWith(".youtube.com") ||
          hostname === "youtu.be"

        // /live/ URLはGemini APIで非対応のためスキップ
        if (isYouTubeHost && parsedUrl.pathname.startsWith("/live/")) {
          console.warn(
            "[updatePodcastMetadata] /live/ URL is not supported for YouTube summary, skipping:",
            sanitizeForLog(url)
          )
          return false
        }

        return isYouTubeHost
      } catch {
        console.warn(
          "[updatePodcastMetadata] Invalid URL for YouTube summary, skipping:",
          sanitizeForLog(url)
        )
        return false
      }
    })()

  // タグ・出演者生成とYouTube要約生成を並行実行
  const [metadataResult, youtubeSummary] = await Promise.all([
    generateMetadata(title, description),
    shouldGenerateYoutubeSummary && url ? generateYoutubeSummary(url) : Promise.resolve(null),
  ])

  const { tags, speakers } = metadataResult
  console.log("[updatePodcastMetadata] Generated tags:", tags.length)
  console.log("[updatePodcastMetadata] Generated speakers:", speakers.length)
  console.log("[updatePodcastMetadata] Generated YouTube summary:", youtubeSummary ? "yes" : "no")
  console.log("[updatePodcastMetadata] Podcast ID:", sanitizeForLog(podcastId))

  const updateData: Record<string, unknown> = {}
  if (tags.length > 0) updateData.tags = tags
  if (speakers.length > 0) updateData.speakers = speakers
  if (youtubeSummary) updateData.summary = youtubeSummary

  if (Object.keys(updateData).length > 0) {
    const { error: updateError } = await supabase.from("podcasts").update(updateData).eq("id", podcastId)

    if (updateError) {
      // podcastIdはユーザー入力のため、ログインジェクション対策として改行文字を除去
      console.error("[updatePodcastMetadata] Failed to update DB for podcast:", sanitizeForLog(podcastId))
      console.error("[updatePodcastMetadata] Error:", updateError)
      throw new Error("Failed to update metadata")
    }
    // podcastIdはユーザー入力のため、ログインジェクション対策として改行文字を除去
    console.log("[updatePodcastMetadata] DB updated successfully for podcast:", sanitizeForLog(podcastId))
  } else {
    // podcastIdはユーザー入力のため、ログインジェクション対策として改行文字を除去
    console.warn(
      "[updatePodcastMetadata] No tags, speakers, or summary generated for podcast, skipping DB update. Podcast ID:",
      sanitizeForLog(podcastId)
    )
  }

  return { tags, speakers, summary: youtubeSummary }
}
