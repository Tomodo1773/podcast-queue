import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PodcastList } from "@/components/podcast-list";
import { PodcastsHeader } from "@/components/podcasts-header";

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
			<PodcastsHeader userId={user.id} />
			<main className="container mx-auto px-4 py-8">
				<PodcastList userId={user.id} />
			</main>
		</div>
	);
}
