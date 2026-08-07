import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { embedMany } from "ai"
import { getGeminiApiKey } from "./api-key"
import { removeUrls } from "./generate-metadata"

/** pgvectorの列定義（vector(768)）と合わせること */
const EMBEDDING_DIMENSIONS = 768

/** マルチモーダル対応の現行モデル。指定次元への切り詰め時もAPI側で正規化される */
const EMBEDDING_MODEL = "gemini-embedding-2"

/** 説明文後半の宣伝・リンク集などが意味を薄めないよう、先頭部分だけを使う */
const DESCRIPTION_MAX_CHARACTERS = 500

/** Gemini Embedding 2ではtaskTypeの代わりに入力へ用途を明記する */
const SEMANTIC_SIMILARITY_PREFIX = "task: sentence similarity | query:"

function truncateCharacters(text: string, maxCharacters: number): string {
  return Array.from(text).slice(0, maxCharacters).join("").trim()
}

/**
 * embedding入力テキストを組み立てる
 * プロファイル側（登録済みポッドキャスト）と候補側（YouTube新着）で同じ形式に揃える
 */
export function buildEmbeddingInput(title: string | null, description: string | null): string {
  const normalizedTitle = title?.trim() || ""
  const normalizedDescription = truncateCharacters(removeUrls(description || ""), DESCRIPTION_MAX_CHARACTERS)
  const fields = [
    normalizedTitle && `title: ${normalizedTitle}`,
    normalizedDescription && `text: ${normalizedDescription}`,
  ].filter(Boolean)

  if (fields.length === 0) return ""
  return `${SEMANTIC_SIMILARITY_PREFIX} ${fields.join(" | ")}`
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
  if (!text.trim()) return null
  if (!getGeminiApiKey("embedding generation")) return null

  try {
    const [embedding] = await generateEmbeddings([text])
    return embedding
  } catch (error) {
    console.error("Failed to generate embedding:", error)
    return null
  }
}
