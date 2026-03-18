import type { SupabaseClient } from "@supabase/supabase-js"
import type { PodcastData } from "@/lib/google/drive"

type ExportFlagColumn = "google_drive_file_created" | "notion_page_created"

type ExportError = { podcastId: string; title: string; error: string }

type ExportConfig = {
  flagColumn: ExportFlagColumn
  exportFn: (podcast: PodcastData) => Promise<unknown>
}

type ExportResult = {
  total: number
  success: number
  failed: number
  errors?: ExportError[]
}

/**
 * 視聴済みPodcastを取得し、エクスポート処理を実行する共通関数
 */
export async function processWatchedPodcasts(
  supabase: SupabaseClient,
  userId: string,
  config: ExportConfig
): Promise<ExportResult> {
  const { data: podcasts, error: podcastsError } = await supabase
    .from("podcasts")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "watched")
    .eq(config.flagColumn, false)
    .order("watched_at", { ascending: false })

  if (podcastsError) {
    throw podcastsError
  }

  if (!podcasts || podcasts.length === 0) {
    return { total: 0, success: 0, failed: 0 }
  }

  let successCount = 0
  let failedCount = 0
  const errors: ExportError[] = []

  for (const podcast of podcasts) {
    try {
      const podcastData: PodcastData = {
        title: podcast.title,
        url: podcast.url,
        description: podcast.description || "",
        platform: podcast.platform || "その他",
        show_name: podcast.show_name || undefined,
        tags: podcast.tags || undefined,
        speakers: podcast.speakers || undefined,
        summary: podcast.summary || undefined,
        thumbnail_url: podcast.thumbnail_url || undefined,
        watched_at: podcast.watched_at || undefined,
      }

      await config.exportFn(podcastData)

      const { error: updateError } = await supabase
        .from("podcasts")
        .update({ [config.flagColumn]: true, updated_at: new Date().toISOString() })
        .eq("id", podcast.id)

      if (updateError) {
        throw updateError
      }

      successCount++
    } catch (error) {
      console.error(`Podcast ${podcast.id} のエクスポートに失敗:`, error)
      failedCount++
      errors.push({
        podcastId: podcast.id,
        title: podcast.title,
        error: error instanceof Error ? error.message : "不明なエラー",
      })
    }
  }

  return {
    total: podcasts.length,
    success: successCount,
    failed: failedCount,
    errors: errors.length > 0 ? errors : undefined,
  }
}
