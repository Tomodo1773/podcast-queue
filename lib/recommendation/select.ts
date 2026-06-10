/**
 * レコメンド対象の選定ロジック（純粋関数）
 */

type Published = { publishedAt: string }

/**
 * 前回処理した公開日時より新しい動画のみを抽出する
 */
export function selectNewVideos<T extends Published>(videos: T[], lastPublishedAt: string | null): T[] {
  if (!lastPublishedAt) return []
  const threshold = new Date(lastPublishedAt).getTime()
  return videos.filter((video) => new Date(video.publishedAt).getTime() > threshold)
}

type Scored = { score: number }

/**
 * 閾値を超えた候補をスコア降順で最大maxCount件選ぶ
 */
export function pickRecommendations<T extends Scored>(
  candidates: T[],
  threshold: number,
  maxCount: number
): T[] {
  return candidates
    .filter((candidate) => candidate.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxCount)
}

/**
 * 動画リストの中で最も新しい公開日時を返す
 */
export function latestPublishedAt(videos: Published[]): string | null {
  if (videos.length === 0) return null
  return videos.reduce(
    (latest, video) => (video.publishedAt > latest ? video.publishedAt : latest),
    videos[0].publishedAt
  )
}
