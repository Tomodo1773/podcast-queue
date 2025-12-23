import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

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
	return "bg-gray-500"
}
