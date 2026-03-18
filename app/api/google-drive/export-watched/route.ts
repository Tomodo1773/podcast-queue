import { type NextRequest, NextResponse } from "next/server"
import { processWatchedPodcasts } from "@/lib/export/process-watched"
import { createMarkdownFile } from "@/lib/google/drive"
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

    const result = await processWatchedPodcasts(supabase, user.id, {
      flagColumn: "google_drive_file_created",
      exportFn: (podcast) => createMarkdownFile(accessToken, folderId, podcast),
    })

    return NextResponse.json({
      success: true,
      message:
        result.total === 0
          ? "すべての視聴済みPodcastはエクスポート済みです"
          : `エクスポートが完了しました（成功: ${result.success}件、失敗: ${result.failed}件）`,
      stats: { total: result.total, success: result.success, failed: result.failed, skipped: 0 },
      errors: result.errors,
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
