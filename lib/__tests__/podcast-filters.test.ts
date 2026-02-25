import { describe, expect, it } from "vitest"
import {
  applyFilterAndSort,
  filterByPriority,
  filterByWatchStatus,
  moveWatchingToTop,
  sortPodcasts,
} from "@/lib/podcast-filters"
import type { Podcast } from "@/lib/types"

// テスト用のサンプルポッドキャストを作成するヘルパー関数
function createPodcast(overrides: Partial<Podcast> = {}): Podcast {
  return {
    id: "1",
    url: "https://example.com/podcast/1",
    title: "テストポッドキャスト",
    description: "テスト用の説明",
    thumbnail_url: null,
    platform: "other",
    priority: "medium",
    is_watched: false,
    is_watching: false,
    watched_at: null,
    created_at: "2024-01-01T00:00:00Z",
    google_drive_file_created: false,
    notion_page_created: false,
    show_name: null,
    tags: [],
    speakers: [],
    summary: null,
    ...overrides,
  }
}

describe("filterByWatchStatus", () => {
  const podcasts: Podcast[] = [
    createPodcast({ id: "1", is_watched: false }),
    createPodcast({ id: "2", is_watched: true }),
    createPodcast({ id: "3", is_watched: false }),
    createPodcast({ id: "4", is_watched: true }),
  ]

  describe("すべて表示", () => {
    it("フィルタが 'all' の場合、すべてのポッドキャストを返す", () => {
      const result = filterByWatchStatus(podcasts, "all")
      expect(result).toHaveLength(4)
      expect(result.map((p) => p.id)).toEqual(["1", "2", "3", "4"])
    })
  })

  describe("未視聴のみ", () => {
    it("フィルタが 'unwatched' の場合、未視聴のポッドキャストのみを返す", () => {
      const result = filterByWatchStatus(podcasts, "unwatched")
      expect(result).toHaveLength(2)
      expect(result.map((p) => p.id)).toEqual(["1", "3"])
      expect(result.every((p) => !p.is_watched)).toBe(true)
    })
  })

  describe("視聴済みのみ", () => {
    it("フィルタが 'watched' の場合、視聴済みのポッドキャストのみを返す", () => {
      const result = filterByWatchStatus(podcasts, "watched")
      expect(result).toHaveLength(2)
      expect(result.map((p) => p.id)).toEqual(["2", "4"])
      expect(result.every((p) => p.is_watched)).toBe(true)
    })
  })
})

describe("filterByPriority", () => {
  const podcasts: Podcast[] = [
    createPodcast({ id: "1", priority: "high" }),
    createPodcast({ id: "2", priority: "medium" }),
    createPodcast({ id: "3", priority: "low" }),
    createPodcast({ id: "4", priority: "high" }),
    createPodcast({ id: "5", priority: "medium" }),
  ]

  describe("すべての優先度", () => {
    it("フィルタが 'all' の場合、すべてのポッドキャストを返す", () => {
      const result = filterByPriority(podcasts, "all")
      expect(result).toHaveLength(5)
    })
  })

  describe("高優先度のみ", () => {
    it("フィルタが 'high' の場合、高優先度のポッドキャストのみを返す", () => {
      const result = filterByPriority(podcasts, "high")
      expect(result).toHaveLength(2)
      expect(result.map((p) => p.id)).toEqual(["1", "4"])
      expect(result.every((p) => p.priority === "high")).toBe(true)
    })
  })

  describe("中優先度のみ", () => {
    it("フィルタが 'medium' の場合、中優先度のポッドキャストのみを返す", () => {
      const result = filterByPriority(podcasts, "medium")
      expect(result).toHaveLength(2)
      expect(result.map((p) => p.id)).toEqual(["2", "5"])
      expect(result.every((p) => p.priority === "medium")).toBe(true)
    })
  })

  describe("低優先度のみ", () => {
    it("フィルタが 'low' の場合、低優先度のポッドキャストのみを返す", () => {
      const result = filterByPriority(podcasts, "low")
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe("3")
      expect(result[0].priority).toBe("low")
    })
  })
})

describe("sortPodcasts", () => {
  const podcasts: Podcast[] = [
    createPodcast({ id: "1", priority: "low", created_at: "2024-01-03T00:00:00Z" }),
    createPodcast({ id: "2", priority: "high", created_at: "2024-01-02T00:00:00Z" }),
    createPodcast({ id: "3", priority: "medium", created_at: "2024-01-01T00:00:00Z" }),
  ]

  describe("追加日順", () => {
    it("sortBy が 'created_at' の場合、順序を変更しない（DB側で降順ソート済み）", () => {
      const result = sortPodcasts(podcasts, "created_at")
      expect(result.map((p) => p.id)).toEqual(["1", "2", "3"])
    })
  })

  describe("優先度順", () => {
    it("sortBy が 'priority' の場合、優先度順（高→中→低）にソートする", () => {
      const result = sortPodcasts(podcasts, "priority")
      expect(result.map((p) => p.id)).toEqual(["2", "3", "1"])
      expect(result.map((p) => p.priority)).toEqual(["high", "medium", "low"])
    })
  })
})

describe("moveWatchingToTop", () => {
  it("視聴中のポッドキャストを先頭に移動する", () => {
    const podcasts: Podcast[] = [
      createPodcast({ id: "1", is_watching: false }),
      createPodcast({ id: "2", is_watching: true }),
      createPodcast({ id: "3", is_watching: false }),
    ]

    const result = moveWatchingToTop(podcasts)
    expect(result[0].id).toBe("2")
    expect(result[0].is_watching).toBe(true)
  })

  it("視聴中が複数ある場合、すべてを先頭に移動する", () => {
    const podcasts: Podcast[] = [
      createPodcast({ id: "1", is_watching: false }),
      createPodcast({ id: "2", is_watching: true }),
      createPodcast({ id: "3", is_watching: true }),
      createPodcast({ id: "4", is_watching: false }),
    ]

    const result = moveWatchingToTop(podcasts)
    expect(result.slice(0, 2).every((p) => p.is_watching)).toBe(true)
    expect(result.slice(2).every((p) => !p.is_watching)).toBe(true)
  })

  it("視聴中がない場合、順序を維持する", () => {
    const podcasts: Podcast[] = [
      createPodcast({ id: "1", is_watching: false }),
      createPodcast({ id: "2", is_watching: false }),
    ]

    const result = moveWatchingToTop(podcasts)
    expect(result.map((p) => p.id)).toEqual(["1", "2"])
  })
})

describe("applyFilterAndSort", () => {
  const podcasts: Podcast[] = [
    createPodcast({
      id: "1",
      priority: "low",
      is_watched: false,
      is_watching: false,
      created_at: "2024-01-03T00:00:00Z",
    }),
    createPodcast({
      id: "2",
      priority: "high",
      is_watched: true,
      is_watching: false,
      created_at: "2024-01-02T00:00:00Z",
    }),
    createPodcast({
      id: "3",
      priority: "medium",
      is_watched: false,
      is_watching: true,
      created_at: "2024-01-01T00:00:00Z",
    }),
    createPodcast({
      id: "4",
      priority: "high",
      is_watched: false,
      is_watching: false,
      created_at: "2024-01-04T00:00:00Z",
    }),
  ]

  it("複合フィルタリング: 未視聴 + 高優先度 + 優先度順", () => {
    const result = applyFilterAndSort(podcasts, "unwatched", "high", "priority")
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe("4")
  })

  it("視聴中を先頭に移動しながらフィルタリングとソートを行う", () => {
    const result = applyFilterAndSort(podcasts, "unwatched", "all", "priority")
    // 未視聴のみ: 1, 3, 4
    // 優先度順: 4(high), 3(medium), 1(low)
    // 視聴中を先頭: 3(視聴中), 4, 1
    expect(result).toHaveLength(3)
    expect(result[0].id).toBe("3") // 視聴中が先頭
    expect(result[0].is_watching).toBe(true)
  })

  it("すべて表示 + すべての優先度 + 追加日順", () => {
    const result = applyFilterAndSort(podcasts, "all", "all", "created_at")
    expect(result).toHaveLength(4)
    // 視聴中（id:3）が先頭に来る
    expect(result[0].id).toBe("3")
  })
})
