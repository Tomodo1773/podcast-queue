"use server"

import { createClient } from "@/lib/supabase/server"

export type DailyStats = {
  date: string
  count: number
}

export type PlatformStats = {
  platform: string
  count: number
}

export type ShowNameStats = {
  showName: string
  count: number
}

export type StatsData = {
  total: number
  thisWeek: number
  thisMonth: number
  dailyStats: DailyStats[]
  weeklyStats: DailyStats[]
  monthlyStats: DailyStats[]
  platformStats: PlatformStats[]
  showNameStats: ShowNameStats[]
  averagePerDay: number
  averagePerWeek: number
}

export async function getStats(userId: string): Promise<StatsData> {
  const supabase = await createClient()

  const { data: podcasts } = await supabase
    .from("podcasts")
    .select("*")
    .eq("user_id", userId)
    .eq("is_watched", true)
    .gte("watched_at", new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
    .order("watched_at", { ascending: true })

  const watchedPodcasts = podcasts || []

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const thisWeekStart = new Date(today)
  thisWeekStart.setDate(today.getDate() - today.getDay())
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const total = watchedPodcasts.length

  const thisWeekCount = watchedPodcasts.filter((p) => {
    const watchedAt = new Date(p.watched_at!)
    return watchedAt >= thisWeekStart
  }).length

  const thisMonthCount = watchedPodcasts.filter((p) => {
    const watchedAt = new Date(p.watched_at!)
    return watchedAt >= thisMonthStart
  }).length

  const dailyStats: DailyStats[] = []
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    const nextDate = new Date(date)
    nextDate.setDate(date.getDate() + 1)

    const count = watchedPodcasts.filter((p) => {
      const watchedAt = new Date(p.watched_at!)
      return watchedAt >= date && watchedAt < nextDate
    }).length

    dailyStats.push({
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      count,
    })
  }

  const weeklyStats: DailyStats[] = []
  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(thisWeekStart)
    weekStart.setDate(thisWeekStart.getDate() - i * 7)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)

    const count = watchedPodcasts.filter((p) => {
      const watchedAt = new Date(p.watched_at!)
      return watchedAt >= weekStart && watchedAt < weekEnd
    }).length

    weeklyStats.push({
      date: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
      count,
    })
  }

  const monthlyStats: DailyStats[] = []
  for (let i = 11; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)

    const count = watchedPodcasts.filter((p) => {
      const watchedAt = new Date(p.watched_at!)
      return watchedAt >= monthStart && watchedAt < monthEnd
    }).length

    monthlyStats.push({
      date: `${monthStart.getFullYear()}/${monthStart.getMonth() + 1}`,
      count,
    })
  }

  const platformMap = new Map<string, number>()
  watchedPodcasts.forEach((p) => {
    const platform = p.platform || "other"
    platformMap.set(platform, (platformMap.get(platform) || 0) + 1)
  })

  const platformStats: PlatformStats[] = Array.from(platformMap.entries()).map(([platform, count]) => ({
    platform,
    count,
  }))

  // 番組名別統計
  const showNameMap = new Map<string, number>()
  watchedPodcasts.forEach((p) => {
    const showName = p.show_name?.trim() ? p.show_name : "その他"
    showNameMap.set(showName, (showNameMap.get(showName) || 0) + 1)
  })

  // 件数の多い順にソート
  const sortedShowNames = Array.from(showNameMap.entries()).sort((a, b) => b[1] - a[1])

  // 上位10件を個別表示、11件目以降は「その他」にまとめる
  const showNameStats: ShowNameStats[] = []
  let othersCount = 0
  sortedShowNames.forEach(([showName, count], index) => {
    if (index < 10) {
      showNameStats.push({ showName, count })
    } else {
      othersCount += count
    }
  })
  if (othersCount > 0) {
    // 既に「その他」が上位10件に入っている場合は統合
    const othersIndex = showNameStats.findIndex((s) => s.showName === "その他")
    if (othersIndex >= 0) {
      showNameStats[othersIndex].count += othersCount
    } else {
      showNameStats.push({ showName: "その他", count: othersCount })
    }
  }

  let averagePerDay = 0
  let averagePerWeek = 0

  if (watchedPodcasts.length > 0 && total > 0) {
    const oldestWatchedAt = new Date(watchedPodcasts[0].watched_at!)
    const daysSinceOldest = Math.max(
      1,
      Math.floor((now.getTime() - oldestWatchedAt.getTime()) / (1000 * 60 * 60 * 24))
    )
    const weeksSinceOldest = Math.max(1, Math.floor(daysSinceOldest / 7))

    averagePerDay = total / daysSinceOldest
    averagePerWeek = total / weeksSinceOldest
  }

  return {
    total,
    thisWeek: thisWeekCount,
    thisMonth: thisMonthCount,
    dailyStats,
    weeklyStats,
    monthlyStats,
    platformStats,
    showNameStats,
    averagePerDay,
    averagePerWeek,
  }
}
