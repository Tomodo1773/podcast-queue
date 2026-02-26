const NOTION_OAUTH_URL = "https://api.notion.com/v1/oauth/authorize"
const NOTION_TOKEN_URL = "https://api.notion.com/v1/oauth/token"

export function getNotionAuthUrl(state: string): string {
  const clientId = process.env.NOTION_OAUTH_CLIENT_ID
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  if (!clientId || !appUrl) {
    throw new Error("Notion OAuth環境変数が設定されていません")
  }

  const redirectUri = `${appUrl}/api/auth/notion/callback`

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    owner: "user",
    state,
  })

  return `${NOTION_OAUTH_URL}?${params.toString()}`
}

export interface NotionTokenResponse {
  access_token: string
  workspace_name: string
  workspace_id: string
  bot_id: string
}

export async function exchangeCodeForTokens(code: string): Promise<NotionTokenResponse> {
  const clientId = process.env.NOTION_OAUTH_CLIENT_ID
  const clientSecret = process.env.NOTION_OAUTH_CLIENT_SECRET
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  if (!clientId || !clientSecret || !appUrl) {
    throw new Error("Notion OAuth環境変数が設定されていません")
  }

  const redirectUri = `${appUrl}/api/auth/notion/callback`
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000)

  try {
    const response = await fetch(NOTION_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${credentials}`,
      },
      body: JSON.stringify({
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Notionトークン取得に失敗しました: ${error}`)
    }

    return response.json()
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Notionトークン取得リクエストがタイムアウトしました")
    }
    throw error
  }
}
