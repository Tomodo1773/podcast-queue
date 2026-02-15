"use client"

import { MoreVertical } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import { PodcastActionsMenu } from "@/components/podcast-actions-menu"
import { PodcastDialog } from "@/components/podcast-dialog"
import { PodcastEditDialog } from "@/components/podcast-edit-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Podcast } from "@/lib/types"
import {
  getPlatformColor,
  getPlatformLabel,
  getPriorityColor,
  getPriorityLabel,
  type Platform,
  type Priority,
} from "@/lib/utils"

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

  const handleClick = () => {
    setIsDialogOpen(true)
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      setIsDialogOpen(true)
    }
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
              <PodcastActionsMenu
                podcast={podcast}
                onToggleWatched={onToggleWatched}
                onDelete={onDelete}
                onChangePriority={onChangePriority}
                onStartWatching={onStartWatching}
                onEditClick={() => setIsEditDialogOpen(true)}
              />
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
