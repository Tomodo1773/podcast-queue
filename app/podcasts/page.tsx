import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PodcastList } from "@/components/podcast-list";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default async function PodcastsPage() {
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		redirect("/auth/login");
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
								<PlusCircle className="mr-2 size-4" />
								Podcastを追加
							</Button>
						</Link>
						<form
							action={async () => {
								"use server";
								const supabase = await createClient();
								await supabase.auth.signOut();
								redirect("/auth/login");
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
	);
}
