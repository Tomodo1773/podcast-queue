import { describe, expect, it } from "vitest"
import { EXPORT_COLUMNS, generateCsv } from "@/lib/csv-export"
import type { Podcast } from "@/lib/types"

function createPodcast(overrides: Partial<Podcast> = {}): Podcast {
  return {
    id: "1",
    url: "https://example.com/podcast/1",
    title: "テストポッドキャスト",
    description: "テスト用の説明",
    thumbnail_url: null,
    platform: "youtube",
    priority: "high",
    is_watched: false,
    is_watching: false,
    watched_at: null,
    created_at: "2024-01-01T00:00:00Z",
    google_drive_file_created: false,
    notion_page_created: false,
    show_name: "テスト番組",
    tags: ["タグ1", "タグ2"],
    speakers: ["スピーカー1"],
    summary: null,
    ...overrides,
  }
}

describe("generateCsv", () => {
  it("指定したカラムのヘッダーとデータを含むCSVを生成する", () => {
    const podcasts = [createPodcast()]
    const csv = generateCsv(podcasts, ["title", "url"])

    const lines = csv.split("\n")
    expect(lines[0]).toBe("タイトル,URL")
    expect(lines[1]).toBe("テストポッドキャスト,https://example.com/podcast/1")
  })

  it("platformを日本語ラベルに変換する", () => {
    const podcasts = [createPodcast({ platform: "youtube" })]
    const csv = generateCsv(podcasts, ["platform"])

    const lines = csv.split("\n")
    expect(lines[1]).toBe("YouTube")
  })

  it("priorityを日本語ラベルに変換する", () => {
    const podcasts = [createPodcast({ priority: "high" })]
    const csv = generateCsv(podcasts, ["priority"])

    expect(csv.split("\n")[1]).toBe("高")
  })

  it("is_watchedをラベルに変換する", () => {
    const watched = createPodcast({ is_watched: true })
    const unwatched = createPodcast({ is_watched: false })
    const csv = generateCsv([watched, unwatched], ["is_watched"])

    const lines = csv.split("\n")
    expect(lines[1]).toBe("視聴済み")
    expect(lines[2]).toBe("未視聴")
  })

  it("tagsとspeakersをカンマ区切りの文字列に変換する", () => {
    const podcasts = [createPodcast({ tags: ["AI", "技術"], speakers: ["田中", "鈴木"] })]
    const csv = generateCsv(podcasts, ["tags", "speakers"])

    const lines = csv.split("\n")
    expect(lines[1]).toBe('"AI, 技術","田中, 鈴木"')
  })

  it("カンマを含むセルをダブルクォートでエスケープする", () => {
    const podcasts = [createPodcast({ title: "タイトル, サブタイトル" })]
    const csv = generateCsv(podcasts, ["title"])

    expect(csv.split("\n")[1]).toBe('"タイトル, サブタイトル"')
  })

  it("空のポッドキャストリストの場合、ヘッダー行のみを返す", () => {
    const csv = generateCsv([], ["title", "url"])

    const lines = csv.split("\n")
    expect(lines).toHaveLength(1)
    expect(lines[0]).toBe("タイトル,URL")
  })
})

describe("EXPORT_COLUMNS", () => {
  it("デフォルトで有効なカラムが定義されている", () => {
    const defaultEnabled = EXPORT_COLUMNS.filter((col) => col.defaultEnabled).map((col) => col.key)
    expect(defaultEnabled).toContain("title")
    expect(defaultEnabled).toContain("url")
    expect(defaultEnabled).toContain("tags")
    expect(defaultEnabled).not.toContain("description")
    expect(defaultEnabled).not.toContain("summary")
  })
})
