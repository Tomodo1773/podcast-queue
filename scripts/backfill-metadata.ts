#!/usr/bin/env tsx

/**
 * 過去分のポッドキャストにメタデータ（タグ・出演者・サマリ）を一括付与するスクリプト
 *
 * 使い方:
 *   1. 環境変数を設定:
 *      - NEXT_PUBLIC_SUPABASE_URL
 *      - SUPABASE_SERVICE_ROLE_KEY（RLSバイパス用）
 *      - GOOGLE_GENERATIVE_AI_API_KEY（Gemini API用）
 *      - YOUTUBE_API_KEY（YouTube要約用）
 *   2. 実行: npx tsx scripts/backfill-metadata.ts
 *
 * 対象:
 *   - tags IS NULL または tags = '{}' のポッドキャスト
 *   - 処理済みのものはスキップ（冪等性）
 */

import { createClient } from "@supabase/supabase-js"
import { updatePodcastMetadata } from "../lib/gemini/update-podcast-metadata"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ 環境変数が不足しています:")
  console.error("  - NEXT_PUBLIC_SUPABASE_URL")
  console.error("  - SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  console.error("❌ GOOGLE_GENERATIVE_AI_API_KEY が設定されていません")
  process.exit(1)
}

async function main() {
  console.log("🚀 メタデータ一括付与スクリプト開始\n")

  // サービスロールキーでSupabaseクライアントを初期化（RLSバイパス）
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // 対象ポッドキャストを取得（tags IS NULL OR tags = '{}'）
  console.log("📋 対象ポッドキャストを取得中...")
  const { data: podcasts, error: fetchError } = await supabase
    .from("podcasts")
    .select("id, title, description, platform, url")
    .or("tags.is.null,tags.eq.{}")
    .order("created_at", { ascending: true })

  if (fetchError) {
    console.error("❌ ポッドキャスト取得エラー:", fetchError)
    process.exit(1)
  }

  if (!podcasts || podcasts.length === 0) {
    console.log("✅ 対象ポッドキャストなし（すべて処理済み）")
    process.exit(0)
  }

  console.log(`📊 対象件数: ${podcasts.length}件\n`)

  let successCount = 0
  let errorCount = 0
  const errors: Array<{ id: string; title: string; error: string }> = []

  for (const [index, podcast] of podcasts.entries()) {
    const progress = `[${index + 1}/${podcasts.length}]`
    console.log(`${progress} ${podcast.title || "(タイトルなし)"}`)
    console.log(`  ID: ${podcast.id}`)
    console.log(`  Platform: ${podcast.platform || "不明"}`)

    try {
      const { tags, speakers, summary } = await updatePodcastMetadata(
        supabase,
        podcast.id,
        podcast.title || "",
        podcast.description || "",
        podcast.platform || undefined,
        podcast.url || undefined
      )

      console.log(`  ✅ 完了 (タグ: ${tags.length}, 出演者: ${speakers.length}, 要約: ${summary ? "あり" : "なし"})`)
      successCount++
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`  ❌ エラー: ${errorMessage}`)
      errorCount++
      errors.push({
        id: podcast.id,
        title: podcast.title || "(タイトルなし)",
        error: errorMessage,
      })
    }

    console.log("") // 空行で区切る
  }

  // 結果サマリ
  console.log("=" .repeat(60))
  console.log("📊 処理結果サマリ")
  console.log("=" .repeat(60))
  console.log(`✅ 成功: ${successCount}件`)
  console.log(`❌ 失敗: ${errorCount}件`)
  console.log(`📋 合計: ${podcasts.length}件\n`)

  if (errors.length > 0) {
    console.log("🔴 失敗したポッドキャスト:")
    for (const err of errors) {
      console.log(`  - ${err.title} (ID: ${err.id})`)
      console.log(`    エラー: ${err.error}`)
    }
    console.log("")
  }

  console.log("🎉 スクリプト完了")
  process.exit(errorCount > 0 ? 1 : 0)
}

main().catch((error) => {
  console.error("❌ 予期しないエラー:", error)
  process.exit(1)
})
