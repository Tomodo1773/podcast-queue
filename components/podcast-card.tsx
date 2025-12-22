"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, ExternalLink, Trash2, X } from "lucide-react"
import Image from "next/image"

type Podcast = {
  id: string
  url: string
  title: string | null
  description: string | null
  thumbnail_url: string | null
  platform: string | null
  is_watched: boolean
}

type PodcastCardProps = {
  podcast: Podcast
  onToggleWatched: (id: string, currentStatus: boolean) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function PodcastCard({ podcast, onToggleWatched, onDelete }: PodcastCardProps) {
  const getPlatformColor = (platform: string | null) => {
    if (!platform) return "bg-gray-500"
    const platformLower = platform.toLowerCase()
    if (platformLower.includes("youtube")) return "bg-red-500"
    if (platformLower.includes("spotify")) return "bg-green-500"
    if (platformLower.includes("newspicks")) return "bg-blue-500"
    if (platformLower.includes("pivot")) return "bg-purple-500"
    return "bg-gray-500"
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="p-0">
        {podcast.thumbnail_url ? (
          <div className="relative w-full aspect-video">
            <Image
              src={podcast.thumbnail_url || "/placeholder.svg"}
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
      </CardHeader>
      <CardContent className="flex-1 p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold line-clamp-2 text-pretty">{podcast.title || "タイトルなし"}</h3>
          {podcast.platform && (
            <Badge className={getPlatformColor(podcast.platform)} variant="default">
              {podcast.platform}
            </Badge>
          )}
        </div>
        {podcast.description && <p className="text-sm text-muted-foreground line-clamp-3">{podcast.description}</p>}
      </CardContent>
      <CardFooter className="p-4 pt-0 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={podcast.is_watched ? "default" : "outline"}
            onClick={() => onToggleWatched(podcast.id, podcast.is_watched)}
          >
            {podcast.is_watched ? (
              <>
                <Check className="mr-1 size-4" />
                視聴済み
              </>
            ) : (
              <>
                <X className="mr-1 size-4" />
                未視聴
              </>
            )}
          </Button>
          <Button size="sm" variant="outline" asChild>
            <a href={podcast.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-4" />
            </a>
          </Button>
        </div>
        <Button size="sm" variant="ghost" onClick={() => onDelete(podcast.id)}>
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </CardFooter>
    </Card>
  )
}
