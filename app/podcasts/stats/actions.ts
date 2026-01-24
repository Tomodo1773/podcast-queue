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

export type StatsData = {
  total: number
  today: number
  thisWeek: number
  thisMonth: number
  averagePerDay: number
  averagePerWeek: number
  dailyStats: DailyStats[]
  weeklyStats: DailyStats[]
  monthlyStats: DailyStats[]
  platformStats: PlatformStats[]
}

export async function getStats(userId: string): Promise<StatsData> {
  const supabase = await createClient()

  // 総視聴数
  const { count: total } = await supabase
    .from("podcasts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_watched", true)

  // 今日の視聴数
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const { count: todayCount } = await supabase
    .from("podcasts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_watched", true)
    .gte("watched_at", today.toISOString())

  // 今週の視聴数（月曜日始まり）
  const thisWeekStart = new Date()
  const day = thisWeekStart.getDay()
  const diff = thisWeekStart.getDate() - day + (day === 0 ? -6 : 1)
  thisWeekStart.setDate(diff)
  thisWeekStart.setHours(0, 0, 0, 0)
  const { count: thisWeekCount } = await supabase
    .from("podcasts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_watched", true)
    .gte("watched_at", thisWeekStart.toISOString())

  // 今月の視聴数
  const thisMonthStart = new Date()
  thisMonthStart.setDate(1)
  thisMonthStart.setHours(0, 0, 0, 0)
  const { count: thisMonthCount } = await supabase
    .from("podcasts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_watched", true)
    .gte("watched_at", thisMonthStart.toISOString())

  // 過去30日間の日別視聴数
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  thirtyDaysAgo.setHours(0, 0, 0, 0)
  const { data: dailyData } = await supabase
    .from("podcasts")
    .select("watched_at")
    .eq("user_id", userId)
    .eq("is_watched", true)
    .gte("watched_at", thirtyDaysAgo.toISOString())
    .order("watched_at", { ascending: true })

  // 日別データを集計
  const dailyMap = new Map<string, number>()
  for (let i = 0; i < 30; i++) {
    const date = new Date(thirtyDaysAgo)
    date.setDate(date.getDate() + i)
    const dateStr = date.toISOString().split("T")[0]
    dailyMap.set(dateStr, 0)
  }

  dailyData?.forEach((item) => {
    if (item.watched_at) {
      const dateStr = item.watched_at.split("T")[0]
      dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + 1)
    }
  })

  const dailyStats: DailyStats[] = Array.from(dailyMap.entries()).map(([date, count]) => ({
    date,
    count,
  }))

  // 過去12週間の週別視聴数
  const twelveWeeksAgo = new Date()
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84)
  twelveWeeksAgo.setHours(0, 0, 0, 0)
  const { data: weeklyData } = await supabase
    .from("podcasts")
    .select("watched_at")
    .eq("user_id", userId)
    .eq("is_watched", true)
    .gte("watched_at", twelveWeeksAgo.toISOString())
    .order("watched_at", { ascending: true })

  // 週別データを集計（月曜日始まり）
  const weeklyMap = new Map<string, number>()
  for (let i = 0; i < 12; i++) {
    const weekStart = new Date(twelveWeeksAgo)
    weekStart.setDate(weekStart.getDate() + i * 7)
    const dateStr = weekStart.toISOString().split("T")[0]
    weeklyMap.set(dateStr, 0)
  }

  weeklyData?.forEach((item) => {
    if (item.watched_at) {
      const date = new Date(item.watched_at)
      const weekStart = new Date(date)
      const dayOfWeek = weekStart.getDay()
      const diff = weekStart.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
      weekStart.setDate(diff)
      weekStart.setHours(0, 0, 0, 0)

      // 該当する週を見つけて加算
      for (const key of weeklyMap.keys()) {
        const keyDate = new Date(key)
        const nextWeek = new Date(keyDate)
        nextWeek.setDate(nextWeek.getDate() + 7)
        if (weekStart >= keyDate && weekStart < nextWeek) {
          weeklyMap.set(key, (weeklyMap.get(key) || 0) + 1)
          break
        }
      }
    }
  })

  const weeklyStats: DailyStats[] = Array.from(weeklyMap.entries()).map(([date, count]) => ({
    date,
    count,
  }))

  // 過去12ヶ月の月別視聴数
  const twelveMonthsAgo = new Date()
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
  twelveMonthsAgo.setDate(1)
  twelveMonthsAgo.setHours(0, 0, 0, 0)
  const { data: monthlyData } = await supabase
    .from("podcasts")
    .select("watched_at")
    .eq("user_id", userId)
    .eq("is_watched", true)
    .gte("watched_at", twelveMonthsAgo.toISOString())
    .order("watched_at", { ascending: true })

  // 月別データを集計
  const monthlyMap = new Map<string, number>()
  for (let i = 0; i < 12; i++) {
    const monthStart = new Date(twelveMonthsAgo)
    monthStart.setMonth(monthStart.getMonth() + i)
    const dateStr = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, "0")}`
    monthlyMap.set(dateStr, 0)
  }

  monthlyData?.forEach((item) => {
    if (item.watched_at) {
      const date = new Date(item.watched_at)
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      monthlyMap.set(dateStr, (monthlyMap.get(dateStr) || 0) + 1)
    }
  })

  const monthlyStats: DailyStats[] = Array.from(monthlyMap.entries()).map(([date, count]) => ({
    date,
    count,
  }))

  // プラットフォーム別統計
  const { data: platformData } = await supabase
    .from("podcasts")
    .select("platform")
    .eq("user_id", userId)
    .eq("is_watched", true)

  const platformMap = new Map<string, number>()
  platformData?.forEach((item) => {
    const platform = item.platform || "その他"
    platformMap.set(platform, (platformMap.get(platform) || 0) + 1)
  })

  const platformStats: PlatformStats[] = Array.from(platformMap.entries()).map(([platform, count]) => ({
    platform,
    count,
  }))

  // 平均視聴頻度の計算
  const firstWatchedAt = dailyData?.[0]?.watched_at
  let averagePerDay = 0
  let averagePerWeek = 0

  if (firstWatchedAt && total) {
    const firstDate = new Date(firstWatchedAt)
    const daysSinceFirst = Math.max(1, Math.floor((Date.now() - firstDate.getTime()) / (1000 * 60 * 60 * 24)))
    averagePerDay = total / daysSinceFirst
    averagePerWeek = (total / daysSinceFirst) * 7
  }

  return {
    total: total || 0,
    today: todayCount || 0,
    thisWeek: thisWeekCount || 0,
    thisMonth: thisMonthCount || 0,
    averagePerDay: Number(averagePerDay.toFixed(2)),
    averagePerWeek: Number(averagePerWeek.toFixed(2)),
    dailyStats,
    weeklyStats,
    monthlyStats,
    platformStats,
  }
}
