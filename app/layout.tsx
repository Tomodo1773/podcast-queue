import { Analytics } from "@vercel/analytics/next"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import type React from "react"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "PodQueue - あなたのPodcastを一元管理",
  description:
    "YouTube、Spotify、NewsPicks等、様々なプラットフォームのPodcastを一元管理できるWebサービス PodQueue",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/podqueue-icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/podqueue-icon.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body className={"font-sans antialiased"}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
