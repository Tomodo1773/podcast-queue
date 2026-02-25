import type { Podcast } from "@/lib/types"
import { getPlatformLabel, getPriorityLabel } from "@/lib/utils"

export type ColumnKey =
  | "title"
  | "url"
  | "show_name"
  | "platform"
  | "priority"
  | "is_watched"
  | "created_at"
  | "tags"
  | "speakers"
  | "description"
  | "summary"
  | "watched_at"
  | "is_watching"

export type ColumnDef = {
  key: ColumnKey
  label: string
  defaultEnabled: boolean
}

export const EXPORT_COLUMNS: ColumnDef[] = [
  { key: "title", label: "タイトル", defaultEnabled: true },
  { key: "url", label: "URL", defaultEnabled: true },
  { key: "show_name", label: "番組名", defaultEnabled: true },
  { key: "platform", label: "プラットフォーム", defaultEnabled: true },
  { key: "priority", label: "優先度", defaultEnabled: true },
  { key: "is_watched", label: "視聴状態", defaultEnabled: true },
  { key: "created_at", label: "追加日時", defaultEnabled: true },
  { key: "tags", label: "タグ", defaultEnabled: true },
  { key: "speakers", label: "出演者", defaultEnabled: true },
  { key: "description", label: "説明", defaultEnabled: false },
  { key: "summary", label: "要約", defaultEnabled: false },
  { key: "watched_at", label: "視聴日時", defaultEnabled: false },
  { key: "is_watching", label: "視聴中", defaultEnabled: false },
]

function getCellValue(podcast: Podcast, key: ColumnKey): string {
  switch (key) {
    case "platform":
      return getPlatformLabel(podcast.platform)
    case "priority":
      return getPriorityLabel(podcast.priority)
    case "is_watched":
      return podcast.is_watched ? "視聴済み" : "未視聴"
    case "is_watching":
      return podcast.is_watching ? "視聴中" : ""
    case "tags":
      return podcast.tags.join(", ")
    case "speakers":
      return podcast.speakers.join(", ")
    default:
      return podcast[key] ?? ""
  }
}

function escapeCsvCell(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function generateCsv(podcasts: Podcast[], selectedColumns: ColumnKey[]): string {
  const columns = EXPORT_COLUMNS.filter((col) => selectedColumns.includes(col.key))

  const header = columns.map((col) => escapeCsvCell(col.label)).join(",")
  const rows = podcasts.map((podcast) =>
    columns.map((col) => escapeCsvCell(getCellValue(podcast, col.key))).join(",")
  )

  return [header, ...rows].join("\n")
}

export function downloadCsv(csv: string, filename: string): void {
  // BOM付きUTF-8でExcelの文字化けを防止
  const bom = "\uFEFF"
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
