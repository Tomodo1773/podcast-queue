"use client"

import { LogOut, PlusCircle, Settings } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { AddPodcastForm } from "@/components/add-podcast-form"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"

type PodcastsHeaderProps = {
  userId: string
  onPodcastAdded?: () => void
  sharedUrl?: string | null
  autoFetch?: boolean
}

export function PodcastsHeader({ userId, onPodcastAdded, sharedUrl, autoFetch }: PodcastsHeaderProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  // URL共有連携: 共有URLがある場合は自動でダイアログを開く
  useEffect(() => {
    if (sharedUrl) {
      setOpen(true)
    }
  }, [sharedUrl])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <header className="border-b bg-gradient-to-r from-purple-50/50 to-blue-50/50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src="/podqueue-icon.svg" alt="PodQueue" width={32} height={32} />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            PodQueue
          </h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <Button onClick={() => setOpen(true)}>
            <PlusCircle className="size-4" />
            <span className="hidden sm:inline">Podcastを追加</span>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link href="/settings">
              <Settings className="size-4" />
            </Link>
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="size-4" />
            <span className="hidden sm:inline">ログアウト</span>
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <AddPodcastForm
            userId={userId}
            onSuccess={() => {
              setOpen(false)
              onPodcastAdded?.()
              // URL共有連携: 追加完了後、クエリパラメータをクリア
              if (sharedUrl) {
                router.replace("/podcasts")
              }
            }}
            initialUrl={sharedUrl || undefined}
            autoFetch={autoFetch}
          />
        </DialogContent>
      </Dialog>
    </header>
  )
}
