import { beforeEach, describe, expect, it, type Mock, vi } from "vitest"
import { updatePodcastMetadata } from "../update-podcast-metadata"

vi.mock("../generate-metadata", () => ({
  generateMetadata: vi.fn(),
}))

import { generateMetadata } from "../generate-metadata"

const mockGenerateMetadata = generateMetadata as Mock

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
  })

  it("タグと出演者名を生成してDBを更新する", async () => {
    const mockTags = ["金融", "投資", "米国", "利上げ", "金利", "為替"]
    const mockSpeakers = ["山田太郎"]
    mockGenerateMetadata.mockResolvedValue({ tags: mockTags, speakers: mockSpeakers })

    const supabase = createMockSupabase()

    const result = await updatePodcastMetadata(supabase as never, "podcast-1", "テストタイトル", "テスト説明")

    expect(result).toEqual({ tags: mockTags, speakers: mockSpeakers })
    expect(mockGenerateMetadata).toHaveBeenCalledWith("テストタイトル", "テスト説明")
    expect(supabase.from).toHaveBeenCalledWith("podcasts")
  })

  it("タグも出演者名も空の場合はDBを更新しない", async () => {
    mockGenerateMetadata.mockResolvedValue({ tags: [], speakers: [] })

    const supabase = createMockSupabase()

    const result = await updatePodcastMetadata(supabase as never, "podcast-1", "テストタイトル", "テスト説明")

    expect(result).toEqual({ tags: [], speakers: [] })
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it("DB更新エラー時にthrowする", async () => {
    mockGenerateMetadata.mockResolvedValue({ tags: ["テスト", "タグ", "1", "2", "3", "4"], speakers: [] })

    const supabase = createMockSupabase({ error: new Error("DB error") })

    await expect(
      updatePodcastMetadata(supabase as never, "podcast-1", "テストタイトル", "テスト説明")
    ).rejects.toThrow("Failed to update metadata")
  })
})
