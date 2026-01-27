import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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

export const PLATFORM_OPTIONS = [
  { value: "youtube", label: "YouTube" },
  { value: "spotify", label: "Spotify" },
  { value: "newspicks", label: "NewsPicks" },
  { value: "pivot", label: "Pivot" },
  { value: "txbiz", label: "テレ東BIZ" },
  { value: "other", label: "その他" },
] as const

export type Platform = (typeof PLATFORM_OPTIONS)[number]["value"]

/**
 * URLからプラットフォームを判定する
 */
export function detectPlatform(url: string): Platform {
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube"
  if (url.includes("spotify.com")) return "spotify"
  if (url.includes("newspicks.com") || url.includes("npx.me")) return "newspicks"
  if (url.includes("pivot.inc") || url.includes("pivot")) return "pivot"
  if (url.includes("txbiz.tv-tokyo.co.jp")) return "txbiz"
  return "other"
}

/**
 * 既存データや表示名などを正規化してPlatform IDに揃える
 */
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

/**
 * プラットフォームIDから表示名を取得する
 */
export function getPlatformLabel(platform: Platform | null): string {
  if (!platform) return "その他"
  const option = PLATFORM_OPTIONS.find((item) => item.value === platform)
  return option?.label ?? "その他"
}
