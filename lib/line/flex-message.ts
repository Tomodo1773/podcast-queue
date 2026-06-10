/**
 * LINE Flex Message生成関数
 */

import type { FlexBubble, LineMessage } from "./reply"

type SuccessMessageParams = {
  thumbnailUrl: string
  title: string
  description: string
  listUrl: string
}

/**
 * 文字列を指定した長さで切り詰める
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 1) + "…"
}

/**
 * 成功時のFlex Messageを生成
 */
export function buildSuccessFlexMessage(params: SuccessMessageParams): LineMessage {
  const title = truncate(params.title, 50)
  const description = truncate(params.description, 70)

  const bubble: FlexBubble = {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: "聞きたいリストに追加しました🎧",
          weight: "bold",
          size: "sm",
          color: "#1DB446",
        },
        {
          type: "text",
          text: title,
          weight: "bold",
          size: "xl",
          margin: "md",
          wrap: true,
        },
        {
          type: "text",
          text: description || "説明なし",
          size: "sm",
          color: "#666666",
          margin: "md",
          wrap: true,
          maxLines: 3,
        },
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      contents: [
        {
          type: "button",
          style: "primary",
          height: "sm",
          action: {
            type: "uri",
            label: "リストを見る",
            uri: params.listUrl,
          },
        },
      ],
      flex: 0,
    },
  }

  // サムネイルがある場合はheroセクションを追加
  if (params.thumbnailUrl) {
    bubble.hero = {
      type: "image",
      url: params.thumbnailUrl,
      size: "full",
      aspectRatio: "20:13",
      aspectMode: "cover",
    }
  }

  return {
    type: "flex",
    altText: `聞きたいリストに追加しました: ${title}`,
    contents: bubble,
  }
}

type RecommendationMessageParams = {
  title: string
  channelLabel: string
  score: number
  videoUrl: string
  thumbnailUrl: string
}

/**
 * レコメンド通知のFlex Messageを生成
 * スコアは閾値チューニングのため通知に表示する
 */
export function buildRecommendationFlexMessage(params: RecommendationMessageParams): LineMessage {
  const title = truncate(params.title, 50)

  const bubble: FlexBubble = {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: "おすすめの新着動画🎯",
          weight: "bold",
          size: "sm",
          color: "#1DB446",
        },
        {
          type: "text",
          text: title,
          weight: "bold",
          size: "xl",
          margin: "md",
          wrap: true,
        },
        {
          type: "text",
          text: `${params.channelLabel}｜類似度 ${params.score.toFixed(2)}`,
          size: "sm",
          color: "#666666",
          margin: "md",
          wrap: true,
        },
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      contents: [
        {
          type: "button",
          style: "primary",
          height: "sm",
          action: {
            type: "uri",
            label: "動画を見る",
            uri: params.videoUrl,
          },
        },
      ],
      flex: 0,
    },
  }

  if (params.thumbnailUrl) {
    bubble.hero = {
      type: "image",
      url: params.thumbnailUrl,
      size: "full",
      aspectRatio: "20:13",
      aspectMode: "cover",
    }
  }

  return {
    type: "flex",
    altText: `おすすめの新着動画: ${title}`,
    contents: bubble,
  }
}

/**
 * エラー時のテキストメッセージを生成
 */
export function buildErrorMessage(errorMessage: string): LineMessage {
  return {
    type: "text",
    text: `❌ ${errorMessage}`,
  }
}

/**
 * メタデータ取得失敗時（URLのみ登録）のテキストメッセージを生成
 */
export function buildMetadataFailedMessage(url: string, listUrl: string): LineMessage {
  return {
    type: "text",
    text: `📝 聞きたいリストに追加しました\n\n${url}\n\n※メタデータの取得に失敗したため、URLのみ登録しました。\n\nリストを見る: ${listUrl}`,
  }
}
