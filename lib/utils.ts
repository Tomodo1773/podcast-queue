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
