import { type NextRequest, NextResponse } from "next/server"
import { createMarkdownFile, type PodcastData } from "@/lib/google/drive"
import { DriveAuthError, getDriveAuth } from "@/lib/google/drive-auth"
import { createClient } from "@/lib/supabase/server"

export async function POST(_request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
  }

  try {
    const { accessToken, folderId } = await getDriveAuth(supabase, user.id)

    // 視聴済みかつファイル未作成のPodcastを取得
    const { data: podcasts, error: podcastsError } = await supabase
      .from("podcasts")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_watched", true)
      .eq("google_drive_file_created", false)
      .order("watched_at", { ascending: false })

    if (podcastsError) {
      throw podcastsError
    }

    if (!podcasts || podcasts.length === 0) {
      return NextResponse.json({
        success: true,
        message: "すべての視聴済みPodcastはエクスポート済みです",
        stats: { total: 0, success: 0, failed: 0, skipped: 0 },
      })
    }

    // 各Podcastのファイルを作成
    let successCount = 0
    let failedCount = 0
    const errors: Array<{ podcastId: string; title: string; error: string }> = []

    for (const podcast of podcasts) {
      try {
        const podcastData: PodcastData = {
          title: podcast.title,
          url: podcast.url,
          description: podcast.description || "",
          platform: podcast.platform,
          show_name: podcast.show_name || undefined,
          tags: podcast.tags || undefined,
          speakers: podcast.speakers || undefined,
          summary: podcast.summary || undefined,
          thumbnail_url: podcast.thumbnail_url || undefined,
        }

        await createMarkdownFile(accessToken, folderId, podcastData)

        // ファイル作成成功フラグを更新
        const { error: updateError } = await supabase
          .from("podcasts")
          .update({ google_drive_file_created: true, updated_at: new Date().toISOString() })
          .eq("id", podcast.id)

        if (updateError) {
          throw updateError
        }

        successCount++
      } catch (error) {
        console.error(`Podcast ${podcast.id} のファイル作成に失敗:`, error)
        failedCount++
        errors.push({
          podcastId: podcast.id,
          title: podcast.title,
          error: error instanceof Error ? error.message : "不明なエラー",
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `エクスポートが完了しました（成功: ${successCount}件、失敗: ${failedCount}件）`,
      stats: {
        total: podcasts.length,
        success: successCount,
        failed: failedCount,
        skipped: 0,
      },
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    if (error instanceof DriveAuthError) {
      return NextResponse.json(
        { error: error.message, ...(error.code && { code: error.code }) },
        { status: error.statusCode }
      )
    }

    console.error("エクスポートエラー:", error)
    return NextResponse.json(
      {
        error: "エクスポートに失敗しました",
        details: error instanceof Error ? error.message : "不明なエラー",
      },
      { status: 500 }
    )
  }
}
