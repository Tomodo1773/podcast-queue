import { describe, expect, it } from "vitest"
import { buildRecommendationFlexMessage } from "../flex-message"

describe("buildRecommendationFlexMessage", () => {
  const params = {
    title: "テスト動画",
    channelLabel: "テストチャンネル",
    score: 0.75,
    videoUrl: "https://www.youtube.com/watch?v=abc123",
    thumbnailUrl: "https://example.com/thumb.jpg",
  }

  it("PodQueueに登録ボタン（messageアクション）が動画URLを送信する", () => {
    const message = buildRecommendationFlexMessage(params)
    if (message.type !== "flex") throw new Error("flex message expected")

    const buttons = message.contents.footer?.contents.filter((c) => c.type === "button") ?? []
    const registerButton = buttons.find((b) => b.type === "button" && b.action.label === "PodQueueに登録")
    expect(registerButton).toBeDefined()
    expect(registerButton?.type === "button" && registerButton.action).toEqual({
      type: "message",
      label: "PodQueueに登録",
      text: params.videoUrl,
    })
  })

  it("動画を見るボタン（uriアクション）も維持される", () => {
    const message = buildRecommendationFlexMessage(params)
    if (message.type !== "flex") throw new Error("flex message expected")

    const buttons = message.contents.footer?.contents.filter((c) => c.type === "button") ?? []
    const watchButton = buttons.find((b) => b.type === "button" && b.action.label === "動画を見る")
    expect(watchButton?.type === "button" && watchButton.action).toEqual({
      type: "uri",
      label: "動画を見る",
      uri: params.videoUrl,
    })
  })
})
