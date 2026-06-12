import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

describe("generateYoutubeSummary", () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it("GEMINI_API_KEYがない場合はnullを返す", async () => {
    delete process.env.GEMINI_API_KEY
    process.env.LANGCHAIN_TRACING_V2 = "false"

    const { generateYoutubeSummary } = await import("../generate-youtube-summary")

    await expect(generateYoutubeSummary("https://www.youtube.com/watch?v=test")).resolves.toBeNull()
  })

  it("YouTube URLをfileパートとして渡し要約テキストを返す", async () => {
    process.env.GEMINI_API_KEY = "test-api-key"
    process.env.LANGCHAIN_TRACING_V2 = "false"

    const generateText = vi.fn().mockResolvedValue({ text: "summary" })
    vi.doMock("ai", () => ({ generateText }))

    const { generateYoutubeSummary } = await import("../generate-youtube-summary")
    const result = await generateYoutubeSummary("https://www.youtube.com/watch?v=test")

    expect(result).toBe("summary")
    expect(generateText).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [
          {
            role: "user",
            content: [
              { type: "file", data: "https://www.youtube.com/watch?v=test", mediaType: "video/*" },
              {
                type: "text",
                text: expect.stringContaining(
                  "提供されたYoutube動画について内容を確認した上で内容を詳細に教えてください。"
                ),
              },
            ],
          },
        ],
      })
    )
  })

  it("生成に失敗した場合はnullを返す", async () => {
    process.env.GEMINI_API_KEY = "test-api-key"
    process.env.LANGCHAIN_TRACING_V2 = "false"

    vi.doMock("ai", () => ({
      generateText: vi.fn().mockRejectedValue(new Error("api error")),
    }))

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    const { generateYoutubeSummary } = await import("../generate-youtube-summary")

    await expect(generateYoutubeSummary("https://www.youtube.com/watch?v=test")).resolves.toBeNull()
    expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to generate YouTube summary:", expect.any(Error))
  })
})
