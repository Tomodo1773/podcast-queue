import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { AddPodcastForm } from "@/components/add-podcast-form"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"

export default async function AddPodcastPage() {
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
				<div className="container mx-auto px-4 py-4 flex items-center gap-4">
					<Link href="/podcasts">
						<Button variant="ghost" size="icon">
							<ArrowLeft className="size-5" />
						</Button>
					</Link>
					<h1 className="text-2xl font-bold">Podcastを追加</h1>
				</div>
			</header>
			<main className="container mx-auto px-4 py-8 max-w-2xl">
				<AddPodcastForm userId={user.id} />
			</main>
		</div>
	)
}
