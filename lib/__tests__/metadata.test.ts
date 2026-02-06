import { describe, expect, it } from "vitest"
import { extractNewsPicksShowName, extractSpotifyId, extractYouTubeVideoId } from "@/lib/metadata/fetcher"

describe("extractYouTubeVideoId", () => {
  describe("標準形式", () => {
    it("youtube.com/watch?v=xxx からIDを抽出できる", () => {
      expect(extractYouTubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ")
    })

    it("クエリパラメータ付きURLからIDを抽出できる", () => {
      expect(extractYouTubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=120")).toBe("dQw4w9WgXcQ")
    })
  })

  describe("短縮形式", () => {
    it("youtu.be/xxx からIDを抽出できる", () => {
      expect(extractYouTubeVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ")
    })

    it("クエリパラメータ付き短縮URLからIDを抽出できる", () => {
      expect(extractYouTubeVideoId("https://youtu.be/dQw4w9WgXcQ?t=120")).toBe("dQw4w9WgXcQ")
    })
  })

  describe("Shorts形式", () => {
    it("youtube.com/shorts/xxx からIDを抽出できる", () => {
      expect(extractYouTubeVideoId("https://www.youtube.com/shorts/abc123XYZ")).toBe("abc123XYZ")
    })
  })

  describe("Live形式", () => {
    it("youtube.com/live/xxx からIDを抽出できる", () => {
      expect(extractYouTubeVideoId("https://www.youtube.com/live/abc123XYZ")).toBe("abc123XYZ")
    })
  })

  describe("無効なURL", () => {
    it("無効なURLの場合はnullを返す", () => {
      expect(extractYouTubeVideoId("https://example.com/video")).toBeNull()
    })

    it("YouTube以外のURLの場合はnullを返す", () => {
      expect(extractYouTubeVideoId("https://vimeo.com/123456")).toBeNull()
    })
  })
})

describe("extractSpotifyId", () => {
  describe("エピソードURL", () => {
    it("エピソードURLからtype(episode)とIDを抽出できる", () => {
      const result = extractSpotifyId("https://open.spotify.com/episode/4rOoJ6Egrf8K2IrywzwOMk")
      expect(result).toEqual({ type: "episode", id: "4rOoJ6Egrf8K2IrywzwOMk" })
    })

    it("クエリパラメータ付きエピソードURLからIDを抽出できる", () => {
      const result = extractSpotifyId("https://open.spotify.com/episode/4rOoJ6Egrf8K2IrywzwOMk?si=abc123")
      expect(result).toEqual({ type: "episode", id: "4rOoJ6Egrf8K2IrywzwOMk" })
    })
  })

  describe("番組URL", () => {
    it("番組URLからtype(show)とIDを抽出できる", () => {
      const result = extractSpotifyId("https://open.spotify.com/show/4rOoJ6Egrf8K2IrywzwOMk")
      expect(result).toEqual({ type: "show", id: "4rOoJ6Egrf8K2IrywzwOMk" })
    })
  })

  describe("無効なURL", () => {
    it("無効なURLの場合はnullを返す", () => {
      expect(extractSpotifyId("https://example.com/podcast")).toBeNull()
    })

    it("Spotify以外のURLの場合はnullを返す", () => {
      expect(extractSpotifyId("https://apple.com/podcast/123")).toBeNull()
    })

    it("artistやplaylistなど対象外のSpotify URLの場合はnullを返す", () => {
      expect(extractSpotifyId("https://open.spotify.com/artist/abc123")).toBeNull()
      expect(extractSpotifyId("https://open.spotify.com/playlist/abc123")).toBeNull()
    })
  })
})

describe("extractNewsPicksShowName", () => {
  describe("番組名を抽出できる", () => {
    it("週刊ジョーホー番組の形式", () => {
      expect(
        extractNewsPicksShowName(
          "週刊ジョーホー番組 | 【最強ツール】文系素人が「凄いアプリ」を量産中 - NewsPicks"
        )
      ).toBe("週刊ジョーホー番組")
    })

    it("デューデリだん！の形式", () => {
      expect(
        extractNewsPicksShowName("デューデリだん！ | 採用爆増「SmartHR」はコンサルを食いに行く - NewsPicks")
      ).toBe("デューデリだん！")
    })

    it("HORIE ONE＋の形式", () => {
      expect(
        extractNewsPicksShowName('HORIE ONE＋ | データの力で新市場"手料理サブスク"を開拓せよ - NewsPicks')
      ).toBe("HORIE ONE＋")
    })

    it("スペースが多い場合も正しく抽出", () => {
      expect(extractNewsPicksShowName("番組名   |   エピソード名 - NewsPicks")).toBe("番組名")
    })
  })

  describe("無効な形式", () => {
    it("| が含まれないタイトルの場合はnullを返す", () => {
      expect(extractNewsPicksShowName("タイトルのみ")).toBeNull()
    })

    it("空文字列の場合はnullを返す", () => {
      expect(extractNewsPicksShowName("")).toBeNull()
    })
  })
})
