import type { LineMessage } from "./reply"

/**
 * LINE Push APIを使用してメッセージを送信（cron等のreply tokenがない場面で使用）
 */
export async function pushMessage(to: string, messages: LineMessage[]): Promise<void> {
  const accessToken = process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN

  if (!accessToken) {
    throw new Error("LINE_MESSAGING_CHANNEL_ACCESS_TOKEN is not set")
  }

  const response = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      to,
      messages,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`LINE push failed (${response.status}): ${errorText}`)
  }
}
