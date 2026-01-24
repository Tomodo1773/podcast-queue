import { getStats } from "@/app/podcasts/stats/actions"
import { StatsHeader } from "@/components/stats-header"
import { StatsView } from "@/components/stats-view"

type StatsContainerProps = {
  userId: string
}

export async function StatsContainer({ userId }: StatsContainerProps) {
  const stats = await getStats(userId)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <StatsHeader />
      <main className="container mx-auto px-4 py-8">
        <StatsView stats={stats} />
      </main>
    </div>
  )
}
