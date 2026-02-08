import { beforeEach, describe, expect, it, type Mock, vi } from "vitest"
import { updatePodcastMetadata } from "../update-podcast-metadata"

vi.mock("../generate-metadata", () => ({
  generateMetadata: vi.fn(),
}))

vi.mock("../generate-youtube-summary", () => ({
  generateYoutubeSummary: vi.fn(),
}))

import { generateMetadata } from "../generate-metadata"
import { generateYoutubeSummary } from "../generate-youtube-summary"

const mockGenerateMetadata = generateMetadata as Mock
const mockGenerateYoutubeSummary = generateYoutubeSummary as Mock

interface MockSupabaseClient {
  from: Mock
  update: Mock
  eq: Mock
}

function createMockSupabase(updateResult: { error: unknown } = { error: null }): MockSupabaseClient {
  const eq = vi.fn().mockReturnValue(updateResult)
  const update = vi.fn().mockReturnValue({ eq })
  const from = vi.fn().mockReturnValue({ update })
  return { from, update, eq } as unknown as MockSupabaseClient
}

describe("updatePodcastMetadata", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGenerateYoutubeSummary.mockResolvedValue(null)
  })

  it("タグと出演者名を生成してDBを更新する", async () => {
    const mockTags = ["金融", "投資", "米国", "利上げ", "金利", "為替"]
    const mockSpeakers = ["山田太郎"]
    mockGenerateMetadata.mockResolvedValue({ tags: mockTags, speakers: mockSpeakers })

    const supabase = createMockSupabase()

    const result = await updatePodcastMetadata(supabase as never, "podcast-1", "テストタイトル", "テスト説明")

    expect(result).toEqual({ tags: mockTags, speakers: mockSpeakers, summary: null })
    expect(mockGenerateMetadata).toHaveBeenCalledWith("テストタイトル", "テスト説明")
    expect(supabase.from).toHaveBeenCalledWith("podcasts")
  })

  it("タグも出演者名も空の場合はDBを更新しない", async () => {
    mockGenerateMetadata.mockResolvedValue({ tags: [], speakers: [] })

    const supabase = createMockSupabase()

    const result = await updatePodcastMetadata(supabase as never, "podcast-1", "テストタイトル", "テスト説明")

    expect(result).toEqual({ tags: [], speakers: [], summary: null })
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it("DB更新エラー時にthrowする", async () => {
    mockGenerateMetadata.mockResolvedValue({ tags: ["テスト", "タグ", "1", "2", "3", "4"], speakers: [] })

    const supabase = createMockSupabase({ error: new Error("DB error") })

    await expect(
      updatePodcastMetadata(supabase as never, "podcast-1", "テストタイトル", "テスト説明")
    ).rejects.toThrow("Failed to update metadata")
  })

  it("YouTube動画の場合はYouTube要約も生成する", async () => {
    const mockTags = ["技術", "AI"]
    const mockSpeakers = ["佐藤花子"]
    const mockSummary = "- セクション1\n\t- 内容1\n\t- 内容2"
    mockGenerateMetadata.mockResolvedValue({ tags: mockTags, speakers: mockSpeakers })
    mockGenerateYoutubeSummary.mockResolvedValue(mockSummary)

    const supabase = createMockSupabase()

    const result = await updatePodcastMetadata(
      supabase as never,
      "podcast-1",
      "テストタイトル",
      "テスト説明",
      "youtube",
      "https://www.youtube.com/watch?v=test"
    )

    expect(result).toEqual({ tags: mockTags, speakers: mockSpeakers, summary: mockSummary })
    expect(mockGenerateYoutubeSummary).toHaveBeenCalledWith("https://www.youtube.com/watch?v=test")
    expect(supabase.from).toHaveBeenCalledWith("podcasts")
  })

  it("YouTube以外のプラットフォームではYouTube要約を生成しない", async () => {
    const mockTags = ["ビジネス"]
    const mockSpeakers: string[] = []
    mockGenerateMetadata.mockResolvedValue({ tags: mockTags, speakers: mockSpeakers })

    const supabase = createMockSupabase()

    const result = await updatePodcastMetadata(
      supabase as never,
      "podcast-1",
      "テストタイトル",
      "テスト説明",
      "spotify",
      "https://open.spotify.com/episode/test"
    )

    expect(result).toEqual({ tags: mockTags, speakers: mockSpeakers, summary: null })
    expect(mockGenerateYoutubeSummary).not.toHaveBeenCalled()
  })

  it("YouTube /live/ URLの場合はYouTube要約を生成しない", async () => {
    const mockTags = ["技術", "AI"]
    const mockSpeakers = ["佐藤花子"]
    mockGenerateMetadata.mockResolvedValue({ tags: mockTags, speakers: mockSpeakers })

    const supabase = createMockSupabase()

    const result = await updatePodcastMetadata(
      supabase as never,
      "podcast-1",
      "テストタイトル",
      "テスト説明",
      "youtube",
      "https://www.youtube.com/live/SO76xQ54Rg8"
    )

    expect(result).toEqual({ tags: mockTags, speakers: mockSpeakers, summary: null })
    expect(mockGenerateYoutubeSummary).not.toHaveBeenCalled()
  })

  it("YouTubeサブドメイン（m.youtube.com）の場合もYouTube要約を生成する", async () => {
    const mockTags = ["技術", "AI"]
    const mockSpeakers = ["佐藤花子"]
    const mockSummary = "- セクション1\n\t- 内容1\n\t- 内容2"
    mockGenerateMetadata.mockResolvedValue({ tags: mockTags, speakers: mockSpeakers })
    mockGenerateYoutubeSummary.mockResolvedValue(mockSummary)

    const supabase = createMockSupabase()

    const result = await updatePodcastMetadata(
      supabase as never,
      "podcast-1",
      "テストタイトル",
      "テスト説明",
      "youtube",
      "https://m.youtube.com/watch?v=test"
    )

    expect(result).toEqual({ tags: mockTags, speakers: mockSpeakers, summary: mockSummary })
    expect(mockGenerateYoutubeSummary).toHaveBeenCalledWith("https://m.youtube.com/watch?v=test")
  })

  it("YouTubeサブドメイン（m.youtube.com）で /live/ URLの場合はYouTube要約を生成しない", async () => {
    const mockTags = ["技術", "AI"]
    const mockSpeakers = ["佐藤花子"]
    mockGenerateMetadata.mockResolvedValue({ tags: mockTags, speakers: mockSpeakers })

    const supabase = createMockSupabase()

    const result = await updatePodcastMetadata(
      supabase as never,
      "podcast-1",
      "テストタイトル",
      "テスト説明",
      "youtube",
      "https://m.youtube.com/live/SO76xQ54Rg8"
    )

    expect(result).toEqual({ tags: mockTags, speakers: mockSpeakers, summary: null })
    expect(mockGenerateYoutubeSummary).not.toHaveBeenCalled()
  })
})
