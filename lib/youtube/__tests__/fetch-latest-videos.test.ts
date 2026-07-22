import { describe, expect, it } from "vitest"
import { parseDurationSeconds } from "../fetch-latest-videos"

describe("parseDurationSeconds", () => {
  it("時分秒を秒数に変換する", () => {
    expect(parseDurationSeconds("PT45S")).toBe(45)
    expect(parseDurationSeconds("PT1M30S")).toBe(90)
    expect(parseDurationSeconds("PT10M")).toBe(600)
    expect(parseDurationSeconds("PT1H2M3S")).toBe(3723)
  })

  it("パースできない場合はnullを返す", () => {
    expect(parseDurationSeconds("invalid")).toBeNull()
  })
})
