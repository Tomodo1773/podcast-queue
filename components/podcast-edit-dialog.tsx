"use client"

import { Loader2 } from "lucide-react"
import type React from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { PLATFORM_OPTIONS, type Platform } from "@/lib/utils"

type PodcastEditDialogProps = {
  podcast: {
    id: string
    url: string
    title: string | null
    description: string | null
    thumbnail_url: string | null
    platform: Platform | null
  }
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (
    id: string,
    updates: {
      title?: string | null
      description?: string | null
      thumbnail_url?: string | null
      platform?: Platform | null
    }
  ) => Promise<void>
}

export function PodcastEditDialog({ podcast, open, onOpenChange, onUpdate }: PodcastEditDialogProps) {
  const [title, setTitle] = useState(podcast.title || "")
  const [description, setDescription] = useState(podcast.description || "")
  const [thumbnailUrl, setThumbnailUrl] = useState(podcast.thumbnail_url || "")
  const [platform, setPlatform] = useState<Platform>(podcast.platform ?? "other")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ダイアログが開かれたときにフォームをリセット
  useEffect(() => {
    if (open) {
      setTitle(podcast.title || "")
      setDescription(podcast.description || "")
      setThumbnailUrl(podcast.thumbnail_url || "")
      setPlatform(podcast.platform ?? "other")
      setError(null)
    }
  }, [open, podcast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      await onUpdate(podcast.id, {
        title: title || null,
        description: description || null,
        thumbnail_url: thumbnailUrl || null,
        platform,
      })
      onOpenChange(false)
    } catch (error: unknown) {
      console.error("Podcast更新エラー:", error)
      setError(error instanceof Error ? error.message : "Podcastの更新に失敗しました")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Podcastを編集</DialogTitle>
          <DialogDescription>タイトル、説明、サムネイル、プラットフォームを編集できます</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="edit-url">URL（変更不可）</Label>
            <Input id="edit-url" type="url" value={podcast.url} disabled className="bg-muted" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-title">タイトル</Label>
            <Input
              id="edit-title"
              type="text"
              placeholder="Podcastのタイトル"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">説明</Label>
            <Textarea
              id="edit-description"
              placeholder="Podcastの説明"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-thumbnail">サムネイルURL</Label>
            <Input
              id="edit-thumbnail"
              type="url"
              placeholder="https://..."
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-platform">プラットフォーム</Label>
            <Select value={platform} onValueChange={(value) => setPlatform(value as Platform)}>
              <SelectTrigger id="edit-platform">
                <SelectValue placeholder="プラットフォームを選択" />
              </SelectTrigger>
              <SelectContent>
                {PLATFORM_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              キャンセル
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  更新中...
                </>
              ) : (
                "更新"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
