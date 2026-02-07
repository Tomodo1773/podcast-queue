import { describe, expect, it } from "vitest"
import { MetadataResponseSchema } from "../generate-metadata"

describe("MetadataResponseSchema", () => {
  describe("tags", () => {
    it("有効なタグ配列を受け入れる", () => {
      const validData = {
        tags: ["金融", "投資", "米国", "利上げ", "金利", "為替", "ドル高", "半導体"],
        speakers: [],
      }

      const result = MetadataResponseSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it("タグ数が6未満の場合にエラーを返す", () => {
      const invalidData = {
        tags: ["金融", "投資", "米国"],
        speakers: [],
      }

      const result = MetadataResponseSchema.safeParse(invalidData)
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
        speakers: [],
      }

      const result = MetadataResponseSchema.safeParse(invalidData)
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
        speakers: [],
      }

      const result = MetadataResponseSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it("空文字列のタグを拒否する", () => {
      const invalidData = {
        tags: ["金融", "", "米国", "利上げ", "金利", "為替", "ドル高"],
        speakers: [],
      }

      const result = MetadataResponseSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe("speakers", () => {
    it("有効な出演者配列を受け入れる", () => {
      const validData = {
        tags: ["金融", "投資", "米国", "利上げ", "金利", "為替"],
        speakers: ["山田太郎", "アンドリュー・カール", "t-yoshi"],
      }

      const result = MetadataResponseSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it("空の出演者配列を受け入れる", () => {
      const validData = {
        tags: ["金融", "投資", "米国", "利上げ", "金利", "為替"],
        speakers: [],
      }

      const result = MetadataResponseSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it("出演者数が20を超える場合にエラーを返す", () => {
      const invalidData = {
        tags: ["金融", "投資", "米国", "利上げ", "金利", "為替"],
        speakers: Array(21).fill("山田太郎"),
      }

      const result = MetadataResponseSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it("出演者名の長さが50文字を超える場合にエラーを返す", () => {
      const invalidData = {
        tags: ["金融", "投資", "米国", "利上げ", "金利", "為替"],
        speakers: [
          "山田太郎",
          "これは50文字を超える非常に長い出演者名ですこれは確実に50文字を超えています確実に超えている出演者名です",
        ],
      }

      const result = MetadataResponseSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it("空文字列の出演者名を拒否する", () => {
      const invalidData = {
        tags: ["金融", "投資", "米国", "利上げ", "金利", "為替"],
        speakers: ["山田太郎", "", "アンドリュー・カール"],
      }

      const result = MetadataResponseSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })
})
