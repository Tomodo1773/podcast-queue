"use client"

import { useSearchParams } from "next/navigation"
import { useCallback, useState } from "react"
import { PodcastList } from "@/components/podcast-list"
import { PodcastsHeader } from "@/components/podcasts-header"

type PodcastsContainerProps = {
  userId: string
}

export function PodcastsContainer({ userId }: PodcastsContainerProps) {
  const [refreshKey, setRefreshKey] = useState(0)
  const searchParams = useSearchParams()

  // URL共有連携: クエリパラメータから共有URLと自動取得フラグを取得
  const sharedUrl = searchParams.get("shared_url")
  const autoFetch = searchParams.get("auto_fetch") === "true"

  const handlePodcastAdded = useCallback(() => {
    setRefreshKey((prev) => prev + 1)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <PodcastsHeader
        userId={userId}
        onPodcastAdded={handlePodcastAdded}
        sharedUrl={sharedUrl}
        autoFetch={autoFetch}
      />
      <main className="container mx-auto px-4 py-8">
        <PodcastList userId={userId} refreshKey={refreshKey} />
      </main>
    </div>
  )
}
