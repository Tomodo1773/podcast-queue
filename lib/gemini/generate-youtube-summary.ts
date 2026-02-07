import { createGoogleGenerativeAI } from "@ai-sdk/google"
import * as ai from "ai"
import { wrapAISDK } from "langsmith/experimental/vercel"

const YOUTUBE_SUMMARY_PROMPT = `提供されたYoutube動画について内容を確認した上で内容を詳細に教えてください。

## 内容のまとめ方

セクションごとに箇条書きで整理する。まとめた内容のみを出力する。前置きなど余計なものは出力しない

- (セクション1の内容を示す言葉)
	- セクションで語られている内容1
	- セクションで語られている内容2
	- :
-  (セクション2の内容を示す言葉)
	- セクションで語られている内容1
	- :

## 内容抽出時のルール

- Youtubeの内容を漏れなくすべて記載する
- 内容に関しては「NVIDIAのビジネス展望について」など結論が分からない形ではなく、「NVIDIAの天下は今後10年続く」のように主張内容が分かるようにかく
- オープニングやエンディング、告知、番組自体に関する説明といった本編に関係ない内容は含めない
- Youtubeのタイトルやディスクリプションだけでなく、実際の動画の内容に基づいてかく`

// LangSmithトレーシングが有効な場合はAI SDKをラップ
const { generateText } =
  process.env.LANGCHAIN_TRACING_V2 === "true"
    ? wrapAISDK(ai, {
        project_name: process.env.LANGSMITH_PROJECT,
      })
    : ai

/**
 * Gemini APIを使用してYouTube動画の内容を要約する
 * @param url YouTube動画のURL
 * @returns 動画内容の要約テキスト（セクション別箇条書き形式）、生成失敗時はnull
 */
export async function generateYoutubeSummary(url: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set, skipping YouTube summary generation")
    return null
  }

  try {
    // API Keyを使用してGoogleクライアントを作成
    const google = createGoogleGenerativeAI({
      apiKey,
    })

    const result = await generateText({
      model: google("gemini-3-pro-preview"),
      prompt: `${YOUTUBE_SUMMARY_PROMPT}

## Youtubeリンク
${url}`,
    })

    return result.text
  } catch (error) {
    console.error("Failed to generate YouTube summary:", error)
    return null
  }
}
