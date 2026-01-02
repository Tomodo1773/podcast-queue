import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { SettingsForm } from "@/components/settings-form"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"

export default async function SettingsPage() {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()

	if (!user) {
		redirect("/auth/login")
	}

	// 既存のLINE連携情報を取得
	const { data: lineLink } = await supabase
		.from("line_user_links")
		.select("line_user_id")
		.eq("user_id", user.id)
		.single()

	return (
		<div className="min-h-screen bg-gradient-to-br from-purple-50/30 to-blue-50/30">
			<header className="border-b bg-white/80 backdrop-blur-sm">
				<div className="container mx-auto px-4 py-4">
					<div className="flex items-center gap-4">
						<Button variant="ghost" size="icon" asChild>
							<Link href="/podcasts">
								<ArrowLeft className="size-4" />
							</Link>
						</Button>
						<h1 className="text-xl font-bold">設定</h1>
					</div>
				</div>
			</header>

			<main className="container mx-auto px-4 py-8 max-w-2xl">
				<SettingsForm userId={user.id} initialLineUserId={lineLink?.line_user_id || ""} />
			</main>
		</div>
	)
}
