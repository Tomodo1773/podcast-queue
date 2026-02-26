import type { PodcastData } from "@/lib/google/drive"

const NOTION_API_URL = "https://api.notion.com/v1"
const NOTION_VERSION = "2022-06-28"

function notionHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    "Notion-Version": NOTION_VERSION,
  }
}

export async function createNotionDatabase(accessToken: string, parentPageId: string): Promise<string> {
  const response = await fetch(`${NOTION_API_URL}/databases`, {
    method: "POST",
    headers: notionHeaders(accessToken),
    body: JSON.stringify({
      parent: { type: "page_id", page_id: parentPageId },
      title: [{ type: "text", text: { content: "PodQueue" } }],
      properties: {
        title: { title: {} },
        date: { date: {} },
        platform: { rich_text: {} },
        source: { url: {} },
        show_name: { rich_text: {} },
      },
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Notionデータベース作成に失敗しました: ${error}`)
  }

  const result = await response.json()
  return result.id
}

// Notionのrich_textは2000文字制限があるため分割する
function toRichText(text: string): object[] {
  const maxLen = 2000
  const chunks = []
  for (let i = 0; i < text.length; i += maxLen) {
    chunks.push({ type: "text", text: { content: text.slice(i, i + maxLen) } })
  }
  return chunks.length > 0 ? chunks : [{ type: "text", text: { content: "" } }]
}

function buildNotionBlocks(podcast: PodcastData): object[] {
  const blocks: object[] = []

  if (podcast.thumbnail_url) {
    blocks.push({
      object: "block",
      type: "image",
      image: { type: "external", external: { url: podcast.thumbnail_url } },
    })
  }

  blocks.push({
    object: "block",
    type: "heading_2",
    heading_2: { rich_text: [{ type: "text", text: { content: "説明" } }] },
  })

  const description = podcast.description || "（説明なし）"
  for (let i = 0; i < description.length; i += 2000) {
    blocks.push({
      object: "block",
      type: "paragraph",
      paragraph: { rich_text: [{ type: "text", text: { content: description.slice(i, i + 2000) } }] },
    })
  }

  if (podcast.platform === "youtube" && podcast.summary) {
    blocks.push({
      object: "block",
      type: "heading_2",
      heading_2: { rich_text: [{ type: "text", text: { content: "動画内容（Gemini生成）" } }] },
    })
    for (const line of podcast.summary.split("\n")) {
      if (line.startsWith("## ")) {
        blocks.push({
          object: "block",
          type: "heading_3",
          heading_3: { rich_text: toRichText(line.slice(3)) },
        })
      } else if (line.startsWith("- ")) {
        blocks.push({
          object: "block",
          type: "bulleted_list_item",
          bulleted_list_item: { rich_text: toRichText(line.slice(2)) },
        })
      } else if (line.trim()) {
        blocks.push({
          object: "block",
          type: "paragraph",
          paragraph: { rich_text: toRichText(line) },
        })
      }
    }
  }

  blocks.push(
    {
      object: "block",
      type: "heading_2",
      heading_2: { rich_text: [{ type: "text", text: { content: "学び" } }] },
    },
    {
      object: "block",
      type: "paragraph",
      paragraph: { rich_text: [{ type: "text", text: { content: "（視聴後に記入）" } }] },
    }
  )

  return blocks
}

export async function createNotionPage(
  accessToken: string,
  databaseId: string,
  podcast: PodcastData
): Promise<string> {
  const jstDate = new Date()
    .toLocaleDateString("ja-JP", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\//g, "-")

  const properties: Record<string, unknown> = {
    title: {
      title: [{ type: "text", text: { content: podcast.title || podcast.url } }],
    },
    date: { date: { start: jstDate } },
    platform: {
      rich_text: [{ type: "text", text: { content: podcast.platform } }],
    },
    source: { url: podcast.url },
  }

  if (podcast.show_name) {
    properties.show_name = {
      rich_text: [{ type: "text", text: { content: podcast.show_name } }],
    }
  }

  const response = await fetch(`${NOTION_API_URL}/pages`, {
    method: "POST",
    headers: notionHeaders(accessToken),
    body: JSON.stringify({
      parent: { database_id: databaseId },
      properties,
      children: buildNotionBlocks(podcast),
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Notionページ作成に失敗しました: ${error}`)
  }

  const result = await response.json()
  return result.id
}
