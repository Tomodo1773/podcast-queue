"use client"

import { useSearchParams } from "next/navigation"
import { useCallback } from "react"
import { useSWRConfig } from "swr"
import { PodcastList } from "@/components/podcast-list"
import { PodcastsHeader } from "@/components/podcasts-header"

type PodcastsContainerProps = {
  userId: string
}

export function PodcastsContainer({ userId }: PodcastsContainerProps) {
  const searchParams = useSearchParams()
  const { mutate } = useSWRConfig()

  // URL共有連携: クエリパラメータから共有URLと自動取得フラグを取得
  const sharedUrl = searchParams.get("shared_url")
  const autoFetch = searchParams.get("auto_fetch") === "true"

  const handlePodcastAdded = useCallback(() => {
    mutate(["podcasts", userId])
  }, [userId, mutate])

  return (
    <div className="min-h-screen bg-background">
      <PodcastsHeader
        userId={userId}
        onPodcastAdded={handlePodcastAdded}
        sharedUrl={sharedUrl}
        autoFetch={autoFetch}
      />
      <main className="container mx-auto px-4 py-8">
        <PodcastList userId={userId} />
      </main>
    </div>
  )
}
