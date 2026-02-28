import type { Platform, Priority } from "@/lib/utils"

export type PodcastStatus = "unwatched" | "watching" | "watched"

export type Podcast = {
  id: string
  url: string
  title: string | null
  description: string | null
  thumbnail_url: string | null
  platform: Platform | null
  priority: Priority
  status: PodcastStatus
  watched_at: string | null
  created_at: string
  google_drive_file_created: boolean
  notion_page_created: boolean
  show_name: string | null
  tags: string[]
  speakers: string[]
  summary: string | null
}
