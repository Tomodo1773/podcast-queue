/**
 * @vitest-environment node
 */

import { cookies } from "next/headers"
import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import * as crypto from "@/lib/crypto"
import * as oauth from "@/lib/google/oauth"
import { createClient } from "@/lib/supabase/server"
import { GET } from "../route"

// モック
vi.mock("next/headers")
vi.mock("@/lib/crypto")
vi.mock("@/lib/google/oauth")
vi.mock("@/lib/supabase/server")

const mockCookieStore = {
  get: vi.fn(),
  delete: vi.fn(),
}

const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
}

describe("GET /api/auth/google/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000"
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as never)
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)
  })

  it("認証エラー時は設定ページにリダイレクトすること", async () => {
    const request = new NextRequest("http://localhost:3000/api/auth/google/callback?error=access_denied")
    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get("location")).toContain(
      "/settings?error=" + encodeURIComponent("Google認証がキャンセルされました")
    )
  })

  it("codeまたはstateが欠けている場合はエラーをリダイレクトすること", async () => {
    const request = new NextRequest("http://localhost:3000/api/auth/google/callback?code=test")
    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get("location")).toContain(
      "/settings?error=" + encodeURIComponent("認証パラメータが不正です")
    )
  })

  it("ユーザーが未ログインの場合はログインページにリダイレクトすること", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/auth/google/callback?code=test&state=valid_state"
    )
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })

    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get("location")).toContain("/auth/login")
  })

  it("CSRF検証失敗時はエラーをリダイレクトすること", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/auth/google/callback?code=test&state=invalid_state"
    )
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } })
    mockCookieStore.get.mockReturnValue({ value: "valid_state" })

    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get("location")).toContain(
      "/settings?error=" + encodeURIComponent("認証状態が不正です")
    )
    expect(mockCookieStore.delete).toHaveBeenCalledWith("oauth_state")
  })

  it("既存のフォルダIDを保持して認証を更新すること", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/auth/google/callback?code=test_code&state=valid_state"
    )
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } })
    mockCookieStore.get.mockReturnValue({ value: "valid_state" })
    vi.mocked(oauth.exchangeCodeForTokens).mockResolvedValue({
      access_token: "access-token",
      refresh_token: "refresh-token",
      expires_in: 3600,
      scope: "scope",
      token_type: "Bearer",
    })
    vi.mocked(crypto.encrypt).mockReturnValue("encrypted-refresh-token")

    const mockSelect = vi.fn().mockReturnThis()
    const mockEq = vi.fn().mockReturnThis()
    const mockSingle = vi.fn().mockResolvedValue({
      data: { folder_id: "existing-folder-id" },
      error: null,
    })
    const mockUpsert = vi.fn().mockResolvedValue({ error: null })

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "google_drive_settings") {
        return {
          select: mockSelect,
          eq: mockEq,
          single: mockSingle,
          upsert: mockUpsert,
        }
      }
      return {}
    })

    mockSelect.mockReturnValue({
      eq: mockEq,
      single: mockSingle,
    })
    mockEq.mockReturnValue({
      single: mockSingle,
    })

    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(response.headers.get("location")).toContain(
      "/settings?success=" + encodeURIComponent("Google Driveと連携しました")
    )
    expect(mockCookieStore.delete).toHaveBeenCalledWith("oauth_state")
    expect(mockUpsert).toHaveBeenCalledWith(
      {
        user_id: "user-1",
        encrypted_refresh_token: "encrypted-refresh-token",
        folder_id: "existing-folder-id",
        updated_at: expect.any(String),
      },
      { onConflict: "user_id" }
    )
  })

  it("新規連携時はfolder_idをnullで設定すること", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/auth/google/callback?code=test_code&state=valid_state"
    )
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } } })
    mockCookieStore.get.mockReturnValue({ value: "valid_state" })
    vi.mocked(oauth.exchangeCodeForTokens).mockResolvedValue({
      access_token: "access-token",
      refresh_token: "refresh-token",
      expires_in: 3600,
      scope: "scope",
      token_type: "Bearer",
    })
    vi.mocked(crypto.encrypt).mockReturnValue("encrypted-refresh-token")

    const mockSelect = vi.fn().mockReturnThis()
    const mockEq = vi.fn().mockReturnThis()
    const mockSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "PGRST116" }, // 既存データなし
    })
    const mockUpsert = vi.fn().mockResolvedValue({ error: null })

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "google_drive_settings") {
        return {
          select: mockSelect,
          eq: mockEq,
          single: mockSingle,
          upsert: mockUpsert,
        }
      }
      return {}
    })

    mockSelect.mockReturnValue({
      eq: mockEq,
      single: mockSingle,
    })
    mockEq.mockReturnValue({
      single: mockSingle,
    })

    const response = await GET(request)

    expect(response.status).toBe(307)
    expect(mockUpsert).toHaveBeenCalledWith(
      {
        user_id: "user-1",
        encrypted_refresh_token: "encrypted-refresh-token",
        folder_id: null,
        updated_at: expect.any(String),
      },
      { onConflict: "user_id" }
    )
  })
})
