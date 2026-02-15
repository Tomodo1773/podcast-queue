/**
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from "vitest"
import { DriveAuthError, getDriveAuth } from "../drive-auth"

// モック
vi.mock("@/lib/crypto", () => ({
  decrypt: vi.fn().mockReturnValue("decrypted-refresh-token"),
}))

const mockRefreshAccessToken = vi.fn()
vi.mock("@/lib/google/oauth", () => ({
  refreshAccessToken: (...args: unknown[]) => mockRefreshAccessToken(...args),
  TokenRefreshError: class TokenRefreshError extends Error {
    constructor(
      message: string,
      public readonly isInvalidGrant: boolean
    ) {
      super(message)
      this.name = "TokenRefreshError"
    }
  },
}))

function createMockSupabase(settings: Record<string, unknown> | null, settingsError: unknown = null) {
  const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({}) })
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: settings,
            error: settingsError,
          }),
        }),
      }),
      update: mockUpdate,
    }),
    _mockUpdate: mockUpdate,
  }
}

describe("getDriveAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("正常時にaccessTokenとfolderIdを返すこと", async () => {
    const supabase = createMockSupabase({
      encrypted_refresh_token: "encrypted-token",
      folder_id: "folder-123",
    })
    mockRefreshAccessToken.mockResolvedValueOnce({ access_token: "access-token-123" })

    const result = await getDriveAuth(supabase as never, "user-1")

    expect(result).toEqual({ accessToken: "access-token-123", folderId: "folder-123" })
  })

  it("設定が存在しない場合にDriveAuthError(400)をスローすること", async () => {
    const supabase = createMockSupabase(null, { code: "PGRST116" })

    await expect(getDriveAuth(supabase as never, "user-1")).rejects.toThrow(DriveAuthError)
    await expect(getDriveAuth(supabase as never, "user-1")).rejects.toMatchObject({
      statusCode: 400,
    })
  })

  it("folder_idが未設定の場合にDriveAuthError(400)をスローすること", async () => {
    const supabase = createMockSupabase({
      encrypted_refresh_token: "encrypted-token",
      folder_id: null,
    })

    await expect(getDriveAuth(supabase as never, "user-1")).rejects.toThrow(DriveAuthError)
    await expect(getDriveAuth(supabase as never, "user-1")).rejects.toMatchObject({
      statusCode: 400,
      message: "保存先フォルダが設定されていません",
    })
  })

  it("invalid_grant時にトークンをクリアしDriveAuthError(401)をスローすること", async () => {
    const supabase = createMockSupabase({
      encrypted_refresh_token: "encrypted-token",
      folder_id: "folder-123",
    })

    // TokenRefreshErrorのモックをインポートして使用
    const { TokenRefreshError } = await import("@/lib/google/oauth")
    mockRefreshAccessToken.mockRejectedValueOnce(new TokenRefreshError("invalid", true))

    await expect(getDriveAuth(supabase as never, "user-1")).rejects.toMatchObject({
      statusCode: 401,
      code: "REAUTH_REQUIRED",
    })

    // トークンクリアが呼ばれたことを確認
    expect(supabase._mockUpdate).toHaveBeenCalled()
  })

  it("invalid_grant以外のエラーはそのままスローすること", async () => {
    const supabase = createMockSupabase({
      encrypted_refresh_token: "encrypted-token",
      folder_id: "folder-123",
    })
    mockRefreshAccessToken.mockRejectedValueOnce(new Error("network error"))

    await expect(getDriveAuth(supabase as never, "user-1")).rejects.toThrow("network error")
  })
})

describe("DriveAuthError", () => {
  it("プロパティが正しく設定されること", () => {
    const error = new DriveAuthError("test", 401, "REAUTH_REQUIRED")
    expect(error.message).toBe("test")
    expect(error.statusCode).toBe(401)
    expect(error.code).toBe("REAUTH_REQUIRED")
    expect(error.name).toBe("DriveAuthError")
  })

  it("codeなしで作成できること", () => {
    const error = new DriveAuthError("test", 400)
    expect(error.code).toBeUndefined()
  })
})
