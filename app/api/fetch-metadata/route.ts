import { NextResponse } from "next/server"

// YouTube動画IDを抽出する関数
function extractYouTubeVideoId(url: string): string | null {
	const patterns = [
		/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/,
		/youtube\.com\/shorts\/([^&?/]+)/,
		/youtube\.com\/live\/([^&?/]+)/,
	]

	for (const pattern of patterns) {
		const match = url.match(pattern)
		if (match?.[1]) {
			return match[1]
		}
	}

	return null
}

// Spotify IDを抽出する関数
function extractSpotifyId(url: string): { type: string; id: string } | null {
	const match = url.match(/spotify\.com\/(episode|show)\/([^?&/]+)/)
	if (match?.[2]) {
		return { type: match[1], id: match[2] }
	}
	return null
}

export async function POST(request: Request) {
	try {
		const { url } = await request.json()

		if (!url) {
			return NextResponse.json({ error: "URLが必要です" }, { status: 400 })
		}

		const youtubeVideoId = extractYouTubeVideoId(url)
		if (youtubeVideoId) {
			try {
				const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeVideoId}&format=json`
				const response = await fetch(oembedUrl)

				if (response.ok) {
					const data = await response.json()
					return NextResponse.json({
						title: data.title || "",
						description: data.author_name ? `by ${data.author_name}` : "",
						image: data.thumbnail_url || `https://img.youtube.com/vi/${youtubeVideoId}/maxresdefault.jpg`,
					})
				}
			} catch (error) {
				console.error("[v0] YouTube oEmbed API error:", error)
				// フォールバック: サムネイルURLを直接構築
				return NextResponse.json({
					title: "",
					description: "",
					image: `https://img.youtube.com/vi/${youtubeVideoId}/maxresdefault.jpg`,
				})
			}
		}

		const spotifyInfo = extractSpotifyId(url)
		if (spotifyInfo) {
			try {
				const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`
				const response = await fetch(oembedUrl)

				if (response.ok) {
					const data = await response.json()
					return NextResponse.json({
						title: data.title || "",
						description: "",
						image: data.thumbnail_url || "",
					})
				}
			} catch (error) {
				console.error("[v0] Spotify oEmbed API error:", error)
			}
		}

		// その他のURLの場合は通常のメタデータ取得
		const response = await fetch(url, {
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
			},
		})

		if (!response.ok) {
			throw new Error("URLの取得に失敗しました")
		}

		const html = await response.text()

		// OGタグとメタタグからメタデータを抽出
		const titleMatch =
			html.match(/<meta property="og:title" content="([^"]*)"/) ||
			html.match(/<meta name="twitter:title" content="([^"]*)"/) ||
			html.match(/<title>([^<]*)<\/title>/)
		const title = titleMatch ? titleMatch[1] : ""

		const descriptionMatch =
			html.match(/<meta property="og:description" content="([^"]*)"/) ||
			html.match(/<meta name="twitter:description" content="([^"]*)"/) ||
			html.match(/<meta name="description" content="([^"]*)"/)
		const description = descriptionMatch ? descriptionMatch[1] : ""

		const imageMatch =
			html.match(/<meta property="og:image" content="([^"]*)"/) ||
			html.match(/<meta name="twitter:image" content="([^"]*)"/)
		const image = imageMatch ? imageMatch[1] : ""

		return NextResponse.json({
			title,
			description,
			image,
		})
	} catch (error: unknown) {
		console.error("[v0] メタデータ取得エラー:", error)
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "メタデータの取得に失敗しました" },
			{ status: 500 },
		)
	}
}
