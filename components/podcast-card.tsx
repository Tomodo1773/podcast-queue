"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  watched_at: string | null
}

type PodcastCardProps = {
  podcast: Podcast
  onToggleWatched: (id: string, currentStatus: boolean) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function PodcastCard({ podcast, onToggleWatched, onDelete }: PodcastCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

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
      <Card className="flex flex-col h-full cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all gap-0" onClick={() => setIsDialogOpen(true)}>
        <CardHeader className="p-0 relative">
          {podcast.thumbnail_url ? (
            <div className="relative w-full aspect-video">
              <Image
                src={podcast.thumbnail_url}
                alt={podcast.title || "Podcast thumbnail"}
                fill
                className="object-cover rounded-t-lg"
              />
            </div>
          ) : (
            <div className="w-full aspect-video bg-muted flex items-center justify-center rounded-t-lg">
              <span className="text-muted-foreground">サムネイルなし</span>
            </div>
          )}
          {/* 3-dot menu on thumbnail */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="secondary"
                size="sm"
                className="absolute top-2 right-2 h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white"
              >
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
        </CardHeader>
        <CardContent className="flex-1 px-4 pt-3 pb-4">
          <h3 className="font-semibold line-clamp-2 text-pretty mb-1">{podcast.title || "タイトルなし"}</h3>
          {podcast.platform && (
            <Badge className={`${getPlatformColor(podcast.platform)} mb-2`} variant="default">
              {podcast.platform}
            </Badge>
          )}
          {podcast.description && <p className="text-sm text-muted-foreground line-clamp-3">{podcast.description}</p>}
        </CardContent>
      </Card>

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
