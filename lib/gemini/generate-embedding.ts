import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { embedMany } from "ai"
import { removeUrls } from "./generate-metadata"

/** pgvectorの列定義（vector(768)）と合わせること */
const EMBEDDING_DIMENSIONS = 768

/** マルチモーダル対応の現行モデル。指定次元への切り詰め時もAPI側で正規化される */
const EMBEDDING_MODEL = "gemini-embedding-2"

/**
 * embedding入力テキストを組み立てる
 * プロファイル側（登録済みポッドキャスト）と候補側（YouTube新着）で同じ形式に揃える
 */
export function buildEmbeddingInput(title: string | null, description: string | null): string {
  const parts = [title?.trim(), removeUrls(description || "")].filter(Boolean)
  return parts.join("\n")
}

/**
 * 複数テキストのembeddingを一括生成する（APIキー未設定・APIエラー時はthrow）
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set")
  }

  const google = createGoogleGenerativeAI({ apiKey })

  const { embeddings } = await embedMany({
    model: google.textEmbedding(EMBEDDING_MODEL),
    values: texts,
    providerOptions: {
      google: {
        outputDimensionality: EMBEDDING_DIMENSIONS,
      },
    },
  })

  return embeddings
}

/**
 * 単一テキストのembeddingを生成する（失敗時はnullを返すソフトフェイル版）
 * ポッドキャスト追加時のメタデータ生成フローから利用される
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY is not set, skipping embedding generation")
    return null
  }

  try {
    const [embedding] = await generateEmbeddings([text])
    return embedding
  } catch (error) {
    console.error("Failed to generate embedding:", error)
    return null
  }
}
