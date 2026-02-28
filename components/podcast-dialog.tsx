"use client"

import { Check, ChevronDown, Copy, Loader2, Play, Sparkles, Trash2 } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"
import { PodcastTags } from "@/components/podcast-tags"
import { SimpleMarkdown } from "@/components/simple-markdown"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import { showAIGenerateToasts } from "@/lib/ai-toast"
import type { Podcast, PodcastStatus } from "@/lib/types"
import {
  getPlatformColor,
  getPlatformLabel,
  getPriorityColor,
  getPriorityLabel,
  type Priority,
} from "@/lib/utils"

const STATUS_LABELS: Record<PodcastStatus, string> = {
  unwatched: "未視聴",
  watching: "視聴中",
  watched: "視聴済み",
}

type PodcastDialogProps = {
  podcast: Podcast
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete: (id: string) => Promise<void>
  onChangePriority: (id: string, newPriority: Priority) => Promise<void>
  onStartWatching: (id: string) => Promise<void>
  onChangeWatchedStatus: (id: string, newStatus: PodcastStatus) => Promise<void>
  onRegenerateAI: (id: string) => Promise<{ summary: string | null }>
}

const DESCRIPTION_MAX_LENGTH_MOBILE = 70
const DESCRIPTION_MAX_LENGTH_DESKTOP = 200
const MOBILE_BREAKPOINT = 768

export function PodcastDialog({
  podcast,
  open,
  onOpenChange,
  onDelete,
  onChangePriority,
  onStartWatching,
  onChangeWatchedStatus,
  onRegenerateAI,
}: PodcastDialogProps) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false)
  const [maxLength, setMaxLength] = useState(DESCRIPTION_MAX_LENGTH_DESKTOP)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const { isCopied, copyToClipboard } = useCopyToClipboard()

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

  const summary = podcast.summary || ""
  const isLongSummary = summary.length > maxLength
  const displayedSummary = isSummaryExpanded || !isLongSummary ? summary : summary.slice(0, maxLength)

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setIsDescriptionExpanded(false)
      setIsSummaryExpanded(false)
    }
    onOpenChange(newOpen)
  }

  const handleOpenLink = async (e: React.MouseEvent) => {
    e.preventDefault()
    await onStartWatching(podcast.id)
    window.open(podcast.url, "_blank", "noopener,noreferrer")
  }

  const handleCopyLink = () => {
    copyToClipboard(podcast.url)
  }

  const handleRegenerate = () => {
    setIsRegenerating(true)
    const promise = onRegenerateAI(podcast.id).finally(() => setIsRegenerating(false))
    showAIGenerateToasts(promise, podcast.platform, "regenerate")
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
        <div className="min-w-0 space-y-4">
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-1 hover:opacity-80 transition-opacity focus:outline-none"
                  >
                    <Badge variant={podcast.status === "watched" ? "default" : "outline"}>
                      {STATUS_LABELS[podcast.status]}
                    </Badge>
                    <ChevronDown className="size-3 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {(["unwatched", "watching", "watched"] as PodcastStatus[]).map((s) => (
                    <DropdownMenuItem
                      key={s}
                      onClick={() => onChangeWatchedStatus(podcast.id, s)}
                      disabled={podcast.status === s}
                    >
                      {STATUS_LABELS[s]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {podcast.speakers && podcast.speakers.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm font-semibold text-muted-foreground">出演者:</span>
                <PodcastTags tags={podcast.speakers} />
              </div>
            )}
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
              <p id="podcast-description" className="text-sm whitespace-pre-wrap break-all">
                {displayedDescription}
                {isLongDescription && !isDescriptionExpanded && "..."}
              </p>
              {isLongDescription && (
                <button
                  type="button"
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  className="text-sm text-primary hover:underline"
                  aria-expanded={isDescriptionExpanded}
                  aria-controls="podcast-description"
                >
                  {isDescriptionExpanded ? "閉じる" : "もっと見る"}
                </button>
              )}
            </div>
          )}
          {podcast.platform === "youtube" && podcast.summary && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">動画内容（Gemini生成）:</h3>
              <div id="podcast-summary" className="text-sm">
                <SimpleMarkdown
                  text={displayedSummary + (isLongSummary && !isSummaryExpanded ? "..." : "")}
                  className="space-y-2"
                />
              </div>
              {isLongSummary && (
                <button
                  type="button"
                  onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
                  className="text-sm text-primary hover:underline"
                  aria-expanded={isSummaryExpanded}
                  aria-controls="podcast-summary"
                >
                  {isSummaryExpanded ? "閉じる" : "もっと見る"}
                </button>
              )}
            </div>
          )}
          <div className="flex flex-row gap-2 pt-4">
            <Button variant="outline" onClick={handleCopyLink} className="flex-1">
              {isCopied ? <Check className="mr-2 size-4" /> : <Copy className="mr-2 size-4" />}
              コピー
            </Button>
            <Button variant="outline" onClick={handleRegenerate} disabled={isRegenerating} className="flex-1">
              {isRegenerating ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 size-4" />
              )}
              {isRegenerating ? "生成中..." : "AI再生成"}
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
              className="flex-1"
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
