import { type NextRequest, NextResponse } from "next/server"
import { decrypt } from "@/lib/crypto"
import { createMarkdownFile, type PodcastData } from "@/lib/google/drive"
import { refreshAccessToken, TokenRefreshError } from "@/lib/google/oauth"
import { createClient } from "@/lib/supabase/server"

export async function POST(_request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
  }

  // Google Drive設定を取得
  const { data: settings, error: settingsError } = await supabase
    .from("google_drive_settings")
    .select("*")
    .eq("user_id", user.id)
    .single()

  if (settingsError || !settings) {
    return NextResponse.json({ error: "Google Drive連携が設定されていません" }, { status: 400 })
  }

  if (!settings.folder_id) {
    return NextResponse.json({ error: "保存先フォルダが設定されていません" }, { status: 400 })
  }

  try {
    // 暗号化されたリフレッシュトークンを復号化
    const refreshToken = decrypt(settings.encrypted_refresh_token)

    // アクセストークンを取得（全ファイルで使い回す）
    const tokens = await refreshAccessToken(refreshToken)
    const accessToken = tokens.access_token

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

        await createMarkdownFile(accessToken, settings.folder_id, podcastData)

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
    console.error("エクスポートエラー:", error)

    // TokenRefreshErrorでinvalid_grantの場合は再認証が必要
    if (error instanceof TokenRefreshError && error.isInvalidGrant) {
      return NextResponse.json(
        { error: "Google Driveの再認証が必要です", code: "REAUTH_REQUIRED" },
        { status: 401 }
      )
    }

    return NextResponse.json(
      {
        error: "エクスポートに失敗しました",
        details: error instanceof Error ? error.message : "不明なエラー",
      },
      { status: 500 }
    )
  }
}
