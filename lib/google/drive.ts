const GOOGLE_DRIVE_API_URL = "https://www.googleapis.com/upload/drive/v3/files"

export interface PodcastData {
  title: string
  url: string
  description: string
  platform: string
}

function generateMarkdownContent(podcast: PodcastData): string {
  return `# ${podcast.title}

## 概要
- **プラットフォーム**: ${podcast.platform}
- **URL**: ${podcast.url}

## 説明
${podcast.description || "（説明なし）"}

## 学び
（視聴後に記入）
`
}

function sanitizeFilename(title: string): string {
  // ファイル名に使えない文字を置換
  return title.replace(/[<>:"/\\|?*]/g, "_").slice(0, 100)
}

export async function createMarkdownFile(
  accessToken: string,
  folderId: string,
  podcast: PodcastData
): Promise<string> {
  const content = generateMarkdownContent(podcast)
  const filename = `${sanitizeFilename(podcast.title)}.md`

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

  const response = await fetch(`${GOOGLE_DRIVE_API_URL}?uploadType=multipart`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Google Driveファイル作成に失敗しました: ${error}`)
  }

  const result = await response.json()
  return result.id
}
