/**
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from "vitest"
import { fetchLatestVideos, parseDurationSeconds } from "../fetch-latest-videos"

// グローバルfetchをモック
const mockFetch = vi.fn()
global.fetch = mockFetch

describe("parseDurationSeconds", () => {
  it("時分秒を秒数に変換する", () => {
    expect(parseDurationSeconds("PT45S")).toBe(45)
    expect(parseDurationSeconds("PT1M30S")).toBe(90)
    expect(parseDurationSeconds("PT10M")).toBe(600)
    expect(parseDurationSeconds("PT1H2M3S")).toBe(3723)
  })

  it("パースできない場合はnullを返す", () => {
    expect(parseDurationSeconds("invalid")).toBeNull()
  })
})

describe("fetchLatestVideos", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.YOUTUBE_API_KEY = "test-api-key"
  })

  // playlistItems.list（1回目）とvideos.list（2回目）のレスポンスを順に返すヘルパー
  function mockApi(
    playlistItems: Array<{ videoId: string; publishedAt: string }>,
    durations: Record<string, string>
  ) {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: playlistItems.map((v) => ({
            snippet: { title: v.videoId, description: "", thumbnails: {} },
            contentDetails: { videoId: v.videoId, videoPublishedAt: v.publishedAt },
          })),
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: Object.entries(durations).map(([id, duration]) => ({
            id,
            contentDetails: { duration },
          })),
        }),
      })
  }

  it("60秒以下の動画を除外する", async () => {
    mockApi(
      [
        { videoId: "normal", publishedAt: "2026-06-10T00:00:00Z" },
        { videoId: "short", publishedAt: "2026-06-09T00:00:00Z" },
      ],
      { normal: "PT5M", short: "PT45S" }
    )

    const result = await fetchLatestVideos("UCxxxxxxxxxxxxxxxxxxxxxx")
    expect(result.map((v) => v.videoId)).toEqual(["normal"])
  })

  it("durationが取得できなかった動画は除外しない（フェイルセーフ）", async () => {
    mockApi(
      [
        { videoId: "known", publishedAt: "2026-06-10T00:00:00Z" },
        { videoId: "unknown", publishedAt: "2026-06-09T00:00:00Z" },
      ],
      { known: "PT5M" } // unknown は videos.list のレスポンスに含めない
    )

    const result = await fetchLatestVideos("UCxxxxxxxxxxxxxxxxxxxxxx")
    expect(result.map((v) => v.videoId)).toEqual(["known", "unknown"])
  })

  it("動画がない場合はvideos.listを呼ばず空配列を返す", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ items: [] }) })

    const result = await fetchLatestVideos("UCxxxxxxxxxxxxxxxxxxxxxx")
    expect(result).toEqual([])
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })
})
