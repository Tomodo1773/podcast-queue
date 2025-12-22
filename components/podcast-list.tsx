"use client"

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { PodcastCard } from "@/components/podcast-card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

type Podcast = {
  id: string
  url: string
  title: string | null
  description: string | null
  thumbnail_url: string | null
  platform: string | null
  is_watched: boolean
  created_at: string
}

type PodcastListProps = {
  userId: string
}

export function PodcastList({ userId }: PodcastListProps) {
  const [podcasts, setPodcasts] = useState<Podcast[]>([])
  const [filteredPodcasts, setFilteredPodcasts] = useState<Podcast[]>([])
  const [filter, setFilter] = useState<"all" | "watched" | "unwatched">("all")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadPodcasts()
  }, [userId])

  useEffect(() => {
    applyFilter()
  }, [filter, podcasts])

  const loadPodcasts = async () => {
    const supabase = createClient()
    setIsLoading(true)

    const { data, error } = await supabase
      .from("podcasts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Podcastの読み込みエラー:", error)
    } else {
      setPodcasts(data || [])
    }
    setIsLoading(false)
  }

  const applyFilter = () => {
    if (filter === "all") {
      setFilteredPodcasts(podcasts)
    } else if (filter === "watched") {
      setFilteredPodcasts(podcasts.filter((p) => p.is_watched))
    } else {
      setFilteredPodcasts(podcasts.filter((p) => !p.is_watched))
    }
  }

  const handleToggleWatched = async (id: string, currentStatus: boolean) => {
    const supabase = createClient()

    const { error } = await supabase.from("podcasts").update({ is_watched: !currentStatus }).eq("id", id)

    if (error) {
      console.error("[v0] ステータス更新エラー:", error)
    } else {
      setPodcasts((prev) => prev.map((p) => (p.id === id ? { ...p, is_watched: !currentStatus } : p)))
    }
  }

  const handleDelete = async (id: string) => {
    const supabase = createClient()

    const { error } = await supabase.from("podcasts").delete().eq("id", id)

    if (error) {
      console.error("[v0] 削除エラー:", error)
    } else {
      setPodcasts((prev) => prev.filter((p) => p.id !== id))
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
      <div className="flex items-center gap-2">
        <Button variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>
          すべて ({podcasts.length})
        </Button>
        <Button variant={filter === "unwatched" ? "default" : "outline"} onClick={() => setFilter("unwatched")}>
          未視聴 ({podcasts.filter((p) => !p.is_watched).length})
        </Button>
        <Button variant={filter === "watched" ? "default" : "outline"} onClick={() => setFilter("watched")}>
          視聴済み ({podcasts.filter((p) => p.is_watched).length})
        </Button>
      </div>

      {filteredPodcasts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {filter === "all"
              ? "まだPodcastが登録されていません"
              : `${filter === "watched" ? "視聴済み" : "未視聴"}のPodcastがありません`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPodcasts.map((podcast) => (
            <PodcastCard
              key={podcast.id}
              podcast={podcast}
              onToggleWatched={handleToggleWatched}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
