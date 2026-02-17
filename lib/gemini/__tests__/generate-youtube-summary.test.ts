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

  it("トレース対象内部で発生した例外をLangSmith側で検知できる", async () => {
    process.env.GEMINI_API_KEY = "test-api-key"
    process.env.LANGCHAIN_TRACING_V2 = "true"
    process.env.LANGSMITH_PROJECT = "test-project"

    const traceErrorSpy = vi.fn()

    vi.doMock("langsmith/traceable", () => ({
      traceable: vi.fn((fn: (url: string) => Promise<string | null>) => {
        return async (url: string) => {
          try {
            return await fn(url)
          } catch (error) {
            traceErrorSpy(error)
            throw error
          }
        }
      }),
    }))

    vi.doMock("@google/genai", () => ({
      GoogleGenAI: vi.fn(
        class {
          models = {
            generateContent: vi.fn().mockRejectedValue(new Error("api error")),
          }
        }
      ),
    }))

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    const { generateYoutubeSummary } = await import("../generate-youtube-summary")

    await expect(generateYoutubeSummary("https://www.youtube.com/watch?v=test")).resolves.toBeNull()

    expect(traceErrorSpy).toHaveBeenCalledTimes(1)
    expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to generate YouTube summary:", expect.any(Error))
  })

  it("トレース入力にuserのfileDataとtext promptを含める", async () => {
    process.env.GEMINI_API_KEY = "test-api-key"
    process.env.LANGCHAIN_TRACING_V2 = "true"

    let capturedProcessInputs: ((inputs: unknown) => Record<string, unknown>) | undefined

    vi.doMock("langsmith/traceable", () => ({
      traceable: vi.fn((fn: (url: string) => Promise<string | null>, config: Record<string, unknown>) => {
        capturedProcessInputs = (config as { processInputs?: (inputs: unknown) => Record<string, unknown> })
          .processInputs
        return fn
      }),
    }))

    vi.doMock("@google/genai", () => ({
      GoogleGenAI: vi.fn(
        class {
          models = {
            generateContent: vi.fn().mockResolvedValue({ text: "summary" }),
          }
        }
      ),
    }))

    const { generateYoutubeSummary } = await import("../generate-youtube-summary")
    await generateYoutubeSummary("https://www.youtube.com/watch?v=test")

    expect(capturedProcessInputs).toBeTypeOf("function")
    if (!capturedProcessInputs) {
      throw new Error("processInputs was not captured")
    }

    const traceInputs = capturedProcessInputs({
      input: "https://www.youtube.com/watch?v=test",
    })

    expect(traceInputs).toMatchObject({
      messages: [
        {
          role: "user",
          content: [
            {
              type: "file_data",
              file_uri: "https://www.youtube.com/watch?v=test",
              mime_type: "video/*",
            },
            {
              type: "text",
              text: expect.stringContaining(
                "提供されたYoutube動画について内容を確認した上で内容を詳細に教えてください。"
              ),
            },
          ],
        },
      ],
      url: "https://www.youtube.com/watch?v=test",
    })
  })
})
