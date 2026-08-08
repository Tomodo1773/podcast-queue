import { describe, expect, it } from "vitest"
import { buildDislikePostbackData, parseDislikePostbackData } from "../postback"

describe("parseDislikePostbackData", () => {
  it("buildDislikePostbackDataが生成したdataから動画IDを取り出せる", () => {
    const data = buildDislikePostbackData("abc123")
    expect(parseDislikePostbackData(data)).toEqual({ videoId: "abc123" })
  })

  it("dislike以外のactionはnullを返す", () => {
    expect(parseDislikePostbackData("action=other&videoId=abc123")).toBeNull()
  })

  it("動画IDを含まないdataはnullを返す", () => {
    expect(parseDislikePostbackData("action=dislike")).toBeNull()
  })
})
