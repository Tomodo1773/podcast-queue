import { beforeEach, describe, expect, it, vi } from "vitest"
import { getStats } from "./actions"

// Supabaseクライアントのモック
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              order: vi.fn(() => ({
                data: [],
              })),
            })),
          })),
          gte: vi.fn(() => ({
            order: vi.fn(() => ({
              data: [],
            })),
          })),
          count: 0,
        })),
        count: 0,
      })),
    })),
  })),
}))

describe("getStats", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("統計データの構造が正しい", async () => {
    const stats = await getStats("test-user-id")

    expect(stats).toHaveProperty("total")
    expect(stats).toHaveProperty("today")
    expect(stats).toHaveProperty("thisWeek")
    expect(stats).toHaveProperty("thisMonth")
    expect(stats).toHaveProperty("averagePerDay")
    expect(stats).toHaveProperty("averagePerWeek")
    expect(stats).toHaveProperty("dailyStats")
    expect(stats).toHaveProperty("weeklyStats")
    expect(stats).toHaveProperty("monthlyStats")
    expect(stats).toHaveProperty("platformStats")
  })

  it("数値型のフィールドが数値である", async () => {
    const stats = await getStats("test-user-id")

    expect(typeof stats.total).toBe("number")
    expect(typeof stats.today).toBe("number")
    expect(typeof stats.thisWeek).toBe("number")
    expect(typeof stats.thisMonth).toBe("number")
    expect(typeof stats.averagePerDay).toBe("number")
    expect(typeof stats.averagePerWeek).toBe("number")
  })

  it("配列型のフィールドが配列である", async () => {
    const stats = await getStats("test-user-id")

    expect(Array.isArray(stats.dailyStats)).toBe(true)
    expect(Array.isArray(stats.weeklyStats)).toBe(true)
    expect(Array.isArray(stats.monthlyStats)).toBe(true)
    expect(Array.isArray(stats.platformStats)).toBe(true)
  })

  it("dailyStatsの長さが30である", async () => {
    const stats = await getStats("test-user-id")

    expect(stats.dailyStats.length).toBe(30)
  })

  it("weeklyStatsの長さが12である", async () => {
    const stats = await getStats("test-user-id")

    expect(stats.weeklyStats.length).toBe(12)
  })

  it("monthlyStatsの長さが12である", async () => {
    const stats = await getStats("test-user-id")

    expect(stats.monthlyStats.length).toBe(12)
  })
})
