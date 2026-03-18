import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type Platform = "youtube" | "spotify" | "newspicks" | "pivot" | "txbiz" | "other"

export const PLATFORM_OPTIONS: { value: Platform; label: string }[] = [
  { value: "youtube", label: "YouTube" },
  { value: "spotify", label: "Spotify" },
  { value: "newspicks", label: "NewsPicks" },
  { value: "pivot", label: "Pivot" },
  { value: "txbiz", label: "テレ東BIZ" },
  { value: "other", label: "その他" },
]

export function getPlatformColor(platform: Platform | null): string {
  if (!platform) return "bg-gray-500"
  switch (platform) {
    case "youtube":
      return "bg-red-500"
    case "spotify":
      return "bg-green-500"
    case "newspicks":
      return "bg-black"
    case "pivot":
      return "bg-purple-500"
    case "txbiz":
      return "bg-red-600"
    default:
      return "bg-gray-500"
  }
}

export type Priority = "high" | "medium" | "low"

export function getPriorityLabel(priority: Priority): string {
  switch (priority) {
    case "high":
      return "高"
    case "medium":
      return "中"
    case "low":
      return "低"
  }
}

export function getPriorityColor(priority: Priority): string {
  switch (priority) {
    case "high":
      return "bg-red-500"
    case "medium":
      return "bg-yellow-500"
    case "low":
      return "bg-green-500"
  }
}

export function getPriorityOrder(priority: Priority): number {
  switch (priority) {
    case "high":
      return 0
    case "medium":
      return 1
    case "low":
      return 2
  }
}

/**
 * URLからプラットフォームを判定する
 */
export function detectPlatform(url: string): Platform {
  try {
    const { hostname } = new URL(url)

    if (hostname === "youtube.com" || hostname.endsWith(".youtube.com") || hostname === "youtu.be")
      return "youtube"
    if (hostname === "spotify.com" || hostname.endsWith(".spotify.com")) return "spotify"
    if (hostname === "newspicks.com" || hostname.endsWith(".newspicks.com") || hostname === "npx.me")
      return "newspicks"
    if (hostname === "pivot.inc" || hostname.endsWith(".pivot.inc")) return "pivot"
    if (hostname === "txbiz.tv-tokyo.co.jp" || hostname.endsWith(".txbiz.tv-tokyo.co.jp")) return "txbiz"

    return "other"
  } catch {
    return "other"
  }
}

/**
 * プラットフォームIDから表示名を取得する
 */
export function getPlatformLabel(platform: Platform | null): string {
  if (!platform) return "その他"
  const option = PLATFORM_OPTIONS.find((opt) => opt.value === platform)
  return option ? option.label : "その他"
}

/**
 * ログインジェクション対策として改行文字を除去する
 */
export function sanitizeForLog(text: string | undefined | null): string {
  if (!text) return ""
  return text.replace(/[\r\n]/g, "")
}
