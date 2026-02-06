import { describe, expect, it } from "vitest"
import { z } from "zod"

// テスト用のスキーマ（本番と同じ定義）
const TagResponseSchema = z.object({
  tags: z.array(z.string().min(1).max(30)).min(6).max(12),
})

describe("TagResponseSchema", () => {
  it("有効なタグ配列を受け入れる", () => {
    const validData = {
      tags: ["金融", "投資", "米国", "利上げ", "金利", "為替", "ドル高", "半導体"],
    }

    const result = TagResponseSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it("タグ数が6未満の場合にエラーを返す", () => {
    const invalidData = {
      tags: ["金融", "投資", "米国"],
    }

    const result = TagResponseSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it("タグ数が12を超える場合にエラーを返す", () => {
    const invalidData = {
      tags: [
        "金融",
        "投資",
        "米国",
        "利上げ",
        "金利",
        "為替",
        "ドル高",
        "半導体",
        "FRB",
        "インフレ",
        "景気",
        "暴落",
        "IPO",
      ],
    }

    const result = TagResponseSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it("タグの長さが30文字を超える場合にエラーを返す", () => {
    const invalidData = {
      tags: [
        "金融",
        "投資",
        "米国",
        "利上げ",
        "金利",
        "為替",
        "これは30文字を超える非常に長いタグ名ですこれは確実に30文字を超えています",
        "半導体",
      ],
    }

    const result = TagResponseSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it("空文字列のタグを拒否する", () => {
    const invalidData = {
      tags: ["金融", "", "米国", "利上げ", "金利", "為替", "ドル高"],
    }

    const result = TagResponseSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })
})
