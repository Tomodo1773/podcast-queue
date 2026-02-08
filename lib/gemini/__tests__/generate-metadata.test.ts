import { beforeEach, describe, expect, it, vi } from "vitest"
import { generateMetadata, MetadataResponseSchema, removeUrls } from "../generate-metadata"

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

describe("generateMetadata", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("removeUrls", () => {
    it("テキストからHTTP URLを除去する", () => {
      const input = "これはテスト説明文です。http://example.com/test を参照してください。"
      const expected = "これはテスト説明文です。 を参照してください。"
      expect(removeUrls(input)).toBe(expected)
    })

    it("テキストからHTTPS URLを除去する", () => {
      const input =
        "これはテスト説明文です。https://example.com/test を参照してください。詳細はhttps://test.example.com/details にあります。"
      const expected = "これはテスト説明文です。 を参照してください。詳細は にあります。"
      expect(removeUrls(input)).toBe(expected)
    })

    it("複数のURLを除去する", () => {
      const input = "https://example.com/1 と https://example.com/2 と https://example.com/3"
      const expected = "と と"
      expect(removeUrls(input)).toBe(expected)
    })

    it("URLのみのテキストは空文字列になる", () => {
      const input = "https://example.com/test https://test.example.com/details"
      expect(removeUrls(input)).toBe("")
    })

    it("URLが含まれていない場合は元のテキストを返す（空白は正規化される）", () => {
      const input = "これはURLを含まないテキストです。"
      expect(removeUrls(input)).toBe(input)
    })

    it("連続する空白を単一スペースに圧縮する", () => {
      const input = "これは    複数の    スペースを    含むテキストです。"
      const expected = "これは 複数の スペースを 含むテキストです。"
      expect(removeUrls(input)).toBe(expected)
    })

    it("改行を含む連続空白を単一スペースに圧縮する", () => {
      const input = "行1  \n\n\n  行2  \n  行3"
      const expected = "行1 行2 行3"
      expect(removeUrls(input)).toBe(expected)
    })

    it("前後の空白を削除する", () => {
      const input = "  前後に空白があります  "
      const expected = "前後に空白があります"
      expect(removeUrls(input)).toBe(expected)
    })

    it("URL除去と空白正規化を同時に行う", () => {
      const input = "  テキスト1  https://example.com/test  テキスト2\n\n  テキスト3  "
      const expected = "テキスト1 テキスト2 テキスト3"
      expect(removeUrls(input)).toBe(expected)
    })
  })

  describe("generateMetadata", () => {
    it("GEMINI_API_KEYがない場合は空配列を返す", async () => {
      const originalApiKey = process.env.GEMINI_API_KEY
      const hasOriginalApiKey = Object.hasOwn(process.env, "GEMINI_API_KEY")

      try {
        delete process.env.GEMINI_API_KEY

        const result = await generateMetadata("タイトル", "説明文")

        expect(result).toEqual({ tags: [], speakers: [] })
      } finally {
        // 環境変数を元の状態に復元（空文字列や未定義も含めて正確に戻す）
        if (hasOriginalApiKey) {
          process.env.GEMINI_API_KEY = originalApiKey as typeof process.env.GEMINI_API_KEY
        } else {
          delete process.env.GEMINI_API_KEY
        }
      }
    })
  })
})
