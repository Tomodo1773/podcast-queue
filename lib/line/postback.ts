/**
 * レコメンド通知のpostback data
 * 生成（flex-message.ts）と解釈（handle-dislike.ts）が別ファイルなので、形式をここに集約する
 */

const DISLIKE_ACTION = "dislike"

/** LINEのpostback dataは300文字までなので、動画IDだけを載せる */
export function buildDislikePostbackData(videoId: string): string {
  return new URLSearchParams({ action: DISLIKE_ACTION, videoId }).toString()
}

/** dislike以外のactionや動画IDを含まないdataはnullを返す */
export function parseDislikePostbackData(data: string): { videoId: string } | null {
  const params = new URLSearchParams(data)
  if (params.get("action") !== DISLIKE_ACTION) return null

  const videoId = params.get("videoId")
  return videoId ? { videoId } : null
}
