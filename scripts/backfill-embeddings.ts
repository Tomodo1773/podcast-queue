#!/usr/bin/env tsx

/**
 * 過去分のポッドキャストにembeddingを一括付与するスクリプト
 *
 * 使い方:
 *   1. 環境変数を設定:
 *      - NEXT_PUBLIC_SUPABASE_URL
 *      - SUPABASE_SERVICE_ROLE_KEY（RLSバイパス用）
 *      - GEMINI_API_KEY（Gemini API用）
 *   2. 実行: pnpm exec tsx scripts/backfill-embeddings.ts
 *   3. 入力仕様の変更後に全件再生成する場合:
 *      pnpm exec tsx scripts/backfill-embeddings.ts --force
 *
 * 対象:
 *   - 通常時: embedding IS NULL のポッドキャスト
 *   - --force指定時: embeddingの有無に関わらず全ポッドキャスト
 */

import { createClient } from "@supabase/supabase-js"
import { buildEmbeddingInput, generateEmbeddings } from "../lib/gemini/generate-embedding"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const forceRegenerate = process.argv.includes("--force")

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

// Supabaseの最大返却件数に依存せず全件取得するためのページサイズ
const FETCH_PAGE_SIZE = 1000

async function main() {
  console.log(`🚀 embedding一括付与スクリプト開始${forceRegenerate ? "（全件再生成）" : ""}\n`)

  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

  console.log("📋 対象ポッドキャストを取得中...")
  const podcasts: Array<{ id: string; title: string | null; description: string | null }> = []

  for (let from = 0; ; from += FETCH_PAGE_SIZE) {
    let query = supabase.from("podcasts").select("id, title, description")
    if (!forceRegenerate) {
      query = query.is("embedding", null)
    }

    const { data: page, error: fetchError } = await query
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, from + FETCH_PAGE_SIZE - 1)

    if (fetchError) {
      console.error("❌ ポッドキャスト取得エラー:", fetchError)
      process.exit(1)
    }

    podcasts.push(...(page ?? []))
    if (!page || page.length < FETCH_PAGE_SIZE) break
  }

  if (podcasts.length === 0) {
    console.log("✅ 対象ポッドキャストなし（すべて処理済み）")
    process.exit(0)
  }

  console.log(`📊 対象件数: ${podcasts.length}件\n`)

  let successCount = 0
  let errorCount = 0
  let skippedCount = 0

  for (let offset = 0; offset < podcasts.length; offset += BATCH_SIZE) {
    const batch = podcasts.slice(offset, offset + BATCH_SIZE)
    console.log(`[${offset + 1}〜${offset + batch.length}/${podcasts.length}] embedding生成中...`)

    try {
      const targets = batch
        .map((podcast) => ({
          podcast,
          input: buildEmbeddingInput(podcast.title, podcast.description),
        }))
        .filter((target) => target.input)

      skippedCount += batch.length - targets.length
      if (targets.length === 0) continue

      const embeddings = await generateEmbeddings(targets.map((target) => target.input))

      for (const [i, target] of targets.entries()) {
        const { podcast } = target
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
  console.log(`⏭️ スキップ（タイトル・説明なし）: ${skippedCount}件`)
  console.log(`📋 合計: ${podcasts.length}件\n`)

  console.log("🎉 スクリプト完了")
  process.exit(errorCount > 0 ? 1 : 0)
}

main().catch((error) => {
  console.error("❌ 予期しないエラー:", error)
  process.exit(1)
})
