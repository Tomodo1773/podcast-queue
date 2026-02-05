"use client"

import { CheckCircle, Loader2, Trash2 } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

type SettingsFormProps = {
  userId: string
  initialLineUserId: string
  initialDriveFolderId: string
  isDriveLinked: boolean
}

export function SettingsForm({
  userId,
  initialLineUserId,
  initialDriveFolderId,
  isDriveLinked,
}: SettingsFormProps) {
  const searchParams = useSearchParams()
  const [lineUserId, setLineUserId] = useState(initialLineUserId)
  const [isLinked, setIsLinked] = useState(!!initialLineUserId)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)

  // Google Drive連携用のstate
  const [driveFolderId, setDriveFolderId] = useState(initialDriveFolderId)
  const [isDriveConnected, setIsDriveConnected] = useState(isDriveLinked)
  const [driveLoading, setDriveLoading] = useState(false)
  const [driveMessage, setDriveMessage] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)

  // URLパラメータからメッセージを取得
  useEffect(() => {
    const success = searchParams.get("success")
    const error = searchParams.get("error")
    if (success) {
      setDriveMessage({ type: "success", text: success })
      setIsDriveConnected(true)
    }
    if (error) {
      setDriveMessage({ type: "error", text: error })
    }
  }, [searchParams])

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

  const handleDriveFolderSave = async () => {
    if (!driveFolderId.trim()) {
      setDriveMessage({ type: "error", text: "フォルダIDを入力してください" })
      return
    }

    setDriveLoading(true)
    setDriveMessage(null)

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("google_drive_settings")
        .update({
          folder_id: driveFolderId.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)

      if (error) throw error
      setDriveMessage({ type: "success", text: "フォルダIDを保存しました" })
    } catch {
      setDriveMessage({ type: "error", text: "保存に失敗しました" })
    } finally {
      setDriveLoading(false)
    }
  }

  const handleDriveUnlink = async () => {
    setDriveLoading(true)
    setDriveMessage(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.from("google_drive_settings").delete().eq("user_id", userId)

      if (error) throw error

      setDriveFolderId("")
      setIsDriveConnected(false)
      setDriveMessage({ type: "success", text: "Google Drive連携を解除しました" })
    } catch {
      setDriveMessage({ type: "error", text: "連携解除に失敗しました" })
    } finally {
      setDriveLoading(false)
    }
  }

  return (
    <div className="space-y-6">
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Google Drive連携
            {isDriveConnected && (
              <span className="text-sm font-normal text-green-600 flex items-center gap-1">
                <CheckCircle className="size-4" />
                連携済み
              </span>
            )}
          </CardTitle>
          <CardDescription>
            Google Driveと連携すると、Podcast登録時に自動でマークダウンファイルを作成します。
            視聴後の学びを記録するのに便利です。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isDriveConnected ? (
            <Button asChild>
              <a href="/api/auth/google">Googleでログイン</a>
            </Button>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="driveFolderId">保存先フォルダID</Label>
                <Input
                  id="driveFolderId"
                  placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={driveFolderId}
                  onChange={(e) => setDriveFolderId(e.target.value)}
                  disabled={driveLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Google DriveのフォルダURLから取得できます（drive.google.com/drive/folders/
                  <strong>ここの部分</strong>）
                </p>
              </div>

              {driveMessage && (
                <p className={`text-sm ${driveMessage.type === "error" ? "text-red-600" : "text-green-600"}`}>
                  {driveMessage.text}
                </p>
              )}

              <div className="flex gap-2">
                <Button onClick={handleDriveFolderSave} disabled={driveLoading}>
                  {driveLoading && <Loader2 className="size-4 animate-spin" />}
                  保存
                </Button>
                <Button variant="outline" onClick={handleDriveUnlink} disabled={driveLoading}>
                  <Trash2 className="size-4" />
                  連携解除
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
