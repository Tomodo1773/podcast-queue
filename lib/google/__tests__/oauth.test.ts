/**
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from "vitest"
import { refreshAccessToken, TokenRefreshError } from "../oauth"

// グローバルfetchをモック
const mockFetch = vi.fn()
global.fetch = mockFetch

describe("TokenRefreshError", () => {
  it("isInvalidGrantフラグが正しく設定されること", () => {
    const error = new TokenRefreshError("テストエラー", true)
    expect(error.isInvalidGrant).toBe(true)
    expect(error.message).toBe("テストエラー")
    expect(error.name).toBe("TokenRefreshError")
  })

  it("isInvalidGrant=falseで作成できること", () => {
    const error = new TokenRefreshError("テストエラー", false)
    expect(error.isInvalidGrant).toBe(false)
  })
})

describe("refreshAccessToken", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // 環境変数をモック
    process.env.GOOGLE_OAUTH_CLIENT_ID = "test-client-id"
    process.env.GOOGLE_OAUTH_CLIENT_SECRET = "test-client-secret"
  })

  it("成功時にアクセストークンを返すこと", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: "new-access-token",
        expires_in: 3600,
      }),
    })

    const result = await refreshAccessToken("test-refresh-token")
    expect(result.access_token).toBe("new-access-token")
    expect(result.expires_in).toBe(3600)
  })

  it("invalid_grantエラー時にTokenRefreshErrorをスローすること", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      text: async () => JSON.stringify({ error: "invalid_grant" }),
    })

    try {
      await refreshAccessToken("invalid-refresh-token")
      expect.fail("例外がスローされるべきでした")
    } catch (error) {
      expect(error).toBeInstanceOf(TokenRefreshError)
      expect((error as TokenRefreshError).isInvalidGrant).toBe(true)
    }
  })

  it("invalid_grant以外のエラー時はisInvalidGrant=falseであること", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      text: async () => JSON.stringify({ error: "server_error" }),
    })

    try {
      await refreshAccessToken("test-refresh-token")
    } catch (error) {
      expect(error).toBeInstanceOf(TokenRefreshError)
      expect((error as TokenRefreshError).isInvalidGrant).toBe(false)
    }
  })

  it("JSONパースに失敗してもエラーをスローすること", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      text: async () => "invalid json",
    })

    await expect(refreshAccessToken("test-refresh-token")).rejects.toThrow(TokenRefreshError)
  })

  it("環境変数が未設定時にエラーをスローすること", async () => {
    delete process.env.GOOGLE_OAUTH_CLIENT_ID

    await expect(refreshAccessToken("test-refresh-token")).rejects.toThrow(
      "Google OAuth環境変数が設定されていません"
    )
  })
})
