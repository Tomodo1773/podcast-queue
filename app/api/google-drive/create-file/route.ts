import { type NextRequest, NextResponse } from "next/server"
import { createMarkdownFile, type PodcastData } from "@/lib/google/drive"
import { DriveAuthError, getDriveAuth } from "@/lib/google/drive-auth"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
  }

  try {
    const body: PodcastData = await request.json()
    const { accessToken, folderId } = await getDriveAuth(supabase, user.id)
    const fileId = await createMarkdownFile(accessToken, folderId, body)

    return NextResponse.json({ success: true, fileId })
  } catch (error) {
    if (error instanceof DriveAuthError) {
      return NextResponse.json(
        { error: error.message, ...(error.code && { code: error.code }) },
        { status: error.statusCode }
      )
    }

    console.error("Google Driveファイル作成エラー:", error)
    return NextResponse.json({ error: "ファイル作成に失敗しました" }, { status: 500 })
  }
}
