"use client"

import { Check, ChevronDown, ChevronUp, ExternalLink, Play, Trash2, X } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
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

type PodcastDialogProps = {
  podcast: Podcast
  open: boolean
  onOpenChange: (open: boolean) => void
  onToggleWatched: (id: string, currentStatus: boolean) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onChangePriority: (id: string, newPriority: Priority) => Promise<void>
  onStartWatching: (id: string) => Promise<void>
  onUpdateNotes: (id: string, notes: string) => Promise<void>
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
  onUpdateNotes,
}: PodcastDialogProps) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  const [maxLength, setMaxLength] = useState(DESCRIPTION_MAX_LENGTH_DESKTOP)
  const [isNotesOpen, setIsNotesOpen] = useState(false)
  const [notesValue, setNotesValue] = useState(podcast.notes || "")
  const [isSaving, setIsSaving] = useState(false)
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null)

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

  // メモが存在する場合は初期状態で展開
  useEffect(() => {
    if (podcast.notes) {
      setIsNotesOpen(true)
    }
    setNotesValue(podcast.notes || "")
  }, [podcast.notes])

  // メモの自動保存（debounce）
  useEffect(() => {
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }

    const timeout = setTimeout(async () => {
      if (notesValue !== podcast.notes) {
        setIsSaving(true)
        try {
          await onUpdateNotes(podcast.id, notesValue)
        } catch (error) {
          console.error("メモの保存に失敗しました:", error)
        } finally {
          setIsSaving(false)
        }
      }
    }, 1000)

    setSaveTimeout(timeout)

    return () => {
      if (timeout) {
        clearTimeout(timeout)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notesValue])

  const description = podcast.description || ""
  const isLongDescription = description.length > maxLength
  const displayedDescription =
    isDescriptionExpanded || !isLongDescription ? description : description.slice(0, maxLength)

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setIsDescriptionExpanded(false)
      setIsNotesOpen(false)
    }
    onOpenChange(newOpen)
  }

  const handleOpenLink = async (e: React.MouseEvent) => {
    e.preventDefault()
    await onStartWatching(podcast.id)
    window.open(podcast.url, "_blank", "noopener,noreferrer")
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-xl pr-8 line-clamp-3 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            {podcast.title || "タイトルなし"}
          </DialogTitle>
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
          <Collapsible open={isNotesOpen} onOpenChange={setIsNotesOpen} className="space-y-2">
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                {isNotesOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                学びのメモ
                {podcast.notes && !isNotesOpen && (
                  <Badge variant="secondary" className="ml-1">
                    あり
                  </Badge>
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2">
              <Textarea
                placeholder="動画から学んだことや気づきをメモしましょう..."
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                className="min-h-[120px] resize-y"
              />
              {isSaving && <p className="text-xs text-muted-foreground">保存中...</p>}
              {!isSaving && notesValue !== podcast.notes && (
                <p className="text-xs text-muted-foreground">変更を保存しています...</p>
              )}
            </CollapsibleContent>
          </Collapsible>
          <div className="flex items-center gap-2 pt-4">
            <Button
              variant={podcast.is_watched ? "default" : "outline"}
              onClick={() => onToggleWatched(podcast.id, podcast.is_watched)}
            >
              {podcast.is_watched ? (
                <>
                  <Check className="mr-2 size-4" />
                  視聴済み
                </>
              ) : (
                <>
                  <X className="mr-2 size-4" />
                  未視聴
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleOpenLink}>
              <ExternalLink className="mr-2 size-4" />
              開く
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
