const GOOGLE_DRIVE_API_URL = "https://www.googleapis.com/upload/drive/v3/files"

export interface PodcastData {
  title: string
  url: string
  description: string
  platform: string
  show_name?: string
  tags?: string[]
  speakers?: string[]
  summary?: string
}

export function generateMarkdownContent(podcast: PodcastData): string {
  // 日本時間(JST)で日付を取得
  const jstDate = new Date()
    .toLocaleDateString("ja-JP", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\//g, "-")

  const frontmatterLines = [
    "---",
    `title: ${podcast.title}`,
    `platform: ${podcast.platform}`,
    `source: ${podcast.url}`,
    `date: ${jstDate}`,
  ]

  if (podcast.show_name) {
    frontmatterLines.push(`show_name: ${podcast.show_name}`)
  }

  if (podcast.tags && podcast.tags.length > 0) {
    frontmatterLines.push(`tags: [${podcast.tags.join(", ")}]`)
  }

  if (podcast.speakers && podcast.speakers.length > 0) {
    frontmatterLines.push(`speakers: [${podcast.speakers.join(", ")}]`)
  }

  frontmatterLines.push("---")

  let content = `${frontmatterLines.join("\n")}

## 説明
${podcast.description || "（説明なし）"}
`

  // YouTube動画の場合はGemini要約を追加
  if (podcast.platform === "youtube" && podcast.summary) {
    content += `
## 動画内容（Gemini生成）
${podcast.summary}
`
  }

  content += `
## 学び
（視聴後に記入）
`

  return content
}

function truncateToBytes(str: string, maxBytes: number): string {
  const encoder = new TextEncoder()
  const encoded = encoder.encode(str)
  if (encoded.length <= maxBytes) return str

  // バイト数制限でカット（マルチバイト文字の途中で切れないようにデコードで対応）
  const decoder = new TextDecoder("utf-8", { fatal: false })
  const truncated = decoder.decode(encoded.slice(0, maxBytes))
  // デコード時に不完全な文字がある場合、置換文字（U+FFFD）が末尾に含まれるので削除
  return truncated.replace(/\uFFFD+$/, "")
}

function sanitizeFilename(title: string): string {
  // ファイル名に使えない文字を置換
  const sanitized = title.replace(/[<>:"/\\|?*]/g, "_")
  // Android FS (ext4) の255バイト制限に対応
  // ファイル名構造: YYYYMMDD_[title].md (固定12バイト: 8 + 1 + 3)
  // → タイトル部分に使えるのは 225バイト（安全マージン込み）
  const maxBytes = 225
  return truncateToBytes(sanitized, maxBytes)
}

export async function createMarkdownFile(
  accessToken: string,
  folderId: string,
  podcast: PodcastData
): Promise<string> {
  const content = generateMarkdownContent(podcast)
  // 日本時間(JST)で日付プレフィックスを生成
  const jstDate = new Date().toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
  const datePrefix = jstDate.replace(/\//g, "")
  const filename = `${datePrefix}_${sanitizeFilename(podcast.title)}.md`

  // マルチパートリクエストでファイルを作成
  const metadata = {
    name: filename,
    parents: [folderId],
    mimeType: "text/markdown",
    description: podcast.url, // URLをメタデータとして保存
  }

  const boundary = "-------podcast_queue_boundary"
  const body = [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    JSON.stringify(metadata),
    `--${boundary}`,
    "Content-Type: text/markdown; charset=UTF-8",
    "",
    content,
    `--${boundary}--`,
  ].join("\r\n")

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000) // 30秒

  try {
    const response = await fetch(`${GOOGLE_DRIVE_API_URL}?uploadType=multipart`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Google Driveファイル作成に失敗しました: ${error}`)
    }

    const result = await response.json()
    return result.id
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Google Driveファイル作成リクエストがタイムアウトしました")
    }
    throw error
  }
}
