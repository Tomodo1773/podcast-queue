"use client"

import { ArrowUpDown, Grid3x3, List, Loader2 } from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import useSWR from "swr"
import { CsvExportDialog } from "@/components/csv-export-dialog"
import { PodcastCard } from "@/components/podcast-card"
import { PodcastListItem } from "@/components/podcast-list-item"
import { Button } from "@/components/ui/button"
import {
  applyFilterAndSort,
  type PriorityFilter,
  type SortOption,
  type WatchFilter,
} from "@/lib/podcast-filters"
import { createClient } from "@/lib/supabase/client"
import type { Podcast } from "@/lib/types"
import { getPriorityLabel, type Platform, type Priority } from "@/lib/utils"

type PodcastListProps = {
  userId: string
}

const VIEW_MODE_STORAGE_KEY = "podcast-view-mode"

const fetchPodcasts = async (userId: string): Promise<Podcast[]> => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("podcasts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return data || []
}

export function PodcastList({ userId }: PodcastListProps) {
  const [filter, setFilter] = useState<WatchFilter>("unwatched")
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all")
  const [sortBy, setSortBy] = useState<SortOption>("created_at")
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(VIEW_MODE_STORAGE_KEY)
      if (saved === "grid" || saved === "list") {
        return saved
      }
    }
    return "grid"
  })

  const { data: podcasts = [], isLoading, mutate } = useSWR(["podcasts", userId], () => fetchPodcasts(userId))

  const filteredPodcasts = useMemo(
    () => applyFilterAndSort(podcasts, filter, priorityFilter, sortBy),
    [podcasts, filter, priorityFilter, sortBy]
  )

  const handleViewModeChange = (mode: "grid" | "list") => {
    setViewMode(mode)
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode)
  }

  const handleUpdateWatchedStatus = async (id: string, newStatus: boolean) => {
    const supabase = createClient()
    const podcast = podcasts.find((p) => p.id === id)
    const watched_at = newStatus ? podcast?.watched_at || new Date().toISOString() : null

    // 視聴済みにする場合は視聴中も解除
    const updateData = {
      is_watched: newStatus,
      watched_at,
      ...(newStatus && { is_watching: false }),
    }

    const { error } = await supabase.from("podcasts").update(updateData).eq("id", id)

    if (error) {
      console.error("[v0] ステータス更新エラー:", error)
    } else {
      mutate(
        podcasts.map((p) =>
          p.id === id
            ? {
                ...p,
                is_watched: newStatus,
                watched_at,
                is_watching: newStatus ? false : p.is_watching,
              }
            : p
        ),
        false
      )

      // 視聴済みにする場合、Google Drive/Notionファイル作成（バックグラウンド実行）
      if (newStatus) {
        tryCreateGoogleDriveFile(id, podcasts)
        tryCreateNotionPage(id, podcasts)
      }
    }
  }

  const handleToggleWatched = async (id: string, currentStatus: boolean) => {
    await handleUpdateWatchedStatus(id, !currentStatus)
  }

  const handleChangeWatchedStatus = async (id: string, newStatus: boolean) => {
    await handleUpdateWatchedStatus(id, newStatus)
  }

  const handleDelete = async (id: string) => {
    const supabase = createClient()

    const { error } = await supabase.from("podcasts").delete().eq("id", id)

    if (error) {
      console.error("[v0] 削除エラー:", error)
    } else {
      mutate(
        podcasts.filter((p) => p.id !== id),
        false
      )
    }
  }

  const handleChangePriority = async (id: string, newPriority: Priority) => {
    const supabase = createClient()

    const { error } = await supabase.from("podcasts").update({ priority: newPriority }).eq("id", id)

    if (error) {
      console.error("[v0] 優先度更新エラー:", error)
    } else {
      mutate(
        podcasts.map((p) => (p.id === id ? { ...p, priority: newPriority } : p)),
        false
      )
    }
  }

  const tryCreateGoogleDriveFile = (id: string, currentPodcasts: Podcast[]) => {
    const podcast = currentPodcasts.find((p) => p.id === id)
    if (podcast && !podcast.google_drive_file_created) {
      const supabase = createClient()
      createGoogleDriveFile(id, podcast, supabase)
    }
  }

  const tryCreateNotionPage = (id: string, currentPodcasts: Podcast[]) => {
    const podcast = currentPodcasts.find((p) => p.id === id)
    if (podcast && !podcast.notion_page_created) {
      const supabase = createClient()
      createNotionPage(id, podcast, supabase)
    }
  }

  const handleStartWatching = async (id: string) => {
    const supabase = createClient()

    // 1. 現在視聴中のものをすべて解除
    await supabase
      .from("podcasts")
      .update({ is_watching: false })
      .eq("user_id", userId)
      .eq("is_watching", true)

    // 2. 対象を視聴中に設定（watched_atも設定）
    const watched_at = new Date().toISOString()
    const { error } = await supabase.from("podcasts").update({ is_watching: true, watched_at }).eq("id", id)

    if (error) {
      console.error("[v0] 視聴中設定エラー:", error)
    } else {
      // 3. キャッシュ更新
      const updated = podcasts.map((p) => ({
        ...p,
        is_watching: p.id === id,
        ...(p.id === id && { watched_at }),
      }))
      mutate(updated, false)

      // 4. Google Drive/Notionファイル作成（バックグラウンド実行）
      tryCreateGoogleDriveFile(id, updated)
      tryCreateNotionPage(id, updated)
    }
  }

  const createGoogleDriveFile = async (
    id: string,
    podcast: Podcast,
    supabase: ReturnType<typeof createClient>
  ) => {
    try {
      const response = await fetch("/api/google-drive/create-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: podcast.title || podcast.url,
          url: podcast.url,
          description: podcast.description || "",
          platform: podcast.platform || "その他",
          show_name: podcast.show_name || undefined,
          tags: podcast.tags.length > 0 ? podcast.tags : undefined,
          speakers: podcast.speakers.length > 0 ? podcast.speakers : undefined,
          summary: podcast.summary || undefined,
          thumbnail_url: podcast.thumbnail_url || undefined,
          watched_at: podcast.watched_at || undefined,
        }),
      })

      if (response.ok) {
        // Google Driveファイル作成成功時、フラグを更新
        await supabase.from("podcasts").update({ google_drive_file_created: true }).eq("id", id)

        mutate(
          (current = []) => current.map((p) => (p.id === id ? { ...p, google_drive_file_created: true } : p)),
          false
        )
      } else {
        const data = await response.json()
        // 再認証が必要な場合はトースト通知
        if (data.code === "REAUTH_REQUIRED") {
          toast.error("Google Driveの再認証が必要です", {
            description: (
              <>
                設定ページから再度連携してください。
                <Link href="/settings?reauth=required" className="underline ml-1">
                  設定ページへ
                </Link>
              </>
            ),
            duration: 10000,
          })
        }
      }
    } catch (err) {
      console.error("Google Driveファイル作成エラー:", err)
      // エラーでも視聴中操作自体は成功させる
    }
  }

  const createNotionPage = async (
    id: string,
    podcast: Podcast,
    supabase: ReturnType<typeof createClient>
  ) => {
    try {
      const response = await fetch("/api/notion/create-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: podcast.title || podcast.url,
          url: podcast.url,
          description: podcast.description || "",
          platform: podcast.platform || "その他",
          show_name: podcast.show_name || undefined,
          tags: podcast.tags.length > 0 ? podcast.tags : undefined,
          speakers: podcast.speakers.length > 0 ? podcast.speakers : undefined,
          summary: podcast.summary || undefined,
          thumbnail_url: podcast.thumbnail_url || undefined,
          watched_at: podcast.watched_at || undefined,
        }),
      })

      if (response.ok) {
        await supabase.from("podcasts").update({ notion_page_created: true }).eq("id", id)

        mutate(
          (current = []) => current.map((p) => (p.id === id ? { ...p, notion_page_created: true } : p)),
          false
        )
      }
    } catch (err) {
      console.error("Notionページ作成エラー:", err)
      // エラーでも視聴中・視聴済み操作自体は成功させる
    }
  }

  const handleRegenerateAI = async (id: string) => {
    const response = await fetch("/api/generate-tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ podcastId: id }),
    })

    if (!response.ok) throw new Error("AI再生成に失敗しました")

    const { tags, speakers, summary } = await response.json()

    mutate(
      podcasts.map((p) => (p.id === id ? { ...p, tags, speakers, summary } : p)),
      false
    )

    return { tags, speakers, summary }
  }

  const handleUpdatePodcast = async (
    id: string,
    updates: {
      title?: string | null
      description?: string | null
      thumbnail_url?: string | null
      platform?: Platform | null
      show_name?: string | null
    }
  ) => {
    const supabase = createClient()

    const { error } = await supabase.from("podcasts").update(updates).eq("id", id)

    if (error) {
      console.error("[v0] Podcast更新エラー:", error)
      throw error
    } else {
      mutate(
        podcasts.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        false
      )
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 視聴状態フィルタ */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          <Button variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>
            すべて ({podcasts.length})
          </Button>
          <Button
            variant={filter === "unwatched" ? "default" : "outline"}
            onClick={() => setFilter("unwatched")}
          >
            未視聴 ({podcasts.filter((p) => !p.is_watched).length})
          </Button>
          <Button variant={filter === "watched" ? "default" : "outline"} onClick={() => setFilter("watched")}>
            視聴済み ({podcasts.filter((p) => p.is_watched).length})
          </Button>
        </div>

        {/* View mode toggle buttons */}
        <div className="flex items-center gap-2 justify-end">
          <Button
            size="sm"
            variant={viewMode === "grid" ? "default" : "outline"}
            onClick={() => handleViewModeChange("grid")}
            title="グリッド表示"
            aria-label="グリッド表示に切り替え"
          >
            <Grid3x3 className="size-4" />
          </Button>
          <Button
            size="sm"
            variant={viewMode === "list" ? "default" : "outline"}
            onClick={() => handleViewModeChange("list")}
            title="リスト表示"
            aria-label="リスト表示に切り替え"
          >
            <List className="size-4" />
          </Button>
          <CsvExportDialog podcasts={podcasts} />
        </div>
      </div>

      {/* 優先度フィルタ・並び替え */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-sm text-muted-foreground whitespace-nowrap">優先度:</span>
          <Button
            size="sm"
            variant={priorityFilter === "all" ? "default" : "outline"}
            onClick={() => setPriorityFilter("all")}
          >
            すべて
          </Button>
          <Button
            size="sm"
            variant={priorityFilter === "high" ? "default" : "outline"}
            onClick={() => setPriorityFilter("high")}
          >
            {getPriorityLabel("high")}
          </Button>
          <Button
            size="sm"
            variant={priorityFilter === "medium" ? "default" : "outline"}
            onClick={() => setPriorityFilter("medium")}
          >
            {getPriorityLabel("medium")}
          </Button>
          <Button
            size="sm"
            variant={priorityFilter === "low" ? "default" : "outline"}
            onClick={() => setPriorityFilter("low")}
          >
            {getPriorityLabel("low")}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">並び替え:</span>
          <Button
            size="sm"
            variant={sortBy === "created_at" ? "default" : "outline"}
            onClick={() => setSortBy("created_at")}
          >
            追加日順
          </Button>
          <Button
            size="sm"
            variant={sortBy === "priority" ? "default" : "outline"}
            onClick={() => setSortBy("priority")}
          >
            <ArrowUpDown className="size-3 mr-1" />
            優先度順
          </Button>
        </div>
      </div>

      {filteredPodcasts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {filter === "all"
              ? "まだPodcastが登録されていません"
              : `${filter === "watched" ? "視聴済み" : "未視聴"}のPodcastがありません`}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredPodcasts.map((podcast) => (
            <PodcastCard
              key={podcast.id}
              podcast={podcast}
              onToggleWatched={handleToggleWatched}
              onDelete={handleDelete}
              onChangePriority={handleChangePriority}
              onStartWatching={handleStartWatching}
              onUpdate={handleUpdatePodcast}
              onChangeWatchedStatus={handleChangeWatchedStatus}
              onRegenerateAI={handleRegenerateAI}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPodcasts.map((podcast) => (
            <PodcastListItem
              key={podcast.id}
              podcast={podcast}
              onToggleWatched={handleToggleWatched}
              onDelete={handleDelete}
              onChangePriority={handleChangePriority}
              onStartWatching={handleStartWatching}
              onUpdate={handleUpdatePodcast}
              onChangeWatchedStatus={handleChangeWatchedStatus}
              onRegenerateAI={handleRegenerateAI}
            />
          ))}
        </div>
      )}
    </div>
  )
}
