import { createGoogleGenerativeAI } from "@ai-sdk/google"
import * as ai from "ai"
import { wrapAISDK } from "langsmith/experimental/vercel"
import { z } from "zod"

export const MetadataResponseSchema = z.object({
  tags: z
    .array(z.string().min(1).max(30))
    .min(6)
    .max(12)
    .refine((tags) => new Set(tags).size === tags.length, {
      message: "タグは重複しないようにしてください。",
    })
    .describe("重要度順に並べる。重複は禁止。"),
  speakers: z
    .array(z.string().min(1).max(50))
    .max(20)
    .refine((speakers) => new Set(speakers).size === speakers.length, {
      message: "出演者名は重複しないようにしてください。",
    })
    .describe("出演者のフルネーム。抽出できない場合は空配列。"),
})

export type MetadataResponse = z.infer<typeof MetadataResponseSchema>

const PROMPT_TEMPLATE = `
入力されたポッドキャストのエピソード情報（タイトル、概要）を読み、**検索用タグ**と**出演者名**を抽出してください。

【入力】
- title: {title}
- description: {description}

---

## 1. タグ生成

【目的】
- 検索性が高く、あとから振り返りやすいタグを付ける

【タグの対象領域（参考）】
以下は"よく出る軸"の例です。必ずしもここに限定せず、内容に応じて新しいタグを作って構いません。

- 業界・領域: 金融, 経済, 投資, テクノロジー, 政治, 国際情勢, キャリア, 教育, 医療
- 技術・プロダクト: 生成AI, AIエージェント, ChatGPT, 音声AI, ロボット, 自動運転
- 半導体・計算資源: 半導体, メモリ, GPU, 設備投資
- マクロ・市場テーマ: インフレ, 利上げ, 金利, 為替, 円安, ドル高, 景気, 暴落, IPO
- 国・地域: 日本, 米国, 中国, 台湾, 韓国, 欧州, 中東
- 政治・政策: 減税, 消費税, 社会保険料, 成長戦略, 防衛, 選挙, 金融政策
- 企業・組織: OpenAI, Microsoft, Google, NVIDIA, 日銀, FRB など

【付与ルール】
- 1エピソードあたり 6〜12 個程度のタグを付ける
- 内容の「核心」になっている名詞を優先する
- 検索で役に立たない抽象タグ（例: 重要 / 注目 / 話題）は付けない
- 人物名、番組名、シリーズ名、形式（インタビュー等）、用途タグは付けない

---

## 2. 出演者名抽出

【抽出ルール】
- フルネームで抽出（苗字と名前）
- 英語名はカタカナ表記で、苗字と名前の間は「・」でつなぐ（例: アンドリュー・カール）
- 本名ではなくVTuber名、Xアカウント名、ハンドルネームでもよい
- 肩書は含めない
- フルネームが分からない場合は、苗字だけ、名前だけ、アカウント名だけでもよい
- Xなどのアカウント名のときは \`@\` はつけない
- スタッフなど出演者以外は含めない
- 抽出できない場合は空配列

【出演者名のサンプル】
- 山田太郎
- アンドリュー・カール
- t-yoshi
- ペルメール

---

【出力形式（JSONのみ）】
余計な説明文は一切出力しないでください。

{
  "tags": ["タグ1", "タグ2", "..."],
  "speakers": ["出演者1", "出演者2", "..."]
}

【出力例】
入力:
- title: 「米国の利上げ観測とドル高、半導体株への影響」
- description: 「FRBの政策金利見通しと為替が議論され、半導体企業の決算も触れた。ゲスト: 山田太郎氏（エコノミスト）、田中花子氏（証券アナリスト）」

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
  ],
  "speakers": ["山田太郎", "田中花子"]
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
 * テキストからURLを除去し、空白を正規化する（AI呼び出し時のコンテキスト削減用）
 * - URLパターン（http/https）を削除
 * - 連続する空白文字（改行含む）を単一スペースに圧縮
 * - 前後の空白を削除
 */
export function removeUrls(text: string): string {
  return text
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s{2,}/g, " ")
    .trim()
}

/**
 * Gemini APIを使用してタグと出演者名を生成する
 * @param title ポッドキャストのタイトル
 * @param description ポッドキャストの説明
 * @returns 生成されたタグと出演者名
 */
export async function generateMetadata(title: string, description: string): Promise<MetadataResponse> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set, skipping metadata generation")
    return { tags: [], speakers: [] }
  }

  try {
    // descriptionからURLを除去してコンテキスト削減
    const sanitizedDescription = removeUrls(description || "")

    // プロンプトにタイトルと説明を埋め込む
    const prompt = PROMPT_TEMPLATE.replace("{title}", title).replace(
      "{description}",
      sanitizedDescription || "（説明なし）"
    )

    // API Keyを使用してGoogleクライアントを作成
    const google = createGoogleGenerativeAI({
      apiKey,
    })

    const result = await generateObject({
      model: google("gemini-flash-latest"),
      schema: MetadataResponseSchema,
      prompt,
    })

    return result.object
  } catch (error) {
    console.error("Failed to generate metadata:", error)
    return { tags: [], speakers: [] }
  }
}
