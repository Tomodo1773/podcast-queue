"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PodcastDialog } from "@/components/podcast-dialog"
import { Check, ExternalLink, Trash2, X } from "lucide-react"
import Image from "next/image"
import { getPlatformColor } from "@/lib/utils"

type Podcast = {
  id: string
  url: string
  title: string | null
  description: string | null
  thumbnail_url: string | null
  platform: string | null
  is_watched: boolean
}

type PodcastListItemProps = {
  podcast: Podcast
  onToggleWatched: (id: string, currentStatus: boolean) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function PodcastListItem({ podcast, onToggleWatched, onDelete }: PodcastListItemProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleClick = () => {
    setIsDialogOpen(true)
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      setIsDialogOpen(true)
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const confirmed = window.confirm("このポッドキャストを削除してもよろしいですか？この操作は取り消せません。")
    if (!confirmed) return
    try {
      await onDelete(podcast.id)
    } catch (error) {
      console.error("ポッドキャストの削除に失敗しました:", error)
    }
  }

  return (
    <>
      <div 
        className="flex gap-4 p-4 border rounded-lg cursor-pointer hover:shadow-md transition-shadow bg-card"
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        {/* Left side: Thumbnail */}
        <div className="flex-shrink-0">
          {podcast.thumbnail_url ? (
            <div className="relative w-32 md:w-48 aspect-video">
              <Image
                src={podcast.thumbnail_url}
                alt={podcast.title || "Podcast thumbnail"}
                fill
                className="object-cover rounded-lg"
              />
            </div>
          ) : (
            <div className="w-32 md:w-48 aspect-video bg-muted flex items-center justify-center rounded-lg">
              <span className="text-sm text-muted-foreground">サムネイルなし</span>
            </div>
          )}
        </div>

        {/* Right side: Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          {/* Top section: Title and Platform */}
          <div>
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold line-clamp-2 text-pretty">{podcast.title || "タイトルなし"}</h3>
              {podcast.platform && (
                <Badge className={getPlatformColor(podcast.platform)} variant="default">
                  {podcast.platform}
                </Badge>
              )}
            </div>
            {podcast.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {podcast.description}
              </p>
            )}
          </div>

          {/* Bottom section: Action buttons */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={podcast.is_watched ? "default" : "outline"}
              onClick={(e) => {
                e.stopPropagation()
                onToggleWatched(podcast.id, podcast.is_watched)
              }}
            >
              {podcast.is_watched ? (
                <>
                  <Check className="mr-1 size-4" />
                  視聴済み
                </>
              ) : (
                <>
                  <X className="mr-1 size-4" />
                  未視聴
                </>
              )}
            </Button>
            <Button size="sm" variant="outline" asChild>
              <a href={podcast.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                <ExternalLink className="size-4" />
              </a>
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDelete}>
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        </div>
      </div>

      <PodcastDialog
        podcast={podcast}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onToggleWatched={onToggleWatched}
        onDelete={onDelete}
      />
    </>
  )
}
