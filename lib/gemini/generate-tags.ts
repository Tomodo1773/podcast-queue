import { google } from "@ai-sdk/google"
import * as ai from "ai"
import { wrapAISDK } from "langsmith/experimental/vercel"
import { z } from "zod"

const TagResponseSchema = z.object({
  tags: z.array(z.string().min(1).max(30)).min(6).max(12).describe("重要度順に並べる。重複は禁止。"),
})

export type TagResponse = z.infer<typeof TagResponseSchema>

const PROMPT_TEMPLATE = `
入力されたポッドキャストのエピソード情報（タイトル、概要）を読み、内容を代表するタグを生成してください。

【目的】
- 検索性が高く、あとから振り返りやすいタグを付ける
- タグ構造を極力シンプルに保つ

【入力】
以下が与えられます。
- title: {title}
- description: {description}

【タグの対象領域（参考）】
以下は"よく出る軸"の例です。必ずしもここに限定せず、内容に応じて新しいタグを作って構いません。

- 業界・領域
	- 例: 金融, 経済, 投資, テクノロジー, 政治, 国際情勢, キャリア, 教育, 医療
- 技術・プロダクト
	- 例: 生成AI, AIエージェント, ChatGPT, 音声AI, ロボット, 自動運転
- 半導体・計算資源
	- 例: 半導体, メモリ, GPU, 設備投資
- マクロ・市場テーマ
	- 例: インフレ, 利上げ, 金利, 為替, 円安, ドル高, 景気, 暴落, IPO
- 国・地域
	- 例: 日本, 米国, 中国, 台湾, 韓国, 欧州, 中東
- 政治・政策
	- 例: 減税, 消費税, 社会保険料, 成長戦略, 防衛, 選挙, 金融政策
- 企業・組織
	- 例: OpenAI, Microsoft, Google, NVIDIA, 日銀, FRB など

※企業・組織名や専門用語は、この例に無いものも自由に生成してよい。
※英語表記（ChatGPT / OpenAI / Microsoft など）はそのまま使ってよい。

【付与ルール】
- 1エピソードあたり 6〜12 個程度のタグを付ける
- 内容の「核心」になっている名詞を優先する
- 検索で役に立たない抽象タグ（例: 重要 / 注目 / 話題）は付けない
- 人物名、番組名、シリーズ名、形式（インタビュー等）、用途タグは付けない

【出力形式（JSONのみ）】
カテゴリ分けはせず、単純なタグ配列として出力してください。
余計な説明文は一切出力しないでください。

{
  "tags": ["タグ1", "タグ2", "タグ3", "..."]
}

【出力例】
入力:
- title: 「米国の利上げ観測とドル高、半導体株への影響」
- description: 「FRBの政策金利見通しと為替が議論され、半導体企業の決算も触れた」

出力:
{
  "tags": [
    "金融",
    "投資",
    "米国",
    "利上げ",
    "金利",
    "為替",
    "ドル高",
    "半導体",
    "FRB"
  ]
}
`.trim()

// LangSmithトレーシングが有効な場合はAI SDKをラップ
const { generateObject } =
  process.env.LANGCHAIN_TRACING_V2 === "true"
    ? wrapAISDK(ai, {
        project_name: process.env.LANGSMITH_PROJECT,
      })
    : ai

/**
 * Gemini APIを使用してタグを生成する
 * @param title ポッドキャストのタイトル
 * @param description ポッドキャストの説明
 * @returns 生成されたタグの配列
 */
export async function generateTags(title: string, description: string): Promise<string[]> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set, skipping tag generation")
    return []
  }

  try {
    // プロンプトにタイトルと説明を埋め込む
    const prompt = PROMPT_TEMPLATE.replace("{title}", title).replace(
      "{description}",
      description || "（説明なし）"
    )

    const result = await generateObject({
      model: google("gemini-3-flash-preview", { apiKey }),
      schema: TagResponseSchema,
      prompt,
    })

    return result.object.tags
  } catch (error) {
    console.error("Failed to generate tags:", error)
    return []
  }
}
