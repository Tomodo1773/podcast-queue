"use client"

import { Check, ChevronDown, Copy, ExternalLink, Play, Trash2, X } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"
import { PodcastTags } from "@/components/podcast-tags"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  show_name: string | null
  tags: string[]
}

type PodcastDialogProps = {
  podcast: Podcast
  open: boolean
  onOpenChange: (open: boolean) => void
  onToggleWatched: (id: string, currentStatus: boolean) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onChangePriority: (id: string, newPriority: Priority) => Promise<void>
  onStartWatching: (id: string) => Promise<void>
}

const DESCRIPTION_MAX_LENGTH_MOBILE = 70
const DESCRIPTION_MAX_LENGTH_DESKTOP = 200
const MOBILE_BREAKPOINT = 768

export function PodcastDialog({
  podcast,
  open,
  onOpenChange,
  onToggleWatched,
  onDelete,
  onChangePriority,
  onStartWatching,
}: PodcastDialogProps) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  const [maxLength, setMaxLength] = useState(DESCRIPTION_MAX_LENGTH_DESKTOP)
  const [isCopied, setIsCopied] = useState(false)

  useEffect(() => {
    const updateMaxLength = () => {
      setMaxLength(
        window.innerWidth < MOBILE_BREAKPOINT ? DESCRIPTION_MAX_LENGTH_MOBILE : DESCRIPTION_MAX_LENGTH_DESKTOP
      )
    }
    updateMaxLength()
    window.addEventListener("resize", updateMaxLength)
    return () => window.removeEventListener("resize", updateMaxLength)
  }, [])

  const description = podcast.description || ""
  const isLongDescription = description.length > maxLength
  const displayedDescription =
    isDescriptionExpanded || !isLongDescription ? description : description.slice(0, maxLength)

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setIsDescriptionExpanded(false)
    }
    onOpenChange(newOpen)
  }

  const handleOpenLink = async (e: React.MouseEvent) => {
    e.preventDefault()
    await onStartWatching(podcast.id)
    window.open(podcast.url, "_blank", "noopener,noreferrer")
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(podcast.url)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 1500)
    } catch (error) {
      console.error("クリップボードへのコピーに失敗しました:", error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-xl pr-8 line-clamp-3 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            {podcast.title || "タイトルなし"}
          </DialogTitle>
          {podcast.show_name && <p className="text-sm text-muted-foreground mt-1">{podcast.show_name}</p>}
        </DialogHeader>
        <div className="space-y-4">
          {podcast.thumbnail_url && (
            <button
              type="button"
              onClick={handleOpenLink}
              className="group relative block w-full aspect-video cursor-pointer"
            >
              <Image
                src={podcast.thumbnail_url}
                alt={podcast.title || "Podcast thumbnail"}
                fill
                className="object-cover rounded-lg transition-opacity group-hover:opacity-80"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-black/50 text-white transition-transform group-hover:scale-110">
                  <Play className="size-8 ml-1" fill="currentColor" />
                </div>
              </div>
            </button>
          )}
          <div className="space-y-2">
            {podcast.platform && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-muted-foreground">プラットフォーム:</span>
                <Badge className={getPlatformColor(podcast.platform)} variant="default">
                  {getPlatformLabel(podcast.platform)}
                </Badge>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-muted-foreground">優先度:</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-1 hover:opacity-80 transition-opacity focus:outline-none"
                  >
                    <Badge className={getPriorityColor(podcast.priority)} variant="default">
                      {getPriorityLabel(podcast.priority)}
                    </Badge>
                    <ChevronDown className="size-3 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
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
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-muted-foreground">ステータス:</span>
              <Badge variant={podcast.is_watched ? "default" : "outline"}>
                {podcast.is_watched ? "視聴済み" : "未視聴"}
              </Badge>
            </div>
            {podcast.tags && podcast.tags.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm font-semibold text-muted-foreground">タグ:</span>
                <PodcastTags tags={podcast.tags} />
              </div>
            )}
          </div>
          {podcast.description && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">説明:</h3>
              <p className="text-sm whitespace-pre-wrap">
                {displayedDescription}
                {isLongDescription && !isDescriptionExpanded && "..."}
              </p>
              {isLongDescription && (
                <button
                  type="button"
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  className="text-sm text-primary hover:underline"
                >
                  {isDescriptionExpanded ? "閉じる" : "もっと見る"}
                </button>
              )}
            </div>
          )}
          <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 pt-4">
            <Button
              variant={podcast.is_watched ? "default" : "outline"}
              onClick={() => onToggleWatched(podcast.id, podcast.is_watched)}
              className="w-full sm:w-auto"
            >
              {podcast.is_watched ? (
                <>
                  <Check className="mr-2 size-4" />
                  <span className="hidden sm:inline">視聴済み</span>
                  <span className="sm:hidden">済</span>
                </>
              ) : (
                <>
                  <X className="mr-2 size-4" />
                  <span className="hidden sm:inline">未視聴</span>
                  <span className="sm:hidden">未</span>
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleOpenLink} className="w-full sm:w-auto">
              <ExternalLink className="mr-2 size-4" />
              開く
            </Button>
            <Button variant="outline" onClick={handleCopyLink} className="w-full sm:w-auto">
              {isCopied ? <Check className="mr-2 size-4" /> : <Copy className="mr-2 size-4" />}
              コピー
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                try {
                  await onDelete(podcast.id)
                  onOpenChange(false)
                } catch (error) {
                  console.error("ポッドキャストの削除に失敗しました:", error)
                }
              }}
              className="w-full sm:w-auto"
            >
              <Trash2 className="mr-2 size-4" />
              削除
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
