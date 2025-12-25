"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { PodcastCard } from "@/components/podcast-card";
import { PodcastListItem } from "@/components/podcast-list-item";
import { Button } from "@/components/ui/button";
import { Grid3x3, List, Loader2 } from "lucide-react";

type Podcast = {
	id: string;
	url: string;
	title: string | null;
	description: string | null;
	thumbnail_url: string | null;
	platform: string | null;
	is_watched: boolean;
	created_at: string;
};

type PodcastListProps = {
	userId: string;
	refreshKey?: number;
};

const VIEW_MODE_STORAGE_KEY = "podcast-view-mode";

export function PodcastList({ userId, refreshKey = 0 }: PodcastListProps) {
	const [podcasts, setPodcasts] = useState<Podcast[]>([]);
	const [filteredPodcasts, setFilteredPodcasts] = useState<Podcast[]>([]);
	const [filter, setFilter] = useState<"all" | "watched" | "unwatched">("unwatched");
	const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
			if (saved === "grid" || saved === "list") {
				return saved;
			}
		}
		return "grid";
	});
	const [isLoading, setIsLoading] = useState(true);
	const [isMobile, setIsMobile] = useState(false);

	const handleViewModeChange = (mode: "grid" | "list") => {
		setViewMode(mode);
		localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
	};

	useEffect(() => {
		loadPodcasts();
	}, [userId, refreshKey]);

	useEffect(() => {
		const checkIsMobile = () => {
			setIsMobile(window.innerWidth < 768);
		};

		checkIsMobile();
		window.addEventListener("resize", checkIsMobile);

		return () => window.removeEventListener("resize", checkIsMobile);
	}, []);

	useEffect(() => {
		applyFilter();
	}, [filter, podcasts]);

	const loadPodcasts = async () => {
		const supabase = createClient();
		setIsLoading(true);

		const { data, error } = await supabase.from("podcasts").select("*").eq("user_id", userId).order("created_at", { ascending: false });

		if (error) {
			console.error("[v0] Podcastの読み込みエラー:", error);
		} else {
			setPodcasts(data || []);
		}
		setIsLoading(false);
	};

	const applyFilter = () => {
		if (filter === "all") {
			setFilteredPodcasts(podcasts);
		} else if (filter === "watched") {
			setFilteredPodcasts(podcasts.filter((p) => p.is_watched));
		} else {
			setFilteredPodcasts(podcasts.filter((p) => !p.is_watched));
		}
	};

	const handleToggleWatched = async (id: string, currentStatus: boolean) => {
		const supabase = createClient();

		const { error } = await supabase.from("podcasts").update({ is_watched: !currentStatus }).eq("id", id);

		if (error) {
			console.error("[v0] ステータス更新エラー:", error);
		} else {
			setPodcasts((prev) => prev.map((p) => (p.id === id ? { ...p, is_watched: !currentStatus } : p)));
		}
	};

	const handleDelete = async (id: string) => {
		const supabase = createClient();

		const { error } = await supabase.from("podcasts").delete().eq("id", id);

		if (error) {
			console.error("[v0] 削除エラー:", error);
		} else {
			setPodcasts((prev) => prev.filter((p) => p.id !== id));
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="size-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
				<div className="flex items-center gap-2 overflow-x-auto">
					<Button variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>
						すべて ({podcasts.length})
					</Button>
					<Button variant={filter === "unwatched" ? "default" : "outline"} onClick={() => setFilter("unwatched")}>
						未視聴 ({podcasts.filter((p) => !p.is_watched).length})
					</Button>
					<Button variant={filter === "watched" ? "default" : "outline"} onClick={() => setFilter("watched")}>
						視聴済み ({podcasts.filter((p) => p.is_watched).length})
					</Button>
				</div>

				{/* View mode toggle buttons */}
				<div className="flex items-center gap-2 justify-end">
					<Button size="sm" variant={viewMode === "grid" ? "default" : "outline"} onClick={() => handleViewModeChange("grid")} title="グリッド表示" aria-label="グリッド表示に切り替え">
						<Grid3x3 className="size-4" />
					</Button>
					<Button size="sm" variant={viewMode === "list" ? "default" : "outline"} onClick={() => handleViewModeChange("list")} title="リスト表示" aria-label="リスト表示に切り替え">
						<List className="size-4" />
					</Button>
				</div>
			</div>

			{filteredPodcasts.length === 0 ? (
				<div className="text-center py-12">
					<p className="text-muted-foreground">{filter === "all" ? "まだPodcastが登録されていません" : `${filter === "watched" ? "視聴済み" : "未視聴"}のPodcastがありません`}</p>
				</div>
			) : viewMode === "grid" ? (
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
					{filteredPodcasts.map((podcast) => (
						<PodcastCard key={podcast.id} podcast={podcast} onToggleWatched={handleToggleWatched} onDelete={handleDelete} />
					))}
				</div>
			) : (
				<div className="space-y-4">
					{filteredPodcasts.map((podcast) => (
						<PodcastListItem key={podcast.id} podcast={podcast} onToggleWatched={handleToggleWatched} onDelete={handleDelete} />
					))}
				</div>
			)}
		</div>
	);
}
