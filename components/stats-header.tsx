"use client"

import { ArrowLeft, BarChart3 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function StatsHeader() {
  return (
    <header className="border-b bg-gradient-to-r from-purple-50/50 to-blue-50/50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-8 text-purple-600" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            視聴統計
          </h1>
        </div>
        <Button variant="ghost" asChild>
          <Link href="/podcasts">
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">一覧に戻る</span>
          </Link>
        </Button>
      </div>
    </header>
  )
}
