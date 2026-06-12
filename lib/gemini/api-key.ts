/**
 * GEMINI_API_KEYを取得する。未設定時はスキップ理由をwarnしてnullを返す
 * （ソフトフェイル系の生成関数で共通利用。戻り値の決定は呼び出し側に委ねる）
 */
export function getGeminiApiKey(context: string): string | null {
  const key = process.env.GEMINI_API_KEY
  if (!key) {
    console.warn(`GEMINI_API_KEY is not set, skipping ${context}`)
    return null
  }
  return key
}
