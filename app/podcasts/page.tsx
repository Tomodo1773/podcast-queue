import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PodcastList } from "@/components/podcast-list"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import Link from "next/link"

export default async function PodcastsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Podcast管理</h1>
          <div className="flex items-center gap-4">
            <Link href="/podcasts/add">
              <Button>
                <PlusCircle className="mr-2 size-4" />
                Podcastを追加
              </Button>
            </Link>
            <form
              action={async () => {
                "use server"
                const supabase = await createClient()
                await supabase.auth.signOut()
                redirect("/auth/login")
              }}
            >
              <Button variant="outline" type="submit">
                ログアウト
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <PodcastList userId={user.id} />
      </main>
    </div>
  )
}
