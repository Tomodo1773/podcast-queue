#!/usr/bin/env tsx

/**
 * 過去分のポッドキャストにembeddingを一括付与するスクリプト
 *
 * 使い方:
 *   1. 環境変数を設定:
 *      - NEXT_PUBLIC_SUPABASE_URL
 *      - SUPABASE_SERVICE_ROLE_KEY（RLSバイパス用）
 *      - GEMINI_API_KEY（Gemini API用）
 *   2. 実行: npx tsx scripts/backfill-embeddings.ts
 *
 * 対象:
 *   - embedding IS NULL のポッドキャスト
 *   - 処理済みのものはスキップ（冪等性）
 */

import { createClient } from "@supabase/supabase-js"
import { buildEmbeddingInput, generateEmbeddings } from "../lib/gemini/generate-embedding"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ 環境変数が不足しています:")
  console.error("  - NEXT_PUBLIC_SUPABASE_URL")
  console.error("  - SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY が設定されていません")
  process.exit(1)
}

// 1回のembedding API呼び出しで処理する件数
const BATCH_SIZE = 50

async function main() {
  console.log("🚀 embedding一括付与スクリプト開始\n")

  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

  console.log("📋 対象ポッドキャストを取得中...")
  const { data: podcasts, error: fetchError } = await supabase
    .from("podcasts")
    .select("id, title, description")
    .is("embedding", null)
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

  for (let offset = 0; offset < podcasts.length; offset += BATCH_SIZE) {
    const batch = podcasts.slice(offset, offset + BATCH_SIZE)
    console.log(`[${offset + 1}〜${offset + batch.length}/${podcasts.length}] embedding生成中...`)

    try {
      const embeddings = await generateEmbeddings(
        batch.map((podcast) => buildEmbeddingInput(podcast.title, podcast.description))
      )

      for (const [i, podcast] of batch.entries()) {
        const { error: updateError } = await supabase
          .from("podcasts")
          .update({ embedding: embeddings[i] })
          .eq("id", podcast.id)

        if (updateError) {
          console.error(`  ❌ 更新エラー: ${podcast.title || "(タイトルなし)"} (${podcast.id})`, updateError)
          errorCount++
        } else {
          successCount++
        }
      }
    } catch (error) {
      console.error("  ❌ embedding生成エラー:", error instanceof Error ? error.message : error)
      errorCount += batch.length
    }
  }

  console.log("\n" + "=".repeat(60))
  console.log("📊 処理結果サマリ")
  console.log("=".repeat(60))
  console.log(`✅ 成功: ${successCount}件`)
  console.log(`❌ 失敗: ${errorCount}件`)
  console.log(`📋 合計: ${podcasts.length}件\n`)

  console.log("🎉 スクリプト完了")
  process.exit(errorCount > 0 ? 1 : 0)
}

main().catch((error) => {
  console.error("❌ 予期しないエラー:", error)
  process.exit(1)
})
