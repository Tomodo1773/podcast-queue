import { describe, expect, it } from "vitest"
import { buildEmbeddingInput } from "../generate-embedding"

describe("buildEmbeddingInput", () => {
  it("semantic similarity用の形式でタイトルと説明を組み立てる", () => {
    expect(buildEmbeddingInput("タイトル", "説明文")).toBe(
      "task: sentence similarity | query: title: タイトル | text: 説明文"
    )
  })

  it("説明からURLを除去する", () => {
    const result = buildEmbeddingInput("タイトル", "説明 https://example.com/foo の続き")
    expect(result).toBe("task: sentence similarity | query: title: タイトル | text: 説明 の続き")
  })

  it("説明は先頭500文字に制限する", () => {
    const result = buildEmbeddingInput("タイトル", "あ".repeat(501))
    expect(result).toBe(`task: sentence similarity | query: title: タイトル | text: ${"あ".repeat(500)}`)
  })

  it("絵文字を途中で分割せず500文字に制限する", () => {
    const result = buildEmbeddingInput("タイトル", "🎧".repeat(501))
    expect(result).toBe(`task: sentence similarity | query: title: タイトル | text: ${"🎧".repeat(500)}`)
  })

  it("説明がnullの場合はタイトルのみ返す", () => {
    expect(buildEmbeddingInput("タイトル", null)).toBe("task: sentence similarity | query: title: タイトル")
  })

  it("タイトルがnullの場合は説明のみ返す", () => {
    expect(buildEmbeddingInput(null, "説明文")).toBe("task: sentence similarity | query: text: 説明文")
  })

  it("タイトルと説明が空の場合は空文字を返す", () => {
    expect(buildEmbeddingInput(" ", null)).toBe("")
  })
})
