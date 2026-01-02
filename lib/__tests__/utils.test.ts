import { describe, expect, it } from "vitest"
import {
  detectPlatform,
  getPlatformLabel,
  getPriorityLabel,
  getPriorityOrder,
  type Platform,
  type Priority,
} from "@/lib/utils"

describe("detectPlatform", () => {
  describe("YouTube URL", () => {
    it("youtube.comを正しく判定できる", () => {
      expect(detectPlatform("https://www.youtube.com/watch?v=abc123")).toBe("youtube")
    })

    it("youtu.beを正しく判定できる", () => {
      expect(detectPlatform("https://youtu.be/abc123")).toBe("youtube")
    })
  })

  describe("Spotify URL", () => {
    it("spotify.comを正しく判定できる", () => {
      expect(detectPlatform("https://open.spotify.com/episode/abc123")).toBe("spotify")
    })
  })

  describe("NewsPicks URL", () => {
    it("newspicks.comを正しく判定できる", () => {
      expect(detectPlatform("https://newspicks.com/news/abc123")).toBe("newspicks")
    })

    it("npx.meを正しく判定できる", () => {
      expect(detectPlatform("https://npx.me/abc123")).toBe("newspicks")
    })
  })

  describe("Pivot URL", () => {
    it("pivot.incを正しく判定できる", () => {
      expect(detectPlatform("https://pivot.inc/video/abc123")).toBe("pivot")
    })
  })

  describe("テレ東Biz URL", () => {
    it("txbiz.tv-tokyo.co.jpを正しく判定できる", () => {
      expect(detectPlatform("https://txbiz.tv-tokyo.co.jp/video/abc123")).toBe("txbiz")
    })
  })

  describe("その他のURL", () => {
    it("未知のURLはotherを返す", () => {
      expect(detectPlatform("https://example.com/podcast/123")).toBe("other")
    })
  })
})

describe("getPlatformLabel", () => {
  const testCases: { platform: Platform | string | null; expected: string }[] = [
    { platform: "youtube", expected: "YouTube" },
    { platform: "spotify", expected: "Spotify" },
    { platform: "newspicks", expected: "NewsPicks" },
    { platform: "pivot", expected: "Pivot" },
    { platform: "txbiz", expected: "テレ東Biz" },
    { platform: "other", expected: "その他" },
    { platform: "unknown", expected: "その他" },
    { platform: null, expected: "その他" },
  ]

  it.each(testCases)("$platform のラベルは $expected を返す", ({ platform, expected }) => {
    expect(getPlatformLabel(platform)).toBe(expected)
  })
})

describe("getPriorityLabel", () => {
  const testCases: { priority: Priority; expected: string }[] = [
    { priority: "high", expected: "高" },
    { priority: "medium", expected: "中" },
    { priority: "low", expected: "低" },
  ]

  it.each(testCases)("$priority のラベルは $expected を返す", ({ priority, expected }) => {
    expect(getPriorityLabel(priority)).toBe(expected)
  })
})

describe("getPriorityOrder", () => {
  const testCases: { priority: Priority; expected: number }[] = [
    { priority: "high", expected: 0 },
    { priority: "medium", expected: 1 },
    { priority: "low", expected: 2 },
  ]

  it.each(testCases)("$priority のソート順は $expected を返す", ({ priority, expected }) => {
    expect(getPriorityOrder(priority)).toBe(expected)
  })
})
