"use client";

import type React from "react";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

type AddPodcastFormProps = {
	userId: string;
	onSuccess?: () => void;
};

export function AddPodcastForm({ userId, onSuccess }: AddPodcastFormProps) {
	const [url, setUrl] = useState("");
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [thumbnailUrl, setThumbnailUrl] = useState("");
	const [platform, setPlatform] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();

	const detectPlatform = (url: string): string => {
		if (url.includes("youtube.com") || url.includes("youtu.be")) return "YouTube";
		if (url.includes("spotify.com")) return "Spotify";
		if (url.includes("newspicks.com") || url.includes("npx.me")) return "NewsPicks";
		if (url.includes("pivot")) return "Pivot";
		return "その他";
	};

	const handleFetchMetadata = async () => {
		if (!url) return;

		setIsFetchingMetadata(true);
		setError(null);

		try {
			const response = await fetch("/api/fetch-metadata", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ url }),
			});

			if (!response.ok) {
				throw new Error("メタデータの取得に失敗しました");
			}

			const data = await response.json();

			if (data.title) setTitle(data.title);
			if (data.description) setDescription(data.description);
			if (data.image) setThumbnailUrl(data.image);
		} catch (error: unknown) {
			console.error("メタデータ取得エラー:", error);
			setError("メタデータの取得に失敗しました。手動で入力してください。");
		} finally {
			setIsFetchingMetadata(false);
		}
	};

	const handleUrlChange = (newUrl: string) => {
		setUrl(newUrl);
		if (newUrl) {
			setPlatform(detectPlatform(newUrl));
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		console.log("[v0] フォーム送信開始");
		const supabase = createClient();
		setIsLoading(true);
		setError(null);

		try {
			console.log("[v0] ユーザーIDを確認:", userId);
			const {
				data: { user },
				error: userError,
			} = await supabase.auth.getUser();
			console.log("[v0] 認証ユーザー:", user);

			if (userError) {
				console.error("[v0] 認証エラー:", userError);
				throw new Error("認証に失敗しました。再度ログインしてください。");
			}

			if (!user) {
				throw new Error("ログインが必要です");
			}

			console.log("[v0] Podcast挿入開始");
			const podcastData = {
				user_id: user.id,
				url,
				title: title || null,
				description: description || null,
				thumbnail_url: thumbnailUrl || null,
				platform: platform || null,
				is_watched: false,
			};
			console.log("[v0] 挿入データ:", podcastData);

			const { data, error: insertError } = await supabase.from("podcasts").insert(podcastData).select();

			console.log("[v0] 挿入結果:", { data, insertError });

			if (insertError) {
				console.error("[v0] 挿入エラー:", insertError);
				throw insertError;
			}

			console.log("[v0] Podcast追加成功、リダイレクト開始");
			if (onSuccess) {
				onSuccess();
			} else {
				router.push("/podcasts");
			}
			router.refresh();
			console.log("[v0] フォーム送信完了");
		} catch (error: unknown) {
			console.error("[v0] Podcast追加エラー:", error);
			setError(error instanceof Error ? error.message : "Podcastの追加に失敗しました");
			setIsLoading(false);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>新しいPodcastを追加</CardTitle>
				<CardDescription>PodcastのURLを入力して、自動的にメタデータを取得できます</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-6">
					<div className="space-y-2">
						<Label htmlFor="url">URL *</Label>
						<div className="flex gap-2">
							<Input id="url" type="url" placeholder="https://..." required value={url} onChange={(e) => handleUrlChange(e.target.value)} className="flex-1" />
							<Button type="button" variant="outline" onClick={handleFetchMetadata} disabled={!url || isFetchingMetadata}>
								{isFetchingMetadata ? (
									<>
										<Loader2 className="mr-2 size-4 animate-spin" />
										取得中
									</>
								) : (
									"メタデータ取得"
								)}
							</Button>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="title">タイトル</Label>
						<Input id="title" type="text" placeholder="Podcastのタイトル" value={title} onChange={(e) => setTitle(e.target.value)} />
					</div>

					<div className="space-y-2">
						<Label htmlFor="description">説明</Label>
						<Textarea id="description" placeholder="Podcastの説明" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
					</div>

					<div className="space-y-2">
						<Label htmlFor="thumbnail">サムネイルURL</Label>
						<Input id="thumbnail" type="url" placeholder="https://..." value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} />
					</div>

					<div className="space-y-2">
						<Label htmlFor="platform">プラットフォーム</Label>
						<Input id="platform" type="text" placeholder="YouTube, Spotify等" value={platform} onChange={(e) => setPlatform(e.target.value)} />
					</div>

					{error && <p className="text-sm text-destructive">{error}</p>}

					<div className="flex gap-2">
						<Button type="submit" disabled={isLoading} className="flex-1">
							{isLoading ? (
								<>
									<Loader2 className="mr-2 size-4 animate-spin" />
									追加中...
								</>
							) : (
								"追加"
							)}
						</Button>
						<Button type="button" variant="outline" onClick={() => router.push("/podcasts")}>
							キャンセル
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}
