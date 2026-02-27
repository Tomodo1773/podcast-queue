import { GoogleGenAI } from "@google/genai"
import { traceable } from "langsmith/traceable"

const YOUTUBE_SUMMARY_PROMPT = `提供されたYoutube動画について内容を確認した上で内容を詳細に教えてください。

## 内容のまとめ方

セクションの内容を示す文を見出し3（###）形式で1行書いたあと、セクションの内容を箇条書きで整理する。まとめた内容のみを出力する。前置きなど余計なものは出力しない

~~~
### (セクション1の内容を示す言葉)

- セクション1で語られている内容1
- セクション1で語られている内容2
:

### (セクション2の内容を示す言葉)

- セクション2で語られている内容1
:
~~~

## 内容抽出時のルール

- Youtubeの内容を漏れなくすべて記載する
- 内容に関しては「NVIDIAのビジネス展望について」など結論が分からない形ではなく、「NVIDIAの天下は今後10年続く」のように主張内容が分かるようにかく
- オープニングやエンディング、告知、番組自体に関する説明といった本編に関係ない内容は含めない
- Youtubeのタイトルやディスクリプションだけでなく、実際の動画の内容に基づいてかく`

function formatTraceInputs(inputs: unknown): Record<string, unknown> {
  const input =
    typeof inputs === "object" && inputs !== null && "input" in inputs
      ? (inputs as { input?: unknown }).input
      : null
  const url = typeof input === "string" ? input : ""

  return {
    messages: [
      {
        role: "user",
        content: [
          {
            type: "file_data",
            file_uri: url,
            mime_type: "video/*",
          },
          {
            type: "text",
            text: YOUTUBE_SUMMARY_PROMPT,
          },
        ],
      },
    ],
    url,
  }
}

/**
 * Gemini APIを使用してYouTube動画の内容を要約する（トレース対象の内部実装）
 * @param url YouTube動画のURL
 * @returns 動画内容の要約テキスト（セクション別箇条書き形式）、生成失敗時は例外を投げる
 */
async function generateYoutubeSummaryCore(url: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set, skipping YouTube summary generation")
    return null
  }

  // GoogleGenAIクライアントを作成
  const genAI = new GoogleGenAI({ apiKey })

  // fileDataを使用してYouTube動画を直接処理
  const response = await genAI.models.generateContent({
    model: "gemini-pro-latest",
    contents: [
      {
        role: "user",
        parts: [
          {
            fileData: {
              fileUri: url,
              mimeType: "video/*",
            },
          },
          {
            text: YOUTUBE_SUMMARY_PROMPT,
          },
        ],
      },
    ],
  })

  return response.text ?? null
}

/**
 * Gemini APIを使用してYouTube動画の内容を要約する
 * LangSmithトレーシングが有効な場合は自動的にトレースされる
 * @param url YouTube動画のURL
 * @returns 動画内容の要約テキスト（セクション別箇条書き形式）、生成失敗時はnull
 */
const tracedGenerateYoutubeSummary =
  process.env.LANGCHAIN_TRACING_V2 === "true"
    ? traceable(generateYoutubeSummaryCore, {
        name: "generate-youtube-summary",
        run_type: "llm",
        project_name: process.env.LANGSMITH_PROJECT,
        processInputs: formatTraceInputs,
      })
    : generateYoutubeSummaryCore

export async function generateYoutubeSummary(url: string): Promise<string | null> {
  try {
    return await tracedGenerateYoutubeSummary(url)
  } catch (error) {
    console.error("Failed to generate YouTube summary:", error)
    return null
  }
}
