"use client"

import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import type React from "react"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { detectPlatform, getPriorityLabel, PLATFORM_OPTIONS, type Platform, type Priority } from "@/lib/utils"

type AddPodcastFormProps = {
  userId: string
  onSuccess?: () => void
  initialUrl?: string
  autoFetch?: boolean
}

export function AddPodcastForm({ userId, onSuccess, initialUrl, autoFetch }: AddPodcastFormProps) {
  const [url, setUrl] = useState(initialUrl || "")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [thumbnailUrl, setThumbnailUrl] = useState("")
  const [showName, setShowName] = useState<string | null>(null)
  const [platform, setPlatform] = useState<Platform | null>(null)
  const [priority, setPriority] = useState<Priority>("medium")
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const hasAutoFetched = useRef(false)

  // URL共有連携: 初期URLが設定されている場合、プラットフォームを検出
  // autoFetch=true の場合は自動的にメタデータを取得
  useEffect(() => {
    if (initialUrl) {
      setPlatform(detectPlatform(initialUrl))

      // 自動メタデータ取得（一度だけ実行）
      if (autoFetch && !hasAutoFetched.current) {
        hasAutoFetched.current = true
        // フォームがマウントされた後に実行するため、少し遅延
        const fetchMetadata = async () => {
          setIsFetchingMetadata(true)
          setError(null)

          try {
            const response = await fetch("/api/fetch-metadata", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ url: initialUrl }),
            })

            if (!response.ok) {
              throw new Error("メタデータの取得に失敗しました")
            }

            const data = await response.json()

            if (data.title) setTitle(data.title)
            if (data.description) setDescription(data.description)
            if (data.image) setThumbnailUrl(data.image)
            if (data.showName) setShowName(data.showName)
          } catch (error: unknown) {
            console.error("自動メタデータ取得エラー:", error)
            setError("メタデータの自動取得に失敗しました。手動で取得してください。")
          } finally {
            setIsFetchingMetadata(false)
          }
        }

        fetchMetadata()
      }
    }
  }, [initialUrl, autoFetch])

  const handleFetchMetadata = async () => {
    if (!url) return

    setIsFetchingMetadata(true)
    setError(null)

    try {
      const response = await fetch("/api/fetch-metadata", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        throw new Error("メタデータの取得に失敗しました")
      }

      const data = await response.json()

      if (data.title) setTitle(data.title)
      if (data.description) setDescription(data.description)
      if (data.image) setThumbnailUrl(data.image)
      if (data.showName) setShowName(data.showName)
    } catch (error: unknown) {
      console.error("メタデータ取得エラー:", error)
      setError("メタデータの取得に失敗しました。手動で入力してください。")
    } finally {
      setIsFetchingMetadata(false)
    }
  }

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl)
    if (newUrl) {
      setPlatform(detectPlatform(newUrl))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] フォーム送信開始")
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      console.log("[v0] ユーザーIDを確認:", userId)
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      console.log("[v0] 認証ユーザー:", user)

      if (userError) {
        console.error("[v0] 認証エラー:", userError)
        throw new Error("認証に失敗しました。再度ログインしてください。")
      }

      if (!user) {
        throw new Error("ログインが必要です")
      }

      console.log("[v0] Podcast挿入開始")
      const podcastData = {
        user_id: user.id,
        url,
        title: title || null,
        description: description || null,
        thumbnail_url: thumbnailUrl || null,
        platform: platform || null,
        priority,
        is_watched: false,
        show_name: showName || null,
      }
      console.log("[v0] 挿入データ:", podcastData)

      const { data, error: insertError } = await supabase.from("podcasts").insert(podcastData).select()

      console.log("[v0] 挿入結果:", { data, insertError })

      if (insertError) {
        console.error("[v0] 挿入エラー:", insertError)
        throw insertError
      }

      console.log("[v0] Podcast追加成功、リダイレクト開始")
      if (onSuccess) {
        onSuccess()
      } else {
        router.push("/podcasts")
      }
      router.refresh()
      console.log("[v0] フォーム送信完了")
    } catch (error: unknown) {
      console.error("[v0] Podcast追加エラー:", error)
      setError(error instanceof Error ? error.message : "Podcastの追加に失敗しました")
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="url">URL *</Label>
        <div className="flex gap-2">
          <Input
            id="url"
            type="url"
            placeholder="https://..."
            required
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleFetchMetadata}
            disabled={!url || isFetchingMetadata}
          >
            {isFetchingMetadata ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                取得中
              </>
            ) : (
              "メタデータ取得"
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">タイトル</Label>
        <Input
          id="title"
          type="text"
          placeholder="Podcastのタイトル"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">説明</Label>
        <Textarea
          id="description"
          placeholder="Podcastの説明"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="thumbnail">サムネイルURL</Label>
        <Input
          id="thumbnail"
          type="url"
          placeholder="https://..."
          value={thumbnailUrl}
          onChange={(e) => setThumbnailUrl(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="showName">番組名</Label>
        <Input
          id="showName"
          type="text"
          placeholder="番組名またはチャンネル名"
          value={showName || ""}
          onChange={(e) => setShowName(e.target.value || null)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="platform">プラットフォーム</Label>
        <Select
          value={platform || "none"}
          onValueChange={(value) => setPlatform(value === "none" ? null : (value as Platform))}
        >
          <SelectTrigger id="platform">
            <SelectValue placeholder="プラットフォームを選択" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">未選択</SelectItem>
            {PLATFORM_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>優先度</Label>
        <div className="flex gap-2">
          {(["high", "medium", "low"] as const).map((p) => (
            <Button
              key={p}
              type="button"
              variant={priority === p ? "default" : "outline"}
              onClick={() => setPriority(p)}
              className="flex-1"
            >
              {getPriorityLabel(p)}
            </Button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              追加中...
            </>
          ) : (
            "追加"
          )}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/podcasts")}>
          キャンセル
        </Button>
      </div>
    </form>
  )
}
