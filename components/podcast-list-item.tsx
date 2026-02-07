"use client"

import { ArrowUpDown, Check, Copy, Edit, ExternalLink, MoreVertical, Trash2, X } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import { PodcastDialog } from "@/components/podcast-dialog"
import { PodcastEditDialog } from "@/components/podcast-edit-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
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
  show_name: string | null
  tags: string[]
  speakers: string[]
  summary: string | null
}

type PodcastListItemProps = {
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
  onChangeWatchedStatus: (id: string, newStatus: boolean) => Promise<void>
}

export function PodcastListItem({
  podcast,
  onToggleWatched,
  onDelete,
  onChangePriority,
  onStartWatching,
  onUpdate,
  onChangeWatchedStatus,
}: PodcastListItemProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const { isCopied, copyToClipboard } = useCopyToClipboard()

  const handleClick = () => {
    setIsDialogOpen(true)
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      setIsDialogOpen(true)
    }
  }

  const handleOpenLink = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // 先に動画を開く
    window.open(podcast.url, "_blank", "noopener,noreferrer")
    // バックグラウンドで視聴中処理を実行（awaitしない）
    onStartWatching(podcast.id)
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

  const handleCopyLink = () => {
    copyToClipboard(podcast.url)
  }

  return (
    <>
      <div
        className={`flex gap-3 p-3 sm:p-4 border rounded-lg cursor-pointer hover:shadow-md hover:border-primary/30 transition-all ${podcast.is_watching ? "bg-primary/10" : "bg-card"}`}
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        {/* Left side: Thumbnail */}
        <div className="flex-shrink-0 relative">
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
          {/* 視聴中ラベル */}
          {podcast.is_watching && (
            <Badge className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs">視聴中</Badge>
          )}
        </div>

        {/* Right side: Content */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Title row with menu */}
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold line-clamp-2 text-pretty text-sm sm:text-base">
                {podcast.title || "タイトルなし"}
              </h3>
              {podcast.show_name && (
                <p className="text-xs text-muted-foreground mt-0.5">{podcast.show_name}</p>
              )}
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
                <DropdownMenuItem onClick={handleCopyLink}>
                  {isCopied ? <Check className="mr-2 size-4" /> : <Copy className="mr-2 size-4" />}
                  リンクをコピー
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
          </div>

          {/* Platform and priority badges */}
          <div className="flex items-center gap-1 mt-1 flex-wrap">
            {podcast.platform && (
              <Badge className={getPlatformColor(podcast.platform)} variant="default">
                <span className="text-xs">{getPlatformLabel(podcast.platform)}</span>
              </Badge>
            )}
            <Badge className={getPriorityColor(podcast.priority)} variant="default">
              <span className="text-xs">{getPriorityLabel(podcast.priority)}</span>
            </Badge>
          </div>

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
        onDelete={onDelete}
        onChangePriority={onChangePriority}
        onStartWatching={onStartWatching}
        onChangeWatchedStatus={onChangeWatchedStatus}
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
