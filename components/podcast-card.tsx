"use client"

import { ArrowUpDown, Check, Edit, ExternalLink, MoreVertical, Trash2, X } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import { PodcastDialog } from "@/components/podcast-dialog"
import { PodcastEditDialog } from "@/components/podcast-edit-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  getPlatformColor,
  getPlatformLabel,
  getPriorityColor,
  getPriorityLabel,
  type Platform,
  type Priority,
} from "@/lib/utils"

type Podcast = {
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
  notes: string | null
}

type PodcastCardProps = {
  podcast: Podcast
  onToggleWatched: (id: string, currentStatus: boolean) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onChangePriority: (id: string, newPriority: Priority) => Promise<void>
  onStartWatching: (id: string) => Promise<void>
  onUpdate: (
    id: string,
    updates: {
      title?: string | null
      description?: string | null
      thumbnail_url?: string | null
      platform?: Platform | null
    }
  ) => Promise<void>
  onUpdateNotes: (id: string, notes: string) => Promise<void>
}

export function PodcastCard({
  podcast,
  onToggleWatched,
  onDelete,
  onChangePriority,
  onStartWatching,
  onUpdate,
  onUpdateNotes,
}: PodcastCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const handleOpenLink = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    await onStartWatching(podcast.id)
    window.open(podcast.url, "_blank", "noopener,noreferrer")
  }

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "このポッドキャストを削除してもよろしいですか？この操作は取り消せません。"
    )
    if (!confirmed) return
    try {
      await onDelete(podcast.id)
    } catch (error) {
      console.error("ポッドキャストの削除に失敗しました:", error)
    }
  }

  return (
    <>
      <Card
        className={`flex flex-col h-full cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all gap-0 ${podcast.is_watching ? "bg-primary/10" : ""}`}
        onClick={() => setIsDialogOpen(true)}
      >
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
          {/* 視聴中ラベル */}
          {podcast.is_watching && (
            <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground">視聴中</Badge>
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
              <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                <Edit className="mr-2 size-4" />
                編集
              </DropdownMenuItem>
              <DropdownMenuSeparator />
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
              <DropdownMenuItem onClick={handleOpenLink}>
                <ExternalLink className="mr-2 size-4" />
                リンクを開く
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <ArrowUpDown className="mr-2 size-4" />
                  優先度を変更
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem
                    onClick={() => onChangePriority(podcast.id, "high")}
                    disabled={podcast.priority === "high"}
                  >
                    {getPriorityLabel("high")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onChangePriority(podcast.id, "medium")}
                    disabled={podcast.priority === "medium"}
                  >
                    {getPriorityLabel("medium")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onChangePriority(podcast.id, "low")}
                    disabled={podcast.priority === "low"}
                  >
                    {getPriorityLabel("low")}
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
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
          <div className="flex items-center gap-1 mb-2 flex-wrap">
            {podcast.platform && (
              <Badge className={getPlatformColor(podcast.platform)} variant="default">
                {getPlatformLabel(podcast.platform)}
              </Badge>
            )}
            <Badge className={getPriorityColor(podcast.priority)} variant="default">
              {getPriorityLabel(podcast.priority)}
            </Badge>
          </div>
          {podcast.description && (
            <p className="text-sm text-muted-foreground line-clamp-3">{podcast.description}</p>
          )}
        </CardContent>
      </Card>

      <PodcastDialog
        podcast={podcast}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onToggleWatched={onToggleWatched}
        onDelete={onDelete}
        onChangePriority={onChangePriority}
        onStartWatching={onStartWatching}
        onUpdateNotes={onUpdateNotes}
      />

      <PodcastEditDialog
        podcast={podcast}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onUpdate={onUpdate}
      />
    </>
  )
}
