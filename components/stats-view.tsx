"use client"

import { useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { StatsData } from "@/app/podcasts/stats/actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type StatsViewProps = {
  stats: StatsData
}

const COLORS = ["#8b5cf6", "#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"]

export function StatsView({ stats }: StatsViewProps) {
  const [timePeriod, setTimePeriod] = useState<"daily" | "weekly" | "monthly">("daily")

  const chartData =
    timePeriod === "daily"
      ? stats.dailyStats
      : timePeriod === "weekly"
        ? stats.weeklyStats
        : stats.monthlyStats

  const formatDate = (dateStr: string) => {
    if (timePeriod === "monthly") {
      const [year, month] = dateStr.split("-")
      return `${year}/${month}`
    }
    const date = new Date(dateStr)
    if (timePeriod === "weekly") {
      return `${date.getMonth() + 1}/${date.getDate()}`
    }
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  return (
    <div className="space-y-6">
      {/* 基本統計 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>総視聴数</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">累計視聴したポッドキャスト数</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>今日</CardDescription>
            <CardTitle className="text-3xl">{stats.today}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">本日視聴した数</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>今週</CardDescription>
            <CardTitle className="text-3xl">{stats.thisWeek}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">今週視聴した数（月曜始まり）</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>今月</CardDescription>
            <CardTitle className="text-3xl">{stats.thisMonth}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">今月視聴した数</p>
          </CardContent>
        </Card>
      </div>

      {/* 平均視聴頻度 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>平均視聴頻度（日）</CardDescription>
            <CardTitle className="text-3xl">{stats.averagePerDay}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">1日あたりの平均視聴数</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>平均視聴頻度（週）</CardDescription>
            <CardTitle className="text-3xl">{stats.averagePerWeek}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">1週間あたりの平均視聴数</p>
          </CardContent>
        </Card>
      </div>

      {/* 時系列グラフ */}
      <Card>
        <CardHeader>
          <CardTitle>視聴履歴推移</CardTitle>
          <CardDescription>期間ごとの視聴数の推移</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={timePeriod} onValueChange={(v) => setTimePeriod(v as typeof timePeriod)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="daily">日別（30日間）</TabsTrigger>
              <TabsTrigger value="weekly">週別（12週間）</TabsTrigger>
              <TabsTrigger value="monthly">月別（12ヶ月）</TabsTrigger>
            </TabsList>
            <TabsContent value={timePeriod} className="mt-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={formatDate} />
                  <YAxis />
                  <Tooltip labelFormatter={(label) => formatDate(String(label))} />
                  <Bar dataKey="count" fill="#8b5cf6" name="視聴数" />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* プラットフォーム別統計 */}
      {stats.platformStats.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>プラットフォーム別視聴数</CardTitle>
              <CardDescription>各プラットフォームの視聴数</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.platformStats.map((stat) => (
                  <div key={stat.platform} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{stat.platform}</span>
                    <span className="text-sm text-muted-foreground">{stat.count}本</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>プラットフォーム別割合</CardTitle>
              <CardDescription>各プラットフォームの視聴割合</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.platformStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="platform"
                  >
                    {stats.platformStats.map((entry, index) => (
                      <Cell key={`cell-${entry.platform}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
