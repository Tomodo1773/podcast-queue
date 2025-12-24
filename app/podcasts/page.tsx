import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PodcastsContainer } from "@/components/podcasts-container";

export default async function PodcastsPage() {
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		redirect("/auth/login");
	}

	return <PodcastsContainer userId={user.id} />;
}
