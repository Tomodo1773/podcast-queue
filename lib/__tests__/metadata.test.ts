import { describe, expect, it } from "vitest"
import {
  decodeHtmlEntities,
  extractNewsPicksShowName,
  extractSpotifyId,
  extractYouTubeVideoId,
} from "@/lib/metadata/fetcher"

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

  describe("セキュリティ検証", () => {
    it("パス内にyoutube.comが含まれるURLを除外", () => {
      expect(extractYouTubeVideoId("https://evil.com/youtube.com/watch?v=dQw4w9WgXcQ")).toBeNull()
    })

    it("偽装サブドメインを除外", () => {
      expect(extractYouTubeVideoId("https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ")).toBeNull()
    })

    it("クエリパラメータ内にyoutube.comが含まれるURLを除外", () => {
      expect(
        extractYouTubeVideoId("https://example.com/?redirect=youtube.com/watch?v=dQw4w9WgXcQ")
      ).toBeNull()
    })

    it("youtu.beの偽装URLを除外", () => {
      expect(extractYouTubeVideoId("https://youtu.be.evil.com/dQw4w9WgXcQ")).toBeNull()
    })

    it("URLパースに失敗した場合はnullを返す", () => {
      expect(extractYouTubeVideoId("not-a-url")).toBeNull()
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

  describe("セキュリティ検証", () => {
    it("パス内にspotify.comが含まれるURLを除外", () => {
      expect(extractSpotifyId("https://evil.com/spotify.com/episode/4rOoJ6Egrf8K2IrywzwOMk")).toBeNull()
    })

    it("偽装サブドメインを除外", () => {
      expect(extractSpotifyId("https://spotify.com.evil.com/episode/4rOoJ6Egrf8K2IrywzwOMk")).toBeNull()
    })

    it("クエリパラメータ内にspotify.comが含まれるURLを除外", () => {
      expect(extractSpotifyId("https://example.com/?url=spotify.com/show/abc123")).toBeNull()
    })

    it("open.spotify.comの偽装URLを除外", () => {
      expect(extractSpotifyId("https://open.spotify.com.attacker.com/episode/abc123")).toBeNull()
    })

    it("URLパースに失敗した場合はnullを返す", () => {
      expect(extractSpotifyId("not-a-url")).toBeNull()
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

describe("decodeHtmlEntities", () => {
  describe("名前付きHTMLエンティティのデコード", () => {
    it('&quot; を " にデコード', () => {
      expect(decodeHtmlEntities("NO RULES 〜企業変革の&quot;今&quot;に迫る〜")).toBe(
        'NO RULES 〜企業変革の"今"に迫る〜'
      )
    })

    it("&amp; を & にデコード", () => {
      expect(decodeHtmlEntities("A &amp; B")).toBe("A & B")
    })

    it("&lt; を < にデコード", () => {
      expect(decodeHtmlEntities("x &lt; 10")).toBe("x < 10")
    })

    it("&gt; を > にデコード", () => {
      expect(decodeHtmlEntities("x &gt; 5")).toBe("x > 5")
    })

    it("&apos; を ' にデコード", () => {
      expect(decodeHtmlEntities("It&apos;s a test")).toBe("It's a test")
    })
  })

  describe("数値文字参照のデコード", () => {
    it('&#34; を " にデコード', () => {
      expect(decodeHtmlEntities("Title &#34;test&#34;")).toBe('Title "test"')
    })

    it("&#38; を & にデコード", () => {
      expect(decodeHtmlEntities("A &#38; B")).toBe("A & B")
    })

    it("&#60; を < にデコード", () => {
      expect(decodeHtmlEntities("x &#60; 10")).toBe("x < 10")
    })

    it("&#62; を > にデコード", () => {
      expect(decodeHtmlEntities("x &#62; 5")).toBe("x > 5")
    })

    it("&#39; を ' にデコード", () => {
      expect(decodeHtmlEntities("It&#39;s OK")).toBe("It's OK")
    })

    it("&#x27; を ' にデコード (16進数形式)", () => {
      expect(decodeHtmlEntities("It&#x27;s great")).toBe("It's great")
    })
  })

  describe("複数のエンティティが混在する場合", () => {
    it("複数のエンティティを正しくデコード", () => {
      expect(decodeHtmlEntities("&quot;A &amp; B&quot; &lt; &quot;C&quot;")).toBe('"A & B" < "C"')
    })

    it("名前付きと数値参照が混在する場合", () => {
      expect(decodeHtmlEntities("&quot;test&#39;s&#34; result")).toBe('"test\'s" result')
    })
  })

  describe("エンティティが含まれない場合", () => {
    it("通常のテキストはそのまま返す", () => {
      expect(decodeHtmlEntities("Normal text")).toBe("Normal text")
    })

    it("空文字列はそのまま返す", () => {
      expect(decodeHtmlEntities("")).toBe("")
    })

    it("日本語テキストはそのまま返す", () => {
      expect(decodeHtmlEntities("これはテストです")).toBe("これはテストです")
    })
  })

  describe("実際のユースケース", () => {
    it("NewsPicksタイトル例をデコード", () => {
      expect(
        decodeHtmlEntities(
          "NO RULES 〜企業変革の&quot;今&quot;に迫る〜 | スキマバイト界を制したタイミー。28歳代表の野望が止まらない"
        )
      ).toBe('NO RULES 〜企業変革の"今"に迫る〜 | スキマバイト界を制したタイミー。28歳代表の野望が止まらない')
    })
  })
})

describe("NewsPicksのURL検証", () => {
  // fetchMetadata関数のURL検証ロジックのテスト
  // 実際のfetchMetadataはモックが必要なため、ここでは検証ロジックを個別に確認
  const isNewsPicksUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url)
      return (
        urlObj.hostname === "newspicks.com" ||
        urlObj.hostname.endsWith(".newspicks.com") ||
        urlObj.hostname === "npx.me"
      )
    } catch {
      return false
    }
  }

  describe("正規のNewsPicksドメイン", () => {
    it("newspicks.comを正しく検出", () => {
      expect(isNewsPicksUrl("https://newspicks.com/news/123")).toBe(true)
    })

    it("サブドメイン付きを正しく検出", () => {
      expect(isNewsPicksUrl("https://app.newspicks.com/news/123")).toBe(true)
    })

    it("npx.meを正しく検出", () => {
      expect(isNewsPicksUrl("https://npx.me/abc123")).toBe(true)
    })
  })

  describe("悪意のあるURL", () => {
    it("パス内にnewspicks.comが含まれるURLを除外", () => {
      expect(isNewsPicksUrl("https://evil.com/newspicks.com")).toBe(false)
    })

    it("サブドメイン風の偽装URLを除外", () => {
      expect(isNewsPicksUrl("https://newspicks.com.evil.com")).toBe(false)
    })

    it("クエリパラメータ内にnewspicks.comが含まれるURLを除外", () => {
      expect(isNewsPicksUrl("https://example.com/?redirect=newspicks.com")).toBe(false)
    })
  })

  describe("無効なURL", () => {
    it("URLパースに失敗した場合はfalseを返す", () => {
      expect(isNewsPicksUrl("not-a-url")).toBe(false)
    })
  })
})
