import { LogOut, PlusCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import { PodcastList } from "@/components/podcast-list"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"

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
					<div className="flex items-center gap-2">
						<Image src="/podqueue-icon.svg" alt="PodQueue" width={32} height={32} />
						<h1 className="text-2xl font-bold">PodQueue</h1>
					</div>
					<div className="flex items-center gap-4">
						<Link href="/podcasts/add">
							<Button>
								<PlusCircle className="size-4" />
								<span className="hidden sm:inline">Podcastを追加</span>
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
								<LogOut className="size-4" />
								<span className="hidden sm:inline">ログアウト</span>
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
