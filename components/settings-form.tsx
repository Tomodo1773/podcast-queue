"use client"

import { AlertCircle, CheckCircle, Download, Loader2, Trash2 } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
  hasAuthError: boolean
  isNotionLinked: boolean
  initialNotionDatabaseId: string
  notionWorkspaceName: string
}

export function SettingsForm({
  userId,
  initialLineUserId,
  initialDriveFolderId,
  isDriveLinked,
  hasAuthError,
  isNotionLinked,
  initialNotionDatabaseId,
  notionWorkspaceName,
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
  const [exportLoading, setExportLoading] = useState(false)
  const [showReauthAlert, setShowReauthAlert] = useState(hasAuthError)

  // Notion連携用のstate
  const [isNotionConnected, setIsNotionConnected] = useState(isNotionLinked)
  const [notionDatabaseId, setNotionDatabaseId] = useState(initialNotionDatabaseId)
  const [notionParentPageId, setNotionParentPageId] = useState("")
  const [notionLoading, setNotionLoading] = useState(false)
  const [notionMessage, setNotionMessage] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)
  const [notionExportLoading, setNotionExportLoading] = useState(false)

  // URLパラメータからメッセージを取得
  useEffect(() => {
    const success = searchParams.get("success")
    const error = searchParams.get("error")
    const notionSuccess = searchParams.get("notion_success")
    const notionError = searchParams.get("notion_error")
    const reauth = searchParams.get("reauth")
    if (success) {
      setDriveMessage({ type: "success", text: success })
      setIsDriveConnected(true)
      setShowReauthAlert(false)
    }
    if (notionSuccess) {
      setNotionMessage({ type: "success", text: notionSuccess })
      setIsNotionConnected(true)
    }
    if (error) {
      setDriveMessage({ type: "error", text: error })
    }
    if (notionError) {
      setNotionMessage({ type: "error", text: notionError })
    }
    if (reauth === "required") {
      setShowReauthAlert(true)
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

  const handleExportWatched = async () => {
    setExportLoading(true)
    toast.success("エクスポートを開始しました", {
      description: "視聴済みデータをGoogle Driveに出力しています...",
    })

    try {
      const response = await fetch("/api/google-drive/export-watched", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        // 再認証が必要な場合
        if (data.code === "REAUTH_REQUIRED") {
          setShowReauthAlert(true)
          toast.error("Google Driveの再認証が必要です", {
            description: "下の「再連携」ボタンから再度連携してください",
            duration: 10000,
          })
          return
        }
        throw new Error(data.error || "エクスポートに失敗しました")
      }

      if (data.stats.total === 0) {
        toast.info(data.message)
      } else if (data.stats.failed > 0) {
        toast.warning(data.message, {
          description: `成功: ${data.stats.success}件、失敗: ${data.stats.failed}件`,
        })
      } else {
        toast.success(data.message, {
          description: `${data.stats.success}件のファイルを作成しました`,
        })
      }
    } catch (error) {
      toast.error("エクスポートに失敗しました", {
        description: error instanceof Error ? error.message : "不明なエラーが発生しました",
      })
    } finally {
      setExportLoading(false)
    }
  }

  const handleNotionCreateDatabase = async () => {
    if (!notionParentPageId.trim()) {
      setNotionMessage({ type: "error", text: "親ページIDを入力してください" })
      return
    }

    setNotionLoading(true)
    setNotionMessage(null)

    try {
      const response = await fetch("/api/notion/create-database", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentPageId: notionParentPageId.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "データベース作成に失敗しました")
      }

      setNotionDatabaseId(data.databaseId)
      setNotionParentPageId("")
      setNotionMessage({ type: "success", text: "PodQueueデータベースを作成しました" })
    } catch (error) {
      setNotionMessage({
        type: "error",
        text: error instanceof Error ? error.message : "データベース作成に失敗しました",
      })
    } finally {
      setNotionLoading(false)
    }
  }

  const handleNotionSaveDatabaseId = async () => {
    if (!notionDatabaseId.trim()) {
      setNotionMessage({ type: "error", text: "データベースIDを入力してください" })
      return
    }

    setNotionLoading(true)
    setNotionMessage(null)

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("notion_settings")
        .update({ database_id: notionDatabaseId.trim(), updated_at: new Date().toISOString() })
        .eq("user_id", userId)

      if (error) throw error
      setNotionMessage({ type: "success", text: "データベースIDを保存しました" })
    } catch {
      setNotionMessage({ type: "error", text: "保存に失敗しました" })
    } finally {
      setNotionLoading(false)
    }
  }

  const handleNotionUnlink = async () => {
    setNotionLoading(true)
    setNotionMessage(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.from("notion_settings").delete().eq("user_id", userId)

      if (error) throw error

      setNotionDatabaseId("")
      setIsNotionConnected(false)
      setNotionMessage({ type: "success", text: "Notion連携を解除しました" })
    } catch {
      setNotionMessage({ type: "error", text: "連携解除に失敗しました" })
    } finally {
      setNotionLoading(false)
    }
  }

  const handleNotionExportWatched = async () => {
    setNotionExportLoading(true)
    toast.success("エクスポートを開始しました", {
      description: "視聴済みデータをNotionに出力しています...",
    })

    try {
      const response = await fetch("/api/notion/export-watched", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "エクスポートに失敗しました")
      }

      if (data.stats.total === 0) {
        toast.info(data.message)
      } else if (data.stats.failed > 0) {
        toast.warning(data.message, {
          description: `成功: ${data.stats.success}件、失敗: ${data.stats.failed}件`,
        })
      } else {
        toast.success(data.message, {
          description: `${data.stats.success}件のページを作成しました`,
        })
      }
    } catch (error) {
      toast.error("エクスポートに失敗しました", {
        description: error instanceof Error ? error.message : "不明なエラーが発生しました",
      })
    } finally {
      setNotionExportLoading(false)
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
              {showReauthAlert && (
                <Alert variant="destructive">
                  <AlertCircle className="size-4" />
                  <AlertDescription>
                    Google Driveの認証が期限切れです。下の「再連携」ボタンから再度連携してください。
                  </AlertDescription>
                </Alert>
              )}

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

              <div className="flex flex-col gap-4">
                <div className="flex gap-2">
                  <Button onClick={handleDriveFolderSave} disabled={driveLoading || showReauthAlert}>
                    {driveLoading && <Loader2 className="size-4 animate-spin" />}
                    保存
                  </Button>
                  <Button
                    variant={showReauthAlert ? "default" : "secondary"}
                    onClick={() => {
                      window.location.href = "/api/auth/google"
                    }}
                    disabled={driveLoading}
                  >
                    再連携
                  </Button>
                  <Button variant="outline" onClick={handleDriveUnlink} disabled={driveLoading}>
                    <Trash2 className="size-4" />
                    連携解除
                  </Button>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    過去の視聴済みデータをGoogle Driveにエクスポートできます。
                  </p>
                  <Button
                    variant="secondary"
                    onClick={handleExportWatched}
                    disabled={exportLoading || driveLoading || showReauthAlert}
                    className="w-full sm:w-auto"
                  >
                    {exportLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Download className="size-4" />
                    )}
                    視聴済みデータをエクスポート
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Notion連携
            {isNotionConnected && (
              <span className="text-sm font-normal text-green-600 flex items-center gap-1">
                <CheckCircle className="size-4" />
                連携済み{notionWorkspaceName && `（${notionWorkspaceName}）`}
              </span>
            )}
          </CardTitle>
          <CardDescription>
            Notionと連携すると、視聴中・視聴済み時に自動でNotionデータベースにページを作成します。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isNotionConnected ? (
            <Button asChild>
              <a href="/api/auth/notion">Notionで連携</a>
            </Button>
          ) : (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notionDatabaseId">データベースID</Label>
                  <div className="flex gap-2">
                    <Input
                      id="notionDatabaseId"
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      value={notionDatabaseId}
                      onChange={(e) => setNotionDatabaseId(e.target.value)}
                      disabled={notionLoading}
                    />
                    <Button onClick={handleNotionSaveDatabaseId} disabled={notionLoading}>
                      {notionLoading && <Loader2 className="size-4 animate-spin" />}
                      保存
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    既存のNotionデータベースIDを直接入力するか、下の「データベースを作成」で新規作成してください
                  </p>
                </div>

                <div className="border rounded-md p-3 space-y-2 bg-muted/30">
                  <p className="text-sm font-medium">PodQueueデータベースを新規作成</p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Notionの親ページID"
                      value={notionParentPageId}
                      onChange={(e) => setNotionParentPageId(e.target.value)}
                      disabled={notionLoading}
                    />
                    <Button variant="secondary" onClick={handleNotionCreateDatabase} disabled={notionLoading}>
                      {notionLoading && <Loader2 className="size-4 animate-spin" />}
                      作成
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    NotionページURLの末尾のID部分を入力してください
                  </p>
                </div>
              </div>

              {notionMessage && (
                <p
                  className={`text-sm ${notionMessage.type === "error" ? "text-red-600" : "text-green-600"}`}
                >
                  {notionMessage.text}
                </p>
              )}

              <div className="flex flex-col gap-4">
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      window.location.href = "/api/auth/notion"
                    }}
                    disabled={notionLoading}
                  >
                    再連携
                  </Button>
                  <Button variant="outline" onClick={handleNotionUnlink} disabled={notionLoading}>
                    <Trash2 className="size-4" />
                    連携解除
                  </Button>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    過去の視聴済みデータをNotionにエクスポートできます。
                  </p>
                  <Button
                    variant="secondary"
                    onClick={handleNotionExportWatched}
                    disabled={notionExportLoading || notionLoading || !notionDatabaseId}
                    className="w-full sm:w-auto"
                  >
                    {notionExportLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Download className="size-4" />
                    )}
                    視聴済みデータをエクスポート
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
