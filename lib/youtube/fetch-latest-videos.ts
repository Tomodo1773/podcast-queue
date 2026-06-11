/**
 * YouTube Data API v3 でチャンネルの最新投稿を取得する
 * RSSフィードはサーバーからの自動取得が不安定なため、APIを使用（playlistItems.list = 1クォータ/回）
 */

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

  return (data.items ?? [])
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
}
