"use client"

import { ArrowUpDown, Grid3x3, List, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { PodcastCard } from "@/components/podcast-card"
import { PodcastListItem } from "@/components/podcast-list-item"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { getPriorityLabel, getPriorityOrder, type Priority } from "@/lib/utils"

type Podcast = {
	id: string
	url: string
	title: string | null
	description: string | null
	thumbnail_url: string | null
	platform: string | null
	priority: Priority
	is_watched: boolean
	is_watching: boolean
	watched_at: string | null
	created_at: string
}

type PodcastListProps = {
	userId: string
	refreshKey?: number
}

const VIEW_MODE_STORAGE_KEY = "podcast-view-mode"

type SortOption = "created_at" | "priority"

export function PodcastList({ userId, refreshKey = 0 }: PodcastListProps) {
	const [podcasts, setPodcasts] = useState<Podcast[]>([])
	const [filteredPodcasts, setFilteredPodcasts] = useState<Podcast[]>([])
	const [filter, setFilter] = useState<"all" | "watched" | "unwatched">("unwatched")
	const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all")
	const [sortBy, setSortBy] = useState<SortOption>("created_at")
	const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem(VIEW_MODE_STORAGE_KEY)
			if (saved === "grid" || saved === "list") {
				return saved
			}
		}
		return "grid"
	})
	const [isLoading, setIsLoading] = useState(true)

	const handleViewModeChange = (mode: "grid" | "list") => {
		setViewMode(mode)
		localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode)
	}

	useEffect(() => {
		loadPodcasts()
	}, [userId, refreshKey])


	useEffect(() => {
		applyFilterAndSort()
	}, [filter, priorityFilter, sortBy, podcasts])

	const loadPodcasts = async () => {
		const supabase = createClient()
		setIsLoading(true)

		const { data, error } = await supabase
			.from("podcasts")
			.select("*")
			.eq("user_id", userId)
			.order("created_at", { ascending: false })

		if (error) {
			console.error("[v0] Podcastの読み込みエラー:", error)
		} else {
			setPodcasts(data || [])
		}
		setIsLoading(false)
	}

	const applyFilterAndSort = () => {
		let result = [...podcasts]

		// 視聴状態フィルタ
		if (filter === "watched") {
			result = result.filter((p) => p.is_watched)
		} else if (filter === "unwatched") {
			result = result.filter((p) => !p.is_watched)
		}

		// 優先度フィルタ
		if (priorityFilter !== "all") {
			result = result.filter((p) => p.priority === priorityFilter)
		}

		// 並び替え
		if (sortBy === "priority") {
			result.sort((a, b) => getPriorityOrder(a.priority) - getPriorityOrder(b.priority))
		}
		// created_atの場合はすでにDBから降順で取得済み

		// 視聴中を先頭に移動
		result.sort((a, b) => {
			if (a.is_watching && !b.is_watching) return -1
			if (!a.is_watching && b.is_watching) return 1
			return 0 // 既存の並び順を維持
		})

		setFilteredPodcasts(result)
	}

	const handleToggleWatched = async (id: string, currentStatus: boolean) => {
		const supabase = createClient()
		const newStatus = !currentStatus
		const watched_at = newStatus ? new Date().toISOString() : null

		// 視聴済みにする場合は視聴中も解除
		const updateData = {
			is_watched: newStatus,
			watched_at,
			...(newStatus && { is_watching: false }),
		}

		const { error } = await supabase.from("podcasts").update(updateData).eq("id", id)

		if (error) {
			console.error("[v0] ステータス更新エラー:", error)
		} else {
			setPodcasts((prev) =>
				prev.map((p) =>
					p.id === id
						? {
								...p,
								is_watched: newStatus,
								watched_at,
								is_watching: newStatus ? false : p.is_watching,
							}
						: p
				)
			)
		}
	}

	const handleDelete = async (id: string) => {
		const supabase = createClient()

		const { error } = await supabase.from("podcasts").delete().eq("id", id)

		if (error) {
			console.error("[v0] 削除エラー:", error)
		} else {
			setPodcasts((prev) => prev.filter((p) => p.id !== id))
		}
	}

	const handleChangePriority = async (id: string, newPriority: Priority) => {
		const supabase = createClient()

		const { error } = await supabase.from("podcasts").update({ priority: newPriority }).eq("id", id)

		if (error) {
			console.error("[v0] 優先度更新エラー:", error)
		} else {
			setPodcasts((prev) => prev.map((p) => (p.id === id ? { ...p, priority: newPriority } : p)))
		}
	}

	const handleStartWatching = async (id: string) => {
		const supabase = createClient()

		// 1. 現在視聴中のものをすべて解除
		await supabase
			.from("podcasts")
			.update({ is_watching: false })
			.eq("user_id", userId)
			.eq("is_watching", true)

		// 2. 対象を視聴中に設定
		const { error } = await supabase.from("podcasts").update({ is_watching: true }).eq("id", id)

		if (error) {
			console.error("[v0] 視聴中設定エラー:", error)
		} else {
			// 3. ローカルstate更新
			setPodcasts((prev) =>
				prev.map((p) => ({
					...p,
					is_watching: p.id === id,
				}))
			)
		}
	}

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="size-8 animate-spin text-muted-foreground" />
			</div>
		)
	}

	return (
		<div className="space-y-6">
			{/* 視聴状態フィルタ */}
			<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
				<div className="flex items-center gap-2 overflow-x-auto">
					<Button variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>
						すべて ({podcasts.length})
					</Button>
					<Button
						variant={filter === "unwatched" ? "default" : "outline"}
						onClick={() => setFilter("unwatched")}
					>
						未視聴 ({podcasts.filter((p) => !p.is_watched).length})
					</Button>
					<Button variant={filter === "watched" ? "default" : "outline"} onClick={() => setFilter("watched")}>
						視聴済み ({podcasts.filter((p) => p.is_watched).length})
					</Button>
				</div>

				{/* View mode toggle buttons */}
				<div className="flex items-center gap-2 justify-end">
					<Button
						size="sm"
						variant={viewMode === "grid" ? "default" : "outline"}
						onClick={() => handleViewModeChange("grid")}
						title="グリッド表示"
						aria-label="グリッド表示に切り替え"
					>
						<Grid3x3 className="size-4" />
					</Button>
					<Button
						size="sm"
						variant={viewMode === "list" ? "default" : "outline"}
						onClick={() => handleViewModeChange("list")}
						title="リスト表示"
						aria-label="リスト表示に切り替え"
					>
						<List className="size-4" />
					</Button>
				</div>
			</div>

			{/* 優先度フィルタ・並び替え */}
			<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
				<div className="flex items-center gap-2 overflow-x-auto">
					<span className="text-sm text-muted-foreground whitespace-nowrap">優先度:</span>
					<Button
						size="sm"
						variant={priorityFilter === "all" ? "default" : "outline"}
						onClick={() => setPriorityFilter("all")}
					>
						すべて
					</Button>
					<Button
						size="sm"
						variant={priorityFilter === "high" ? "default" : "outline"}
						onClick={() => setPriorityFilter("high")}
					>
						{getPriorityLabel("high")}
					</Button>
					<Button
						size="sm"
						variant={priorityFilter === "medium" ? "default" : "outline"}
						onClick={() => setPriorityFilter("medium")}
					>
						{getPriorityLabel("medium")}
					</Button>
					<Button
						size="sm"
						variant={priorityFilter === "low" ? "default" : "outline"}
						onClick={() => setPriorityFilter("low")}
					>
						{getPriorityLabel("low")}
					</Button>
				</div>

				<div className="flex items-center gap-2">
					<span className="text-sm text-muted-foreground whitespace-nowrap">並び替え:</span>
					<Button
						size="sm"
						variant={sortBy === "created_at" ? "default" : "outline"}
						onClick={() => setSortBy("created_at")}
					>
						追加日順
					</Button>
					<Button
						size="sm"
						variant={sortBy === "priority" ? "default" : "outline"}
						onClick={() => setSortBy("priority")}
					>
						<ArrowUpDown className="size-3 mr-1" />
						優先度順
					</Button>
				</div>
			</div>

			{filteredPodcasts.length === 0 ? (
				<div className="text-center py-12">
					<p className="text-muted-foreground">
						{filter === "all"
							? "まだPodcastが登録されていません"
							: `${filter === "watched" ? "視聴済み" : "未視聴"}のPodcastがありません`}
					</p>
				</div>
			) : viewMode === "grid" ? (
				<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
					{filteredPodcasts.map((podcast) => (
						<PodcastCard
							key={podcast.id}
							podcast={podcast}
							onToggleWatched={handleToggleWatched}
							onDelete={handleDelete}
							onChangePriority={handleChangePriority}
							onStartWatching={handleStartWatching}
						/>
					))}
				</div>
			) : (
				<div className="space-y-4">
					{filteredPodcasts.map((podcast) => (
						<PodcastListItem
							key={podcast.id}
							podcast={podcast}
							onToggleWatched={handleToggleWatched}
							onDelete={handleDelete}
							onChangePriority={handleChangePriority}
							onStartWatching={handleStartWatching}
						/>
					))}
				</div>
			)}
		</div>
	)
}
