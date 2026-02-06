import { describe, expect, it } from "vitest"
import { generateMarkdownContent, type PodcastData } from "../drive"

describe("generateMarkdownContent", () => {
  it("YAML形式のフロントマターを含むマークダウンを生成する", () => {
    const podcast: PodcastData = {
      title: "サンプルポッドキャストタイトル",
      platform: "youtube",
      url: "https://example.com/podcast/123",
      description: "これはサンプルの説明文です",
    }

    const result = generateMarkdownContent(podcast)

    expect(result).toContain("---")
    expect(result).toContain(`title: ${podcast.title}`)
    expect(result).toContain(`platform: ${podcast.platform}`)
    expect(result).toContain(`source: ${podcast.url}`)
    expect(result).toContain("## 説明")
    expect(result).toContain(podcast.description)
    expect(result).toContain("## 学び")
    expect(result).toContain("（視聴後に記入）")
  })

  it("説明がない場合は「（説明なし）」と表示する", () => {
    const podcast: PodcastData = {
      title: "テストポッドキャスト",
      platform: "spotify",
      url: "https://example.com",
      description: "",
    }

    const result = generateMarkdownContent(podcast)

    expect(result).toContain("（説明なし）")
  })

  it("フロントマターが正しいYAML形式である", () => {
    const podcast: PodcastData = {
      title: "テストタイトル",
      platform: "youtube",
      url: "https://example.com/video",
      description: "テスト説明",
    }

    const result = generateMarkdownContent(podcast)
    const lines = result.split("\n")

    // 最初の行は --- で始まる
    expect(lines[0]).toBe("---")
    // title, platform, sourceの行を含む
    expect(lines[1]).toBe(`title: ${podcast.title}`)
    expect(lines[2]).toBe(`platform: ${podcast.platform}`)
    expect(lines[3]).toBe(`source: ${podcast.url}`)
    // フロントマター終了行は --- で終わる
    expect(lines[4]).toBe("---")
  })
})
