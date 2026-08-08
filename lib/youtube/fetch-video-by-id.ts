/**
 * YouTube Data API v3 で動画IDから単一の動画情報を取得する
 */

import type { YoutubeVideo } from "./fetch-latest-videos"

type VideoItem = {
  snippet?: {
    title?: string
    description?: string
    publishedAt?: string
    thumbnails?: Record<string, { url?: string }>
  }
}

/**
 * 動画IDから動画情報を取得する（videos.list = 1クォータ/回）
 * 存在しない・非公開の動画はnullを返す
 */
export async function fetchVideoById(videoId: string): Promise<YoutubeVideo | null> {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY is not set")
  }

  const params = new URLSearchParams({ part: "snippet", id: videoId, key: apiKey })

  const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?${params}`)
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`YouTube API error (${response.status}): ${errorText}`)
  }

  const data = (await response.json()) as { items?: VideoItem[] }
  const snippet = data.items?.[0]?.snippet
  if (!snippet) return null

  const thumbnails = snippet.thumbnails
  return {
    videoId,
    title: snippet.title ?? "",
    description: snippet.description ?? "",
    publishedAt: snippet.publishedAt ?? "",
    thumbnailUrl: thumbnails?.high?.url ?? thumbnails?.medium?.url ?? thumbnails?.default?.url ?? "",
    url: `https://www.youtube.com/watch?v=${videoId}`,
  }
}
