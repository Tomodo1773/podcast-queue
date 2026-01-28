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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getPlatformColor, getPlatformLabel, type Platform } from "@/lib/utils"

type StatsViewProps = {
  stats: StatsData
}

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#a28ddb", "#ff6b9d"]

export function StatsView({ stats }: StatsViewProps) {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily")

  const getChartData = () => {
    switch (period) {
      case "daily":
        return stats.dailyStats
      case "weekly":
        return stats.weeklyStats
      case "monthly":
        return stats.monthlyStats
    }
  }

  const getPeriodLabel = () => {
    switch (period) {
      case "daily":
        return "日別（30日間）"
      case "weekly":
        return "週別（12週間）"
      case "monthly":
        return "月別（12ヶ月）"
    }
  }

  return (
    <div className="space-y-6">
      {/* 基本統計 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総視聴数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本日</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.today}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今週</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisWeek}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今月</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisMonth}</div>
          </CardContent>
        </Card>
      </div>

      {/* 平均視聴頻度 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">1日あたりの平均視聴数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averagePerDay.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">1週間あたりの平均視聴数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averagePerWeek.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* 時系列グラフ */}
      <Card>
        <CardHeader>
          <CardTitle>視聴履歴</CardTitle>
          <div className="flex gap-2 mt-4">
            <Button
              variant={period === "daily" ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod("daily")}
            >
              日別
            </Button>
            <Button
              variant={period === "weekly" ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod("weekly")}
            >
              週別
            </Button>
            <Button
              variant={period === "monthly" ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod("monthly")}
            >
              月別
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground mb-4">{getPeriodLabel()}</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getChartData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* プラットフォーム別統計 */}
      <Card>
        <CardHeader>
          <CardTitle>プラットフォーム別視聴数</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="space-y-2">
                {stats.platformStats.map((stat) => (
                  <div key={stat.platform} className="flex items-center justify-between gap-2">
                    <Badge className={getPlatformColor(stat.platform as Platform)} variant="default">
                      {getPlatformLabel(stat.platform as Platform)}
                    </Badge>
                    <span>{stat.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.platformStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    // biome-ignore lint/suspicious/noExplicitAny: recharts型定義の都合上必要
                    label={(entry: any) =>
                      `${getPlatformLabel(entry.platform as Platform)}: ${entry.count}`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {stats.platformStats.map((item, index) => (
                      <Cell key={item.platform} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    // biome-ignore lint/suspicious/noExplicitAny: recharts型定義の都合上必要
                    formatter={(value: any, _name: any, props: any) => [
                      `${value}回視聴`,
                      getPlatformLabel((props.payload?.platform ?? "other") as Platform),
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
