"use client"

import { Loader2, Trash2 } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

export type YoutubeChannel = {
  id: string
  channel_id: string
  label: string | null
}

type YoutubeChannelsSettingsProps = {
  userId: string
  initialChannels: YoutubeChannel[]
}

export function YoutubeChannelsSettings({ userId, initialChannels }: YoutubeChannelsSettingsProps) {
  const [channels, setChannels] = useState(initialChannels)
  const [channelId, setChannelId] = useState("")
  const [label, setLabel] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleAdd = async () => {
    const trimmedChannelId = channelId.trim()
    if (!/^UC[A-Za-z0-9_-]{22}$/.test(trimmedChannelId)) {
      setMessage({ type: "error", text: "チャンネルIDの形式が正しくありません（UCで始まる24文字）" })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("youtube_channels")
        .insert({
          user_id: userId,
          channel_id: trimmedChannelId,
          label: label.trim() || null,
        })
        .select("id, channel_id, label")
        .single()

      if (error) {
        if (error.code === "23505") {
          setMessage({ type: "error", text: "このチャンネルは既に登録されています" })
        } else {
          throw error
        }
      } else {
        setChannels([...channels, data])
        setChannelId("")
        setLabel("")
        setMessage({ type: "success", text: "チャンネルを登録しました" })
      }
    } catch {
      setMessage({ type: "error", text: "登録に失敗しました" })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    setLoading(true)
    setMessage(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.from("youtube_channels").delete().eq("id", id)

      if (error) throw error

      setChannels(channels.filter((channel) => channel.id !== id))
      setMessage({ type: "success", text: "チャンネルを削除しました" })
    } catch {
      setMessage({ type: "error", text: "削除に失敗しました" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>レコメンド対象チャンネル</CardTitle>
        <CardDescription>
          登録したYouTubeチャンネルの新着動画を毎日チェックし、あなたの視聴傾向に近いものをLINEでお知らせします。
          チャンネルIDはチャンネルページの「概要 → チャンネルを共有 → チャンネルIDをコピー」から取得できます。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {channels.length > 0 && (
          <ul className="space-y-2">
            {channels.map((channel) => (
              <li key={channel.id} className="flex items-center justify-between rounded-md border p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{channel.label || "（ラベルなし）"}</p>
                  <p className="text-xs text-muted-foreground truncate">{channel.channel_id}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(channel.id)}
                  disabled={loading}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}

        <div className="space-y-2">
          <Label htmlFor="youtubeChannelId">チャンネルID</Label>
          <Input
            id="youtubeChannelId"
            placeholder="UCxxxxxxxxxxxxxxxxxxxxxx"
            value={channelId}
            onChange={(e) => setChannelId(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="youtubeChannelLabel">ラベル（任意）</Label>
          <Input
            id="youtubeChannelLabel"
            placeholder="チャンネル名など"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            disabled={loading}
          />
        </div>

        {message && (
          <p className={`text-sm ${message.type === "error" ? "text-red-600" : "text-green-600"}`}>
            {message.text}
          </p>
        )}

        <Button onClick={handleAdd} disabled={loading || !channelId.trim()}>
          {loading && <Loader2 className="size-4 animate-spin" />}
          チャンネルを登録
        </Button>
      </CardContent>
    </Card>
  )
}
