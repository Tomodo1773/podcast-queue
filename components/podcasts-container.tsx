"use client";

import { useState, useCallback } from "react";
import { PodcastsHeader } from "@/components/podcasts-header";
import { PodcastList } from "@/components/podcast-list";

type PodcastsContainerProps = {
	userId: string;
};

export function PodcastsContainer({ userId }: PodcastsContainerProps) {
	const [refreshKey, setRefreshKey] = useState(0);

	const handlePodcastAdded = useCallback(() => {
		setRefreshKey((prev) => prev + 1);
	}, []);

	return (
		<div className="min-h-screen bg-background">
			<PodcastsHeader userId={userId} onPodcastAdded={handlePodcastAdded} />
			<main className="container mx-auto px-4 py-8">
				<PodcastList userId={userId} refreshKey={refreshKey} />
			</main>
		</div>
	);
}
