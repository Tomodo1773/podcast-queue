import { beforeEach, describe, expect, it, vi } from "vitest"
import { POST } from "../route"

// Supabaseクライアントのモック
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
        order: vi.fn(),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(),
      })),
    })),
  })),
}))

// 暗号化ユーティリティのモック
vi.mock("@/lib/crypto", () => ({
  decrypt: vi.fn((token: string) => token),
}))

// Google OAuth・Driveのモック
vi.mock("@/lib/google/oauth", () => ({
  refreshAccessToken: vi.fn(() => Promise.resolve({ access_token: "mock_access_token" })),
}))

vi.mock("@/lib/google/drive", () => ({
  createMarkdownFile: vi.fn(() => Promise.resolve("mock_file_id")),
}))

describe("/api/google-drive/export-watched", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("認証されていない場合は401エラーを返す", async () => {
    const { createClient } = await import("@/lib/supabase/server")
    const mockSupabase = createClient()
    vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    })

    const request = new Request("http://localhost:3000/api/google-drive/export-watched", {
      method: "POST",
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe("認証が必要です")
  })

  it("Google Drive連携が設定されていない場合は400エラーを返す", async () => {
    const { createClient } = await import("@/lib/supabase/server")
    const mockSupabase = createClient()

    vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
      data: { user: { id: "test-user-id" } },
      error: null,
    })

    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: { message: "Not found" } })),
        })),
      })),
    }))

    vi.mocked(mockSupabase.from).mockImplementation(mockFrom as never)

    const request = new Request("http://localhost:3000/api/google-drive/export-watched", {
      method: "POST",
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe("Google Drive連携が設定されていません")
  })

  it("エクスポート対象のPodcastがない場合は成功メッセージを返す", async () => {
    const { createClient } = await import("@/lib/supabase/server")
    const mockSupabase = createClient()

    vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
      data: { user: { id: "test-user-id" } },
      error: null,
    })

    let callCount = 0
    const mockFrom = vi.fn(() => {
      callCount++
      if (callCount === 1) {
        // Google Drive設定取得
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({
                  data: {
                    user_id: "test-user-id",
                    encrypted_refresh_token: "encrypted_token",
                    folder_id: "folder_id",
                  },
                  error: null,
                })
              ),
            })),
          })),
        }
      }
      // Podcast一覧取得
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => Promise.resolve({ data: [], error: null })),
              })),
            })),
          })),
        })),
      }
    })

    vi.mocked(mockSupabase.from).mockImplementation(mockFrom as never)

    const request = new Request("http://localhost:3000/api/google-drive/export-watched", {
      method: "POST",
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBe("エクスポート対象のPodcastがありません")
    expect(data.stats.total).toBe(0)
  })
})
