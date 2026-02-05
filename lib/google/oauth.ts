const GOOGLE_OAUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"

// Google Drive のファイル作成に必要なスコープ
const SCOPES = ["https://www.googleapis.com/auth/drive.file"]

export function getGoogleAuthUrl(state: string): string {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI

  if (!clientId || !redirectUri) {
    throw new Error("Google OAuth環境変数が設定されていません")
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    state,
  })

  return `${GOOGLE_OAUTH_URL}?${params.toString()}`
}

export interface GoogleTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  scope: string
}

export async function exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse> {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Google OAuth環境変数が設定されていません")
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`トークン取得に失敗しました: ${error}`)
  }

  return response.json()
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<{ access_token: string; expires_in: number }> {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth環境変数が設定されていません")
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`トークン更新に失敗しました: ${error}`)
  }

  return response.json()
}
