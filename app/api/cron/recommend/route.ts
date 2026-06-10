import { cosineSimilarity } from "ai"
import { NextResponse } from "next/server"
import { buildEmbeddingInput, generateEmbeddings } from "@/lib/gemini/generate-embedding"
import { buildRecommendationFlexMessage } from "@/lib/line/flex-message"
import { pushMessage } from "@/lib/line/push"
import { latestPublishedAt, pickRecommendations, selectNewVideos } from "@/lib/recommendation/select"
import { createAdminClient } from "@/lib/supabase/admin"
import { fetchLatestVideos, type YoutubeVideo } from "@/lib/youtube/fetch-latest-videos"

// 1回の通知で送る最大件数（LINE pushは1リクエスト5メッセージまで）
const MAX_RECOMMENDATIONS = 3

type Channel = {
  id: string
  user_id: string
  channel_id: string
  label: string | null
  last_published_at: string | null
}

type Candidate = YoutubeVideo & { channelLabel: string }

/**
 * 登録チャンネルの新着動画を興味プロファイルとの類似度でスコアリングし、
 * 閾値を超えたものをLINEでレコメンド通知する（Vercel Cronから日次実行）
 */
export async function GET(request: Request) {
  // Vercel Cronからの呼び出しを検証
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const threshold = Number(process.env.RECOMMEND_SCORE_THRESHOLD ?? "0.5")
  const supabase = createAdminClient()

  const { data: channels, error: channelsError } = await supabase.from("youtube_channels").select("*")
  if (channelsError) {
    console.error("[recommend] Failed to fetch channels:", channelsError)
    return NextResponse.json({ error: "Failed to fetch channels" }, { status: 500 })
  }

  // ユーザーごとにまとめて処理
  const channelsByUser = new Map<string, Channel[]>()
  for (const channel of (channels ?? []) as Channel[]) {
    const list = channelsByUser.get(channel.user_id) ?? []
    list.push(channel)
    channelsByUser.set(channel.user_id, list)
  }

  let notifiedCount = 0

  for (const [userId, userChannels] of channelsByUser) {
    try {
      notifiedCount += await processUser(supabase, userId, userChannels, threshold)
    } catch (error) {
      console.error(`[recommend] Failed to process user ${userId}:`, error)
    }
  }

  return NextResponse.json({ success: true, notified: notifiedCount })
}

async function processUser(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  channels: Channel[],
  threshold: number
): Promise<number> {
  // 興味プロファイル（登録済みポッドキャストのembedding平均）をDB側で計算
  const { data: profileData, error: profileError } = await supabase.rpc("get_profile_embedding", {
    p_user_id: userId,
  })
  if (profileError) throw profileError
  if (!profileData) {
    console.log(`[recommend] No profile embedding for user ${userId}, skipping`)
    return 0
  }
  const profile = JSON.parse(profileData as string) as number[]

  // 通知先のLINEユーザーIDを取得
  const { data: lineLink } = await supabase
    .from("line_user_links")
    .select("line_user_id")
    .eq("user_id", userId)
    .single()
  if (!lineLink) {
    console.log(`[recommend] No LINE link for user ${userId}, skipping`)
    return 0
  }

  // 各チャンネルの新着動画を収集
  const candidates: Candidate[] = []
  const channelUpdates: Array<{ id: string; last_published_at: string }> = []

  for (const channel of channels) {
    const videos = await fetchLatestVideos(channel.channel_id)
    if (videos.length === 0) continue

    const newest = latestPublishedAt(videos)

    // 初回は通知せず最新公開日時を記録するだけ（過去動画の一斉通知を防ぐ）
    if (channel.last_published_at) {
      const newVideos = selectNewVideos(videos, channel.last_published_at)
      const label = channel.label || channel.channel_id
      candidates.push(...newVideos.map((video) => ({ ...video, channelLabel: label })))
    }

    if (newest && newest !== channel.last_published_at) {
      channelUpdates.push({ id: channel.id, last_published_at: newest })
    }
  }

  let notified = 0

  if (candidates.length > 0) {
    // 新着動画をembedding化してプロファイルとの類似度を計算
    const embeddings = await generateEmbeddings(
      candidates.map((video) => buildEmbeddingInput(video.title, video.description))
    )
    const scored = candidates.map((video, i) => ({
      ...video,
      score: cosineSimilarity(profile, embeddings[i]),
    }))

    // 閾値チューニング用に全候補のスコアをログ出力
    for (const video of scored) {
      console.log(`[recommend] score=${video.score.toFixed(3)} ${video.title}`)
    }

    const picks = pickRecommendations(scored, threshold, MAX_RECOMMENDATIONS)
    if (picks.length > 0) {
      await pushMessage(
        lineLink.line_user_id,
        picks.map((video) =>
          buildRecommendationFlexMessage({
            title: video.title,
            channelLabel: video.channelLabel,
            score: video.score,
            videoUrl: video.url,
            thumbnailUrl: video.thumbnailUrl,
          })
        )
      )
      notified = picks.length
    }
  }

  // 処理済みの公開日時を更新（通知の成否に関わらず同じ動画を再判定しない）
  for (const update of channelUpdates) {
    const { error } = await supabase
      .from("youtube_channels")
      .update({ last_published_at: update.last_published_at })
      .eq("id", update.id)
    if (error) console.error(`[recommend] Failed to update channel ${update.id}:`, error)
  }

  return notified
}
