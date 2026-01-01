import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getPlatformColor(platform: string | null): string {
  if (!platform) return "bg-gray-500"
  const platformLower = platform.toLowerCase()
  if (platformLower.includes("youtube")) return "bg-red-500"
  if (platformLower.includes("spotify")) return "bg-green-500"
  if (platformLower.includes("newspicks")) return "bg-black"
  if (platformLower.includes("pivot")) return "bg-purple-500"
  if (platformLower.includes("テレ東biz")) return "bg-red-600"
  return "bg-gray-500"
}

export type Priority = 'high' | 'medium' | 'low'

export function getPriorityLabel(priority: Priority): string {
  switch (priority) {
    case 'high': return '高'
    case 'medium': return '中'
    case 'low': return '低'
  }
}

export function getPriorityColor(priority: Priority): string {
  switch (priority) {
    case 'high': return 'bg-red-500'
    case 'medium': return 'bg-yellow-500'
    case 'low': return 'bg-green-500'
  }
}

export function getPriorityOrder(priority: Priority): number {
  switch (priority) {
    case 'high': return 0
    case 'medium': return 1
    case 'low': return 2
  }
}

export type Platform = 'youtube' | 'spotify' | 'newspicks' | 'pivot' | 'txbiz' | 'other'

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
 * プラットフォームIDから表示名を取得する
 */
export function getPlatformLabel(platform: Platform | string | null): string {
  if (!platform) return "その他"
  switch (platform.toLowerCase()) {
    case 'youtube': return 'YouTube'
    case 'spotify': return 'Spotify'
    case 'newspicks': return 'NewsPicks'
    case 'pivot': return 'Pivot'
    case 'txbiz': return 'テレ東Biz'
    default: return 'その他'
  }
}
