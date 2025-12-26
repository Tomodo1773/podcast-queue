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
  if (platformLower.includes("newspicks")) return "bg-blue-500"
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
