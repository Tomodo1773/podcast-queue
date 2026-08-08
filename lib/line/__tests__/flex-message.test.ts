import { describe, expect, it } from "vitest"
import { buildRecommendationCarouselMessage } from "../flex-message"

describe("buildRecommendationCarouselMessage", () => {
  const params = {
    videoId: "abc123",
    title: "テスト動画",
    channelLabel: "テストチャンネル",
    score: 0.75,
    videoUrl: "https://www.youtube.com/watch?v=abc123",
    thumbnailUrl: "https://example.com/thumb.jpg",
  }

  it("footerに動画を見る・PodQueueに登録・興味なしのボタンが含まれる", () => {
    const message = buildRecommendationCarouselMessage([params])
    if (message.type !== "flex" || message.contents.type !== "carousel") {
      throw new Error("flex carousel message expected")
    }

    expect(message.contents.contents[0].footer?.contents).toEqual([
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
      {
        type: "button",
        style: "link",
        height: "sm",
        action: {
          type: "postback",
          label: "興味なし",
          data: "action=dislike&videoId=abc123",
          displayText: "興味なし",
        },
      },
    ])
  })

  it("複数件を1つのcarouselメッセージにまとめる", () => {
    const params2 = {
      ...params,
      videoId: "def456",
      title: "テスト動画2",
      videoUrl: "https://www.youtube.com/watch?v=def456",
    }
    const message = buildRecommendationCarouselMessage([params, params2])
    if (message.type !== "flex" || message.contents.type !== "carousel") {
      throw new Error("flex carousel message expected")
    }

    expect(message.contents.contents).toHaveLength(2)
    expect(message.altText).toBe("おすすめの新着動画が2件あります")
  })
})
