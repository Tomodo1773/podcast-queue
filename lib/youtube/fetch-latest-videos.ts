/**
 * YouTube Data API v3 でチャンネルの最新投稿を取得する
 * RSSフィードはサーバーからの自動取得が不安定なため、APIを使用（playlistItems.list = 1クォータ/回）
 */

// この秒数以下の動画はショートとみなして除外する（Data APIにショート判定用フィールドがないためdurationで判定）
const SHORTS_MAX_SECONDS = 60

export type YoutubeVideo = {
  videoId: string
  title: string
  description: string
  publishedAt: string
  thumbnailUrl: string
  url: string
}

type PlaylistItem = {
  snippet?: {
    title?: string
    description?: string
    publishedAt?: string
    resourceId?: { videoId?: string }
    thumbnails?: Record<string, { url?: string }>
  }
  contentDetails?: {
    videoId?: string
    videoPublishedAt?: string
  }
}

/**
 * ISO 8601 duration（例: "PT1M30S", "PT45S", "PT10M"）を秒数に変換する
 * パースできない場合はnullを返す
 */
export function parseDurationSeconds(duration: string): number | null {
  const match = duration.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/)
  if (!match) return null
  const [, h, m, s] = match
  return Number(h ?? 0) * 3600 + Number(m ?? 0) * 60 + Number(s ?? 0)
}

/**
 * 動画IDごとの秒数を videos.list（1クォータ/回、ID一括指定可）で取得する
 */
async function fetchDurations(videoIds: string[], apiKey: string): Promise<Map<string, number>> {
  const params = new URLSearchParams({
    part: "contentDetails",
    id: videoIds.join(","),
    key: apiKey,
  })

  const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?${params}`)
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`YouTube API error (${response.status}): ${errorText}`)
  }

  const data = (await response.json()) as {
    items?: Array<{ id?: string; contentDetails?: { duration?: string } }>
  }

  const durations = new Map<string, number>()
  for (const item of data.items ?? []) {
    const seconds = item.contentDetails?.duration && parseDurationSeconds(item.contentDetails.duration)
    if (item.id && typeof seconds === "number") {
      durations.set(item.id, seconds)
    }
  }
  return durations
}

/**
 * チャンネルの最新動画を取得する（公開日時の降順）
 * チャンネルID（UC...）をアップロードプレイリストID（UU...）に変換してplaylistItems.listを叩く
 */
export async function fetchLatestVideos(channelId: string, maxResults = 10): Promise<YoutubeVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY is not set")
  }

  const uploadsPlaylistId = `UU${channelId.slice(2)}`
  const params = new URLSearchParams({
    part: "snippet,contentDetails",
    playlistId: uploadsPlaylistId,
    maxResults: String(maxResults),
    key: apiKey,
  })

  const response = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?${params}`)
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`YouTube API error (${response.status}): ${errorText}`)
  }

  const data = (await response.json()) as { items?: PlaylistItem[] }

  const videos = (data.items ?? [])
    .map((item) => {
      const videoId = item.contentDetails?.videoId ?? item.snippet?.resourceId?.videoId ?? ""
      const thumbnails = item.snippet?.thumbnails
      return {
        videoId,
        title: item.snippet?.title ?? "",
        description: item.snippet?.description ?? "",
        publishedAt: item.contentDetails?.videoPublishedAt ?? item.snippet?.publishedAt ?? "",
        thumbnailUrl: thumbnails?.high?.url ?? thumbnails?.medium?.url ?? thumbnails?.default?.url ?? "",
        url: `https://www.youtube.com/watch?v=${videoId}`,
      }
    })
    .filter((video) => video.videoId && video.publishedAt)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))

  if (videos.length === 0) return videos

  // ショート動画を除外する（durationが取得できなかった動画は安全側に倒して残す）
  const durations = await fetchDurations(
    videos.map((video) => video.videoId),
    apiKey
  )
  return videos.filter((video) => {
    const seconds = durations.get(video.videoId)
    return seconds === undefined || seconds > SHORTS_MAX_SECONDS
  })
}
