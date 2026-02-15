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

/**
 * ログ出力用に文字列をサニタイズする関数
 * Log injection対策として改行文字などの制御文字を除去
 */
function sanitizeForLog(value: unknown): string {
  if (value === null || value === undefined) {
    return String(value)
  }
  // 改行文字とその他の制御文字を除去
  // biome-ignore lint/suspicious/noControlCharactersInRegex: Log injection対策のため制御文字を除去する必要がある
  return String(value).replace(/[\r\n\t\x00-\x1F\x7F]/g, "")
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
 * NewsPicksのURLかどうかを判定する関数
 */
export function isNewsPicksUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return (
      urlObj.hostname === "newspicks.com" ||
      urlObj.hostname.endsWith(".newspicks.com") ||
      urlObj.hostname === "npx.me"
    )
  } catch {
    return false
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

/**
 * NewsPicksのタイトルから番組名プレフィックスを除去する関数
 * "番組名 | エピソード名 - NewsPicks" → "エピソード名 - NewsPicks"
 */
export function removeNewsPicksShowNamePrefix(title: string): string {
  return title.replace(/^.+?\s*\|\s*/, "")
}

/**
 * HTMLエンティティをデコードする関数
 * OGPメタタグに含まれる主要なHTMLエンティティ（&quot;、&amp;、&lt;、&gt;、&apos;など）をデコード
 */
export function decodeHtmlEntities(text: string): string {
  // &amp; や &#38; は最後にまとめて処理することで二重アンエスケープを防ぐ
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&#60;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#62;/g, ">")
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/(&amp;|&#38;)/g, "&")
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
      console.error("YouTube video not found:", sanitizeForLog(videoId))
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
    console.error("YouTube Data API fetch error:", sanitizeForLog(error))
    return null
  }
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
async function fetchSpotifyApiInfo(
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

  return {
    title: decodeHtmlEntities(title),
    description: decodeHtmlEntities(description),
    image,
    showName: null,
  }
}

/**
 * YouTubeのメタデータを取得する
 * Data API v3 → oEmbed → サムネイルURL直接構築 の順でフォールバック
 */
async function fetchYoutubeMetadata(videoId: string): Promise<Metadata> {
  // YouTube Data API v3 を優先的に使用
  const videoInfo = await fetchYouTubeVideoInfo(videoId)
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
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    const response = await fetch(oembedUrl)

    if (response.ok) {
      const data = await response.json()
      return {
        title: data.title || "",
        description: data.author_name ? `by ${data.author_name}` : "",
        image: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        showName: null,
      }
    }
  } catch (error) {
    console.error("YouTube oEmbed API error:", sanitizeForLog(error))
  }

  // フォールバック: サムネイルURLを直接構築
  return {
    title: "",
    description: "",
    image: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    showName: null,
  }
}

/**
 * Spotifyのメタデータを取得する
 * Web API → oEmbed の順でフォールバック
 */
async function fetchSpotifyMetadata(url: string, type: "episode" | "show", id: string): Promise<Metadata> {
  // Spotify Web API を優先的に使用（descriptionを取得可能）
  const info = await fetchSpotifyApiInfo(type, id)
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
    console.error("Spotify oEmbed API error:", sanitizeForLog(error))
  }

  return { title: "", description: "", image: "", showName: null }
}

/**
 * NewsPicksのメタデータを取得する
 * OGPから取得し、タイトルから番組名を抽出
 */
async function fetchNewsPicksMetadata(url: string): Promise<Metadata> {
  const ogpData = await fetchOgpMetadata(url)
  const showName = extractNewsPicksShowName(ogpData.title)
  const title = removeNewsPicksShowNamePrefix(ogpData.title)
  return { ...ogpData, title, showName }
}

/**
 * URLからメタデータを取得する
 * プラットフォームを判定し、適切な取得関数に振り分ける
 */
export async function fetchMetadata(url: string): Promise<Metadata> {
  const youtubeVideoId = extractYouTubeVideoId(url)
  if (youtubeVideoId) {
    return fetchYoutubeMetadata(youtubeVideoId)
  }

  const spotifyInfo = extractSpotifyId(url)
  if (spotifyInfo) {
    return fetchSpotifyMetadata(url, spotifyInfo.type as "episode" | "show", spotifyInfo.id)
  }

  if (isNewsPicksUrl(url)) {
    return fetchNewsPicksMetadata(url)
  }

  return fetchOgpMetadata(url)
}
