import { buildEmbeddingInput, generateEmbedding } from "@/lib/gemini/generate-embedding"
import { buildDislikeRegisteredMessage, buildErrorMessage } from "@/lib/line/flex-message"
import { showLoadingAnimation } from "@/lib/line/loading"
import { parseDislikePostbackData } from "@/lib/line/postback"
import { replyMessage } from "@/lib/line/reply"
import { resolveUserId } from "@/lib/line/resolve-user"
import type { createAdminClient } from "@/lib/supabase/admin"
import { sanitizeForLog } from "@/lib/utils"
import { fetchVideoById } from "@/lib/youtube/fetch-video-by-id"

/** replyTokenがない場合もあるため、返信は常にこのヘルパー経由で行う */
async function reply(replyToken: string | undefined, text: string): Promise<void> {
  if (!replyToken) return
  await replyMessage(replyToken, [buildErrorMessage(text)])
}

/**
 * レコメンド通知の「興味なし」を負例として保存する
 * embeddingは保持していないので、動画IDからメタデータを取り直して生成する
 */
export async function handleDislike(
  supabase: ReturnType<typeof createAdminClient>,
  params: { lineUserId: string; data: string; replyToken?: string }
): Promise<void> {
  const { lineUserId, data, replyToken } = params

  const parsed = parseDislikePostbackData(data)
  if (!parsed) {
    console.log("Unknown postback data:", sanitizeForLog(data))
    return
  }

  const userId = await resolveUserId(supabase, lineUserId)
  if (!userId) {
    console.log("Unlinked LINE user:", sanitizeForLog(lineUserId))
    await reply(replyToken, "PodQueueアカウントと連携されていません。")
    return
  }

  // 動画取得とembedding生成の前に重複を弾く（連打で外部APIを無駄に消費しないため）
  const { data: existing } = await supabase
    .from("recommendation_dislikes")
    .select("id")
    .eq("user_id", userId)
    .eq("video_id", parsed.videoId)
    .maybeSingle()

  if (existing) {
    await reply(replyToken, "この動画はすでに「興味なし」に登録されています。")
    return
  }

  // YouTube・Gemini呼び出しで1〜3秒かかるため、処理中であることを伝える
  await showLoadingAnimation(lineUserId, 5)

  try {
    const video = await fetchVideoById(parsed.videoId)
    if (!video) {
      await reply(replyToken, "動画情報を取得できませんでした。")
      return
    }

    // プロファイル側と同じ入力形式に揃える（揃えないと負例だけ別の場所に埋め込まれる）
    const embedding = await generateEmbedding(buildEmbeddingInput(video.title, video.description))
    if (!embedding) {
      // embeddingなしの行を作っても後から埋める仕組みがないので、行を作らず再試行を促す
      await reply(replyToken, "一時的に処理できませんでした。もう一度お試しください。")
      return
    }

    const { error } = await supabase.from("recommendation_dislikes").upsert(
      {
        user_id: userId,
        video_id: video.videoId,
        title: video.title,
        embedding,
      },
      { onConflict: "user_id,video_id" }
    )

    if (error) {
      console.error("Failed to save dislike:", error)
      await reply(replyToken, "登録に失敗しました。時間をおいて再度お試しください。")
      return
    }

    console.log("Dislike registered for user:", userId, "video:", sanitizeForLog(video.videoId))
    if (replyToken) {
      await replyMessage(replyToken, [buildDislikeRegisteredMessage(video.title)])
    }
  } catch (error) {
    // ここでthrowするとwebhookが500を返し、同じリクエストの他イベントが処理されなくなる
    console.error("Failed to handle dislike:", error)
    await reply(replyToken, "一時的に処理できませんでした。もう一度お試しください。")
  }
}
