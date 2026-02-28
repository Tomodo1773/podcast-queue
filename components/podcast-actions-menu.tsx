"use client"

import { ArrowUpDown, Check, Copy, Edit, ExternalLink, Trash2, X } from "lucide-react"
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import type { Podcast, PodcastStatus } from "@/lib/types"
import { getPriorityLabel, type Priority } from "@/lib/utils"

type PodcastActionsMenuProps = {
  podcast: Podcast
  onToggleWatched: (id: string, currentStatus: PodcastStatus) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onChangePriority: (id: string, newPriority: Priority) => Promise<void>
  onStartWatching: (id: string) => Promise<void>
  onEditClick: () => void
}

export function PodcastActionsMenu({
  podcast,
  onToggleWatched,
  onDelete,
  onChangePriority,
  onStartWatching,
  onEditClick,
}: PodcastActionsMenuProps) {
  const { isCopied, copyToClipboard } = useCopyToClipboard()

  const handleOpenLink = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    window.open(podcast.url, "_blank", "noopener,noreferrer")
    onStartWatching(podcast.id)
  }

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "このポッドキャストを削除してもよろしいですか?この操作は取り消せません。"
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
    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
      <DropdownMenuItem onClick={onEditClick}>
        <Edit className="mr-2 size-4" />
        編集
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => onToggleWatched(podcast.id, podcast.status)}>
        {podcast.status === "watched" ? (
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
  )
}
