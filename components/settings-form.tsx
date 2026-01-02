"use client"

import { CheckCircle, Loader2, Trash2 } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

type SettingsFormProps = {
  userId: string
  initialLineUserId: string
}

export function SettingsForm({ userId, initialLineUserId }: SettingsFormProps) {
  const [lineUserId, setLineUserId] = useState(initialLineUserId)
  const [isLinked, setIsLinked] = useState(!!initialLineUserId)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)

  const handleSave = async () => {
    if (!lineUserId.trim()) {
      setMessage({ type: "error", text: "LINE User IDを入力してください" })
      return
    }

    // LINE User IDの形式チェック（Uで始まる33文字）
    if (!/^U[a-fA-F0-9]{32}$/.test(lineUserId.trim())) {
      setMessage({
        type: "error",
        text: "LINE User IDの形式が正しくありません（Uで始まる33文字の英数字）",
      })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const supabase = createClient()

      // 既存のリンクを削除してから新規作成（upsert的な処理）
      await supabase.from("line_user_links").delete().eq("user_id", userId)

      const { error } = await supabase.from("line_user_links").insert({
        user_id: userId,
        line_user_id: lineUserId.trim(),
      })

      if (error) {
        if (error.code === "23505") {
          setMessage({
            type: "error",
            text: "このLINE User IDは既に別のアカウントに登録されています",
          })
        } else {
          throw error
        }
      } else {
        setMessage({ type: "success", text: "LINE連携を保存しました" })
        setIsLinked(true)
      }
    } catch {
      setMessage({ type: "error", text: "保存に失敗しました" })
    } finally {
      setLoading(false)
    }
  }

  const handleUnlink = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.from("line_user_links").delete().eq("user_id", userId)

      if (error) throw error

      setLineUserId("")
      setIsLinked(false)
      setMessage({ type: "success", text: "LINE連携を解除しました" })
    } catch {
      setMessage({ type: "error", text: "連携解除に失敗しました" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          LINE連携
          {isLinked && (
            <span className="text-sm font-normal text-green-600 flex items-center gap-1">
              <CheckCircle className="size-4" />
              連携済み
            </span>
          )}
        </CardTitle>
        <CardDescription>
          LINEアカウントを連携すると、LINEにURLを送るだけでPodcastを追加できます。
          <br />
          <a
            href="https://developers.line.biz/console/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            LINE Developers Console
          </a>
          でBot経由であなたのLINE User IDを確認してください。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="lineUserId">LINE User ID</Label>
          <Input
            id="lineUserId"
            placeholder="Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            value={lineUserId}
            onChange={(e) => setLineUserId(e.target.value)}
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground">Uで始まる33文字の英数字です</p>
        </div>

        {message && (
          <p className={`text-sm ${message.type === "error" ? "text-red-600" : "text-green-600"}`}>
            {message.text}
          </p>
        )}

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            {isLinked ? "更新" : "保存"}
          </Button>
          {isLinked && (
            <Button variant="outline" onClick={handleUnlink} disabled={loading}>
              <Trash2 className="size-4" />
              連携解除
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
