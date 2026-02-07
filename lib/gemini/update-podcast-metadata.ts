import type { SupabaseClient } from "@supabase/supabase-js"
import { generateMetadata } from "./generate-metadata"

/**
 * ポッドキャストのタグと出演者名を生成してDBに保存する共通関数
 * Web UI（/api/generate-tags経由）とLINE webhook両方から利用される
 */
export async function updatePodcastMetadata(
  supabase: SupabaseClient,
  podcastId: string,
  title: string,
  description: string
): Promise<{ tags: string[]; speakers: string[] }> {
  console.log("[updatePodcastMetadata] Starting for podcast:", podcastId)
  console.log("[updatePodcastMetadata] Title:", title)
  const { tags, speakers } = await generateMetadata(title, description)
  console.log("[updatePodcastMetadata] Generated tags:", tags.length)
  console.log("[updatePodcastMetadata] Generated speakers:", speakers.length)
  console.log("[updatePodcastMetadata] Podcast ID:", podcastId)

  const updateData: Record<string, unknown> = {}
  if (tags.length > 0) updateData.tags = tags
  if (speakers.length > 0) updateData.speakers = speakers

  if (Object.keys(updateData).length > 0) {
    const { error: updateError } = await supabase.from("podcasts").update(updateData).eq("id", podcastId)

    if (updateError) {
      console.error("[updatePodcastMetadata] Failed to update DB for podcast:", podcastId)
      console.error("[updatePodcastMetadata] Error:", updateError)
      throw new Error("Failed to update metadata")
    }
    console.log("[updatePodcastMetadata] DB updated successfully for podcast:", podcastId)
  } else {
    console.warn(
      "[updatePodcastMetadata] No tags or speakers generated for podcast, skipping DB update. Podcast ID:",
      podcastId
    )
  }

  return { tags, speakers }
}
