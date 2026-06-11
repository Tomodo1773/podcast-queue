import { describe, expect, it } from "vitest"
import { buildEmbeddingInput } from "../generate-embedding"

describe("buildEmbeddingInput", () => {
  it("タイトルと説明を改行で結合する", () => {
    expect(buildEmbeddingInput("タイトル", "説明文")).toBe("タイトル\n説明文")
  })

  it("説明からURLを除去する", () => {
    const result = buildEmbeddingInput("タイトル", "説明 https://example.com/foo の続き")
    expect(result).toBe("タイトル\n説明 の続き")
  })

  it("説明がnullの場合はタイトルのみ返す", () => {
    expect(buildEmbeddingInput("タイトル", null)).toBe("タイトル")
  })

  it("タイトルがnullの場合は説明のみ返す", () => {
    expect(buildEmbeddingInput(null, "説明文")).toBe("説明文")
  })
})
