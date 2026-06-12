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

  it("footerに動画を見るボタンとPodQueueに登録ボタンが含まれる", () => {
    const message = buildRecommendationFlexMessage(params)
    if (message.type !== "flex") throw new Error("flex message expected")

    expect(message.contents.footer?.contents).toEqual([
      {
        type: "button",
        style: "primary",
        height: "sm",
        action: { type: "uri", label: "動画を見る", uri: params.videoUrl },
      },
      {
        type: "button",
        style: "secondary",
        height: "sm",
        action: { type: "message", label: "PodQueueに登録", text: params.videoUrl },
      },
    ])
  })
})
