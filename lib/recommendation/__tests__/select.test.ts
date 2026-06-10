import { describe, expect, it } from "vitest"
import { latestPublishedAt, pickRecommendations, selectNewVideos } from "../select"

describe("selectNewVideos", () => {
  const videos = [
    { videoId: "a", publishedAt: "2026-06-10T00:00:00Z" },
    { videoId: "b", publishedAt: "2026-06-09T00:00:00Z" },
    { videoId: "c", publishedAt: "2026-06-08T00:00:00Z" },
  ]

  it("前回処理日時より新しい動画のみ返す", () => {
    const result = selectNewVideos(videos, "2026-06-09T00:00:00Z")
    expect(result.map((v) => v.videoId)).toEqual(["a"])
  })

  it("前回処理日時がnullの場合は空配列を返す（初回は通知しない）", () => {
    expect(selectNewVideos(videos, null)).toEqual([])
  })

  it("新着がない場合は空配列を返す", () => {
    expect(selectNewVideos(videos, "2026-06-10T00:00:00Z")).toEqual([])
  })
})

describe("pickRecommendations", () => {
  const candidates = [
    { title: "low", score: 0.3 },
    { title: "high", score: 0.8 },
    { title: "mid", score: 0.6 },
    { title: "highest", score: 0.9 },
  ]

  it("閾値以上をスコア降順で最大件数まで返す", () => {
    const result = pickRecommendations(candidates, 0.5, 2)
    expect(result.map((c) => c.title)).toEqual(["highest", "high"])
  })

  it("閾値未満はすべて除外される", () => {
    expect(pickRecommendations(candidates, 0.95, 3)).toEqual([])
  })
})

describe("latestPublishedAt", () => {
  it("最も新しい公開日時を返す", () => {
    const videos = [
      { publishedAt: "2026-06-08T00:00:00Z" },
      { publishedAt: "2026-06-10T00:00:00Z" },
      { publishedAt: "2026-06-09T00:00:00Z" },
    ]
    expect(latestPublishedAt(videos)).toBe("2026-06-10T00:00:00Z")
  })

  it("空配列の場合はnullを返す", () => {
    expect(latestPublishedAt([])).toBeNull()
  })
})
