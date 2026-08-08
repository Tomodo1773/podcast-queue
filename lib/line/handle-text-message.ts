import { updatePodcastMetadata } from "@/lib/gemini/update-podcast-metadata"
import {
  buildErrorMessage,
  buildMetadataFailedMessage,
  buildSuccessFlexMessage,
} from "@/lib/line/flex-message"
import { showLoadingAnimation } from "@/lib/line/loading"
import { replyMessage } from "@/lib/line/reply"
import { resolveUserId } from "@/lib/line/resolve-user"
import { fetchMetadata } from "@/lib/metadata/fetcher"
import type { createAdminClient } from "@/lib/supabase/admin"
import { detectPlatform } from "@/lib/utils"

// リストページのURL生成
function getListUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!baseUrl) {
    console.error("NEXT_PUBLIC_APP_URL is not set")
    throw new Error("Application base URL is not configured")
  }
  return `${baseUrl}/podcasts`
}

/**
 * テキストメッセージに含まれるURLをポッドキャストとして登録する
 */
export async function handleTextMessage(
  supabase: ReturnType<typeof createAdminClient>,
  params: { lineUserId: string; text: string; replyToken?: string }
): Promise<void> {
  const { lineUserId, text, replyToken } = params

  // URLを抽出（複数URLがある場合は最初のもの）
  const urlMatch = text.match(/https?:\/\/[^\s]+/)
  if (!urlMatch) return

  // ローディングアニメーションを先に表示（処理中であることをユーザーに通知）
  await showLoadingAnimation(lineUserId, 10)

  const url = urlMatch[0]
  const listUrl = getListUrl()

  // LINE User IDからPodQueueユーザーを検索
  const userId = await resolveUserId(supabase, lineUserId)

  if (!userId) {
    // 未連携ユーザーにはエラーメッセージを返信
    console.log("Unlinked LINE user:", lineUserId)
    if (replyToken) {
      await replyMessage(replyToken, [
        buildErrorMessage(
          "PodQueueアカウントと連携されていません。PodQueueの設定画面からLINE連携を行ってください。"
        ),
      ])
    }
    return
  }

  // メタデータ取得（共通関数を直接呼び出し - HTTPリクエスト不要）
  let metadata = { title: "", description: "", image: "", showName: null as string | null }
  let metadataFailed = false
  try {
    metadata = await fetchMetadata(url)
  } catch (error) {
    console.error("Failed to fetch metadata:", error)
    metadataFailed = true
    // メタデータ取得失敗時は空のまま続行
  }

  // メタデータがすべて空の場合も失敗とみなす
  if (!metadata.title && !metadata.description && !metadata.image) {
    metadataFailed = true
  }

  // Podcast登録
  const { data: insertData, error: insertError } = await supabase
    .from("podcasts")
    .insert({
      user_id: userId,
      url,
      title: metadata.title || url,
      description: metadata.description || "",
      thumbnail_url: metadata.image || "",
      platform: detectPlatform(url),
      priority: "medium",
      status: "unwatched",
      show_name: metadata.showName || null,
    })
    .select()

  if (insertError) {
    console.error("Failed to insert podcast:", insertError)
    // 登録失敗時はエラーメッセージを返信
    if (replyToken) {
      await replyMessage(replyToken, [
        buildErrorMessage("登録に失敗しました。時間をおいて再度お試しください。"),
      ])
    }
    return
  }

  console.log("Podcast added for user:", userId)
  console.log("URL:", url)

  // タグ生成・出演者抽出・YouTube要約を同期的に実行（完了後にLINE返信する）
  if (insertData?.[0]) {
    try {
      console.log("Starting metadata generation for podcast:", insertData[0].id)
      const { tags, speakers, summary } = await updatePodcastMetadata(
        supabase,
        insertData[0].id,
        metadata.title || url,
        metadata.description || "",
        detectPlatform(url),
        url
      )
      console.log("Metadata generation completed for podcast:", insertData[0].id)
      console.log("Tags count:", tags.length)
      console.log("Speakers count:", speakers.length)
      console.log("YouTube summary:", summary ? "generated" : "not generated")
    } catch (error) {
      console.error("Failed to generate metadata for podcast:", insertData[0].id)
      console.error("Error:", error)
    }
  }

  // 登録成功時は成功メッセージを返信
  if (replyToken) {
    if (metadataFailed) {
      // メタデータ取得失敗時はテキストメッセージ
      await replyMessage(replyToken, [buildMetadataFailedMessage(url, listUrl)])
    } else {
      // 成功時はFlex Message
      await replyMessage(replyToken, [
        buildSuccessFlexMessage({
          thumbnailUrl: metadata.image,
          title: metadata.title,
          description: metadata.description,
          listUrl,
        }),
      ])
    }
  }
}
