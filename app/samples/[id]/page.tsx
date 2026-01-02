import type { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"
import { getAllSampleIds, getSamplePodcast } from "@/lib/samples/data"

interface PageProps {
  params: Promise<{ id: string }>
}

// 静的生成のためのパラメータを生成
export async function generateStaticParams() {
  return getAllSampleIds().map((id) => ({
    id,
  }))
}

// OGPメタデータを動的に生成
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const podcast = getSamplePodcast(id)

  if (!podcast) {
    return {
      title: "Not Found",
    }
  }

  // 本番環境のURLを構築
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://podcast-queue.vercel.app"
  const thumbnailUrl = `${baseUrl}${podcast.thumbnailPath}`

  return {
    title: podcast.title,
    description: podcast.description,
    openGraph: {
      title: podcast.title,
      description: podcast.description,
      images: [
        {
          url: thumbnailUrl,
          width: 1200,
          height: 630,
          alt: podcast.title,
        },
      ],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: podcast.title,
      description: podcast.description,
      images: [thumbnailUrl],
    },
  }
}

export default async function SamplePodcastPage({ params }: PageProps) {
  const { id } = await params
  const podcast = getSamplePodcast(id)

  if (!podcast) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-6">
        <div className="relative aspect-video w-full overflow-hidden rounded-lg">
          <Image src={podcast.thumbnailPath} alt={podcast.title} fill className="object-cover" priority />
        </div>
        <h1 className="text-2xl font-bold">{podcast.title}</h1>
        <p className="text-muted-foreground">{podcast.description}</p>
        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">これはPodQueueのデモ用サンプルページです。</p>
        </div>
      </div>
    </div>
  )
}
