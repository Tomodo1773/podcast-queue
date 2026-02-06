/**
 * メタデータ取得のコアロジック
 * API RouteやLINE Webhookなど複数の場所から再利用可能
 */

export interface Metadata {
  title: string
  description: string
  image: string
  showName: string | null
}

// YouTube Data API v3を使って動画情報を取得する関数
async function fetchYouTubeVideoInfo(videoId: string): Promise<{
  title: string
  description: string
  thumbnail: string
  channelTitle: string | null
} | null> {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) {
    console.warn("YOUTUBE_API_KEY is not set, falling back to oEmbed")
    return null
  }

  try {
    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`
    const response = await fetch(apiUrl)

    if (!response.ok) {
      console.error("YouTube Data API error:", response.status, response.statusText)
      return null
    }

    const data = await response.json()
    if (!data.items || data.items.length === 0) {
      console.error("YouTube video not found:", videoId)
      return null
    }

    const snippet = data.items[0].snippet
    return {
      title: snippet.title || "",
      description: snippet.description || "",
      thumbnail:
        snippet.thumbnails?.maxres?.url ||
        snippet.thumbnails?.high?.url ||
        snippet.thumbnails?.medium?.url ||
        `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      channelTitle: snippet.channelTitle || null,
    }
  } catch (error) {
    console.error("YouTube Data API fetch error:", error)
    return null
  }
}

/**
 * YouTube動画IDを抽出する関数
 * 対応形式: youtube.com/watch?v=xxx, youtu.be/xxx, youtube.com/shorts/xxx, youtube.com/live/xxx
 */
export function extractYouTubeVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url)

    // ホスト名を厳密に検証
    const isYouTube =
      urlObj.hostname === "youtube.com" ||
      urlObj.hostname === "www.youtube.com" ||
      urlObj.hostname.endsWith(".youtube.com") ||
      urlObj.hostname === "youtu.be"

    if (!isYouTube) return null

    // youtube.com/watch?v=xxx
    if (urlObj.pathname === "/watch") {
      return urlObj.searchParams.get("v")
    }

    // youtube.com/shorts/xxx, youtube.com/live/xxx, youtube.com/embed/xxx
    const match = urlObj.pathname.match(/^\/(shorts|live|embed)\/([^/?]+)$/)
    if (match) return match[2]

    // youtu.be/xxx
    if (urlObj.hostname === "youtu.be") {
      const match = urlObj.pathname.match(/^\/([^/?]+)$/)
      return match?.[1] || null
    }

    return null
  } catch {
    return null
  }
}

/**
 * Spotify IDを抽出する関数
 * 対応形式: spotify.com/episode/xxx, spotify.com/show/xxx
 */
export function extractSpotifyId(url: string): { type: string; id: string } | null {
  try {
    const urlObj = new URL(url)

    // ホスト名を厳密に検証
    const isSpotify =
      urlObj.hostname === "spotify.com" ||
      urlObj.hostname === "open.spotify.com" ||
      urlObj.hostname.endsWith(".spotify.com")

    if (!isSpotify) return null

    const match = urlObj.pathname.match(/^\/(episode|show)\/([^/?]+)$/)
    if (match) {
      return { type: match[1], id: match[2] }
    }

    return null
  } catch {
    return null
  }
}

/**
 * NewsPicksのタイトルから番組名を抽出する関数
 * タイトル形式: "番組名 | エピソード名 - NewsPicks"
 */
export function extractNewsPicksShowName(title: string): string | null {
  const match = title.match(/^(.+?)\s*\|\s*/)
  return match?.[1]?.trim() || null
}

// Spotifyアクセストークンを取得する関数（Client Credentials Flow）
async function getSpotifyAccessToken(): Promise<string | null> {
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.warn("Spotify credentials not set, falling back to oEmbed")
    return null
  }

  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: "grant_type=client_credentials",
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.access_token
  } catch {
    return null
  }
}

// Spotify Web APIでエピソード/番組情報を取得する関数
async function fetchSpotifyInfo(
  type: "episode" | "show",
  id: string
): Promise<{ title: string; description: string; thumbnail: string; showName: string | null } | null> {
  const accessToken = await getSpotifyAccessToken()
  if (!accessToken) {
    return null
  }

  try {
    const endpoint =
      type === "episode"
        ? `https://api.spotify.com/v1/episodes/${id}?market=JP`
        : `https://api.spotify.com/v1/shows/${id}?market=JP`

    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()

    // エピソードの場合はshowオブジェクトから番組名を取得、番組ページの場合は番組名自体を取得
    const showName = type === "episode" ? data.show?.name || null : type === "show" ? data.name || null : null

    return {
      title: data.name || "",
      description: data.description || data.html_description || "",
      thumbnail: data.images?.[0]?.url || "",
      showName,
    }
  } catch {
    return null
  }
}

// OGP/一般的なメタデータを取得する関数
async function fetchOgpMetadata(url: string): Promise<Metadata> {
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
    html.match(/<meta name="description" content="([^"]*)">/)
  const description = descriptionMatch ? descriptionMatch[1] : ""

  const imageMatch =
    html.match(/<meta property="og:image" content="([^"]*)"/) ||
    html.match(/<meta name="twitter:image" content="([^"]*)">/)
  const image = imageMatch ? imageMatch[1] : ""

  return { title, description, image, showName: null }
}

/**
 * URLからメタデータを取得する
 * YouTube, Spotify, 一般的なOGPに対応
 */
export async function fetchMetadata(url: string): Promise<Metadata> {
  // YouTube処理
  const youtubeVideoId = extractYouTubeVideoId(url)
  if (youtubeVideoId) {
    // YouTube Data API v3 を優先的に使用
    const videoInfo = await fetchYouTubeVideoInfo(youtubeVideoId)
    if (videoInfo) {
      return {
        title: videoInfo.title,
        description: videoInfo.description,
        image: videoInfo.thumbnail,
        showName: videoInfo.channelTitle,
      }
    }

    // API Key がない場合や API 失敗時は oEmbed にフォールバック
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeVideoId}&format=json`
      const response = await fetch(oembedUrl)

      if (response.ok) {
        const data = await response.json()
        return {
          title: data.title || "",
          description: data.author_name ? `by ${data.author_name}` : "",
          image: data.thumbnail_url || `https://img.youtube.com/vi/${youtubeVideoId}/maxresdefault.jpg`,
          showName: null,
        }
      }
    } catch (error) {
      console.error("YouTube oEmbed API error:", error)
    }

    // フォールバック: サムネイルURLを直接構築
    return {
      title: "",
      description: "",
      image: `https://img.youtube.com/vi/${youtubeVideoId}/maxresdefault.jpg`,
      showName: null,
    }
  }

  // Spotify処理
  const spotifyInfo = extractSpotifyId(url)
  if (spotifyInfo) {
    // Spotify Web API を優先的に使用（descriptionを取得可能）
    const info = await fetchSpotifyInfo(spotifyInfo.type as "episode" | "show", spotifyInfo.id)
    if (info) {
      return {
        title: info.title,
        description: info.description,
        image: info.thumbnail,
        showName: info.showName,
      }
    }

    // API失敗時はoEmbedにフォールバック（descriptionは取得不可）
    try {
      const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`
      const response = await fetch(oembedUrl)

      if (response.ok) {
        const data = await response.json()
        return {
          title: data.title || "",
          description: "",
          image: data.thumbnail_url || "",
          showName: null,
        }
      }
    } catch (error) {
      console.error("Spotify oEmbed API error:", error)
    }

    return { title: "", description: "", image: "", showName: null }
  }

  // NewsPicks処理
  try {
    const urlObj = new URL(url)
    if (
      urlObj.hostname === "newspicks.com" ||
      urlObj.hostname.endsWith(".newspicks.com") ||
      urlObj.hostname === "npx.me"
    ) {
      const ogpData = await fetchOgpMetadata(url)
      const showName = extractNewsPicksShowName(ogpData.title)
      return { ...ogpData, showName }
    }
  } catch {
    // URLのパースに失敗した場合は無視してOGP取得へ
  }

  // その他のURLの場合はOGPで取得
  return fetchOgpMetadata(url)
}
