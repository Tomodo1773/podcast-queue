import { ArrowLeft, BarChart3 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function StatsHeader() {
  return (
    <header className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 shadow-lg">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8" />
          <h1 className="text-2xl font-bold">視聴統計</h1>
        </div>
        <Link href="/podcasts">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">ポッドキャスト一覧へ戻る</span>
            <span className="sm:hidden">戻る</span>
          </Button>
        </Link>
      </div>
    </header>
  )
}
