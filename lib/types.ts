import type { Platform, Priority } from "@/lib/utils"

export type Podcast = {
  id: string
  url: string
  title: string | null
  description: string | null
  thumbnail_url: string | null
  platform: Platform | null
  priority: Priority
  is_watched: boolean
  is_watching: boolean
  watched_at: string | null
  created_at: string
  google_drive_file_created: boolean
  notion_page_created: boolean
  show_name: string | null
  tags: string[]
  speakers: string[]
  summary: string | null
}
