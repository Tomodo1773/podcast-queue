"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { LogOut, PlusCircle } from "lucide-react";
import { AddPodcastForm } from "@/components/add-podcast-form";
import { createClient } from "@/lib/supabase/client";

type PodcastsHeaderProps = {
	userId: string;
};

export function PodcastsHeader({ userId }: PodcastsHeaderProps) {
	const [open, setOpen] = useState(false);
	const router = useRouter();

	const handleLogout = async () => {
		const supabase = createClient();
		await supabase.auth.signOut();
		router.push("/auth/login");
	};

	return (
		<header className="border-b bg-gradient-to-r from-purple-50/50 to-blue-50/50">
			<div className="container mx-auto px-4 py-4 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Image src="/podqueue-icon.svg" alt="PodQueue" width={32} height={32} />
					<h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">PodQueue</h1>
				</div>
				<div className="flex items-center gap-4">
					<Button onClick={() => setOpen(true)}>
						<PlusCircle className="size-4" />
						<span className="hidden sm:inline">Podcastを追加</span>
					</Button>
					<Button variant="outline" onClick={handleLogout}>
						<LogOut className="size-4" />
						<span className="hidden sm:inline">ログアウト</span>
					</Button>
				</div>
			</div>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader className="border-b pb-4">
						<DialogTitle className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Podcastを追加</DialogTitle>
						<DialogDescription>PodcastのURLを入力して追加できます</DialogDescription>
					</DialogHeader>
					<AddPodcastForm userId={userId} onSuccess={() => setOpen(false)} />
				</DialogContent>
			</Dialog>
		</header>
	);
}
