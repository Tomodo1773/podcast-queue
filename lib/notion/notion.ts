import { markdownToBlocks } from "@tryfabric/martian"
import { generateMarkdownContent, type PodcastData } from "@/lib/google/drive"

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
      children: markdownToBlocks(generateMarkdownContent(podcast)),
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Notionページ作成に失敗しました: ${error}`)
  }

  const result = await response.json()
  return result.id
}
