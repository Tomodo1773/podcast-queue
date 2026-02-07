import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from "vitest"
import { generateYoutubeSummary } from "../generate-youtube-summary"

// ai.generateText をモック
vi.mock("ai", () => ({
  generateText: vi.fn(),
}))

vi.mock("@ai-sdk/google", () => ({
  createGoogleGenerativeAI: vi.fn(() => (modelName: string) => modelName),
}))

vi.mock("langsmith/experimental/vercel", () => ({
  wrapAISDK: vi.fn((aiModule) => aiModule),
}))

import * as ai from "ai"

const mockGenerateText = ai.generateText as Mock

describe("generateYoutubeSummary", () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    // 環境変数をリセット
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it("APIキーが設定されていない場合はnullを返す", async () => {
    delete process.env.GEMINI_API_KEY

    const result = await generateYoutubeSummary("https://www.youtube.com/watch?v=test")

    expect(result).toBeNull()
    expect(mockGenerateText).not.toHaveBeenCalled()
  })

  it("YouTube URLから要約を生成する", async () => {
    process.env.GEMINI_API_KEY = "test-api-key"

    const mockSummary = "- セクション1\n\t- 内容1\n\t- 内容2"
    mockGenerateText.mockResolvedValue({ text: mockSummary })

    const result = await generateYoutubeSummary("https://www.youtube.com/watch?v=test123")

    expect(result).toBe(mockSummary)
    expect(mockGenerateText).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining("https://www.youtube.com/watch?v=test123"),
      })
    )
  })

  it("生成失敗時はnullを返す", async () => {
    process.env.GEMINI_API_KEY = "test-api-key"

    mockGenerateText.mockRejectedValue(new Error("API error"))

    const result = await generateYoutubeSummary("https://www.youtube.com/watch?v=test")

    expect(result).toBeNull()
  })
})
