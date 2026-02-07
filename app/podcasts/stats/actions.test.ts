import { beforeEach, describe, expect, it, vi } from "vitest"
import { getStats } from "./actions"

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
        })),
      })),
    })),
  })),
}))

describe("getStats", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should return stats object with correct structure", async () => {
    const stats = await getStats("test-user-id")

    expect(stats).toHaveProperty("total")
    expect(stats).toHaveProperty("thisWeek")
    expect(stats).toHaveProperty("thisMonth")
    expect(stats).toHaveProperty("dailyStats")
    expect(stats).toHaveProperty("weeklyStats")
    expect(stats).toHaveProperty("monthlyStats")
    expect(stats).toHaveProperty("platformStats")
    expect(stats).toHaveProperty("averagePerDay")
    expect(stats).toHaveProperty("averagePerWeek")
  })

  it("should return numbers for total, thisWeek, thisMonth", async () => {
    const stats = await getStats("test-user-id")

    expect(typeof stats.total).toBe("number")
    expect(typeof stats.thisWeek).toBe("number")
    expect(typeof stats.thisMonth).toBe("number")
    expect(typeof stats.averagePerDay).toBe("number")
    expect(typeof stats.averagePerWeek).toBe("number")
  })

  it("should return arrays for stats", async () => {
    const stats = await getStats("test-user-id")

    expect(Array.isArray(stats.dailyStats)).toBe(true)
    expect(Array.isArray(stats.weeklyStats)).toBe(true)
    expect(Array.isArray(stats.monthlyStats)).toBe(true)
    expect(Array.isArray(stats.platformStats)).toBe(true)
  })

  it("should return 30 daily stats", async () => {
    const stats = await getStats("test-user-id")

    expect(stats.dailyStats).toHaveLength(30)
  })

  it("should return 12 weekly stats", async () => {
    const stats = await getStats("test-user-id")

    expect(stats.weeklyStats).toHaveLength(12)
  })

  it("should return 12 monthly stats", async () => {
    const stats = await getStats("test-user-id")

    expect(stats.monthlyStats).toHaveLength(12)
  })
})
