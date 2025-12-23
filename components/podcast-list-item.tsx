"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PodcastDialog } from "@/components/podcast-dialog"
import { Check, ExternalLink, MoreVertical, Trash2, X } from "lucide-react"
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

  const handleDelete = async () => {
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
        className="flex gap-3 p-3 sm:p-4 border rounded-lg cursor-pointer hover:shadow-md transition-shadow bg-card"
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        {/* Left side: Thumbnail */}
        <div className="flex-shrink-0">
          {podcast.thumbnail_url ? (
            <div className="relative w-32 sm:w-40 md:w-48 aspect-video">
              <Image
                src={podcast.thumbnail_url}
                alt={podcast.title || "Podcast thumbnail"}
                fill
                className="object-cover rounded-lg"
              />
            </div>
          ) : (
            <div className="w-32 sm:w-40 md:w-48 aspect-video bg-muted flex items-center justify-center rounded-lg">
              <span className="text-xs sm:text-sm text-muted-foreground">サムネイルなし</span>
            </div>
          )}
        </div>

        {/* Right side: Content */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Title row with menu */}
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold line-clamp-2 text-pretty text-sm sm:text-base">{podcast.title || "タイトルなし"}</h3>
            </div>
            {/* 3-dot menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                  <MoreVertical className="size-4" />
                  <span className="sr-only">メニューを開く</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={() => onToggleWatched(podcast.id, podcast.is_watched)}>
                  {podcast.is_watched ? (
                    <>
                      <X className="mr-2 size-4" />
                      未視聴にする
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 size-4" />
                      視聴済みにする
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href={podcast.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 size-4" />
                    リンクを開く
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                  <Trash2 className="mr-2 size-4" />
                  削除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Platform badge */}
          {podcast.platform && (
            <Badge className={`${getPlatformColor(podcast.platform)} mt-1 w-fit`} variant="default">
              <span className="text-xs">{podcast.platform}</span>
            </Badge>
          )}

          {/* Description */}
          {podcast.description && (
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mt-1">
              {podcast.description}
            </p>
          )}
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
