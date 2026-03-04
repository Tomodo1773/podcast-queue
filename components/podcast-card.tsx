"use client"

import { MoreVertical } from "lucide-react"
import Image from "next/image"
import { PodcastActionsMenu } from "@/components/podcast-actions-menu"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Podcast, PodcastStatus } from "@/lib/types"
import {
  getPlatformColor,
  getPlatformLabel,
  getPriorityColor,
  getPriorityLabel,
  type Priority,
} from "@/lib/utils"

type PodcastCardProps = {
  podcast: Podcast
  onToggleWatched: (id: string, currentStatus: PodcastStatus) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onChangePriority: (id: string, newPriority: Priority) => Promise<void>
  onStartWatching: (id: string) => Promise<void>
  onSelect: () => void
  onEditSelect: () => void
}

export function PodcastCard({
  podcast,
  onToggleWatched,
  onDelete,
  onChangePriority,
  onStartWatching,
  onSelect,
  onEditSelect,
}: PodcastCardProps) {
  return (
    <Card
      className={`flex flex-col h-full cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all gap-0 ${podcast.status === "watching" ? "bg-primary/10" : ""}`}
      onClick={onSelect}
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
        {podcast.status === "watching" && (
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
          <PodcastActionsMenu
            podcast={podcast}
            onToggleWatched={onToggleWatched}
            onDelete={onDelete}
            onChangePriority={onChangePriority}
            onStartWatching={onStartWatching}
            onEditClick={onEditSelect}
          />
        </DropdownMenu>
      </CardHeader>
      <CardContent className="flex-1 px-4 pt-3 pb-4">
        <h3 className="font-semibold line-clamp-2 text-pretty mb-1">{podcast.title || "タイトルなし"}</h3>
        {podcast.show_name && <p className="text-xs text-muted-foreground mb-1">{podcast.show_name}</p>}
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
          <p className="text-sm text-muted-foreground line-clamp-3 mb-2">{podcast.description}</p>
        )}
      </CardContent>
    </Card>
  )
}
