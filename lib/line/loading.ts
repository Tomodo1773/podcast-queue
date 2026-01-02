/**
 * LINE Messaging API ローディングアニメーション機能
 * ユーザーにBotが処理中であることを視覚的に伝える
 */

/**
 * ローディングアニメーションを表示
 * @param chatId ユーザーID
 * @param loadingSeconds 表示秒数（5〜60秒、デフォルト: 10秒）
 */
export async function showLoadingAnimation(chatId: string, loadingSeconds: number = 10): Promise<void> {
  const accessToken = process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN

  if (!accessToken) {
    console.error("LINE_MESSAGING_CHANNEL_ACCESS_TOKEN is not set")
    return
  }

  try {
    const response = await fetch("https://api.line.me/v2/bot/chat/loading/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        chatId,
        loadingSeconds,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("LINE loading animation failed:", response.status, errorText)
    }
  } catch (error) {
    // ローディングアニメーションの失敗はメイン処理に影響させない
    console.error("Failed to show loading animation:", error)
  }
}
