import { getPriorityOrder, type Platform, type Priority } from "@/lib/utils"

export type Podcast = {
  id: string
  url: string
  title: string | null
  description: string | null
  thumbnail_url: string | null
  platform: Platform | null
  priority: Priority
  is_watched: boolean
  is_watching: boolean
  watched_at: string | null
  created_at: string
  notes: string | null
}

export type WatchFilter = "all" | "watched" | "unwatched"
export type PriorityFilter = Priority | "all"
export type SortOption = "created_at" | "priority"

/**
 * 視聴状態でフィルタリングする
 */
export function filterByWatchStatus(podcasts: Podcast[], filter: WatchFilter): Podcast[] {
  if (filter === "all") {
    return podcasts
  }
  if (filter === "watched") {
    return podcasts.filter((p) => p.is_watched)
  }
  return podcasts.filter((p) => !p.is_watched)
}

/**
 * 優先度でフィルタリングする
 */
export function filterByPriority(podcasts: Podcast[], priorityFilter: PriorityFilter): Podcast[] {
  if (priorityFilter === "all") {
    return podcasts
  }
  return podcasts.filter((p) => p.priority === priorityFilter)
}

/**
 * 並び替えを行う（created_atはすでにDBから降順で取得済みの前提）
 */
export function sortPodcasts(podcasts: Podcast[], sortBy: SortOption): Podcast[] {
  const result = [...podcasts]

  if (sortBy === "priority") {
    result.sort((a, b) => getPriorityOrder(a.priority) - getPriorityOrder(b.priority))
  }
  // created_atの場合はそのまま返す（すでにDBから降順で取得済み）

  return result
}

/**
 * 視聴中のポッドキャストを先頭に移動する
 */
export function moveWatchingToTop(podcasts: Podcast[]): Podcast[] {
  const result = [...podcasts]
  result.sort((a, b) => {
    if (a.is_watching && !b.is_watching) return -1
    if (!a.is_watching && b.is_watching) return 1
    return 0
  })
  return result
}

/**
 * フィルタリングと並び替えを一括で行う
 */
export function applyFilterAndSort(
  podcasts: Podcast[],
  filter: WatchFilter,
  priorityFilter: PriorityFilter,
  sortBy: SortOption
): Podcast[] {
  let result = filterByWatchStatus(podcasts, filter)
  result = filterByPriority(result, priorityFilter)
  result = sortPodcasts(result, sortBy)
  result = moveWatchingToTop(result)
  return result
}
