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

  it("フロントマターが正しいYAML形式である（show_name・tagsなし）", () => {
    const podcast: PodcastData = {
      title: "テストタイトル",
      platform: "youtube",
      url: "https://example.com/video",
      description: "テスト説明",
    }

    const result = generateMarkdownContent(podcast)
    const lines = result.split("\n")

    expect(lines[0]).toBe("---")
    expect(lines[1]).toBe(`title: ${podcast.title}`)
    expect(lines[2]).toBe(`platform: ${podcast.platform}`)
    expect(lines[3]).toBe(`source: ${podcast.url}`)
    expect(lines[4]).toBe("---")
  })

  it("show_nameがある場合はフロントマターに含まれる", () => {
    const podcast: PodcastData = {
      title: "テストタイトル",
      platform: "youtube",
      url: "https://example.com/video",
      description: "テスト説明",
      show_name: "テスト番組",
    }

    const result = generateMarkdownContent(podcast)

    expect(result).toContain("show_name: テスト番組")
  })

  it("tagsがある場合はフロントマターに含まれる", () => {
    const podcast: PodcastData = {
      title: "テストタイトル",
      platform: "youtube",
      url: "https://example.com/video",
      description: "テスト説明",
      tags: ["AI", "テクノロジー", "投資"],
    }

    const result = generateMarkdownContent(podcast)

    expect(result).toContain("tags: [AI, テクノロジー, 投資]")
  })

  it("show_nameとtagsの両方がある場合はフロントマターに含まれる", () => {
    const podcast: PodcastData = {
      title: "テストタイトル",
      platform: "spotify",
      url: "https://example.com/episode",
      description: "テスト説明",
      show_name: "テスト番組",
      tags: ["経済", "金融"],
    }

    const result = generateMarkdownContent(podcast)
    const lines = result.split("\n")

    expect(lines[0]).toBe("---")
    expect(lines[1]).toBe("title: テストタイトル")
    expect(lines[2]).toBe("platform: spotify")
    expect(lines[3]).toBe("source: https://example.com/episode")
    expect(lines[4]).toBe("show_name: テスト番組")
    expect(lines[5]).toBe("tags: [経済, 金融]")
    expect(lines[6]).toBe("---")
  })

  it("tagsが空配列の場合はフロントマターに含まれない", () => {
    const podcast: PodcastData = {
      title: "テストタイトル",
      platform: "youtube",
      url: "https://example.com/video",
      description: "テスト説明",
      tags: [],
    }

    const result = generateMarkdownContent(podcast)

    expect(result).not.toContain("tags:")
  })

  it("speakersがある場合はフロントマターに含まれる", () => {
    const podcast: PodcastData = {
      title: "テストタイトル",
      platform: "youtube",
      url: "https://example.com/video",
      description: "テスト説明",
      speakers: ["山田太郎", "佐藤花子"],
    }

    const result = generateMarkdownContent(podcast)

    expect(result).toContain("speakers: [山田太郎, 佐藤花子]")
  })
})
