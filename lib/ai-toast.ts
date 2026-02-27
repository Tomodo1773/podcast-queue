import { toast } from "sonner"

type AIGenerateResult = { summary?: string | null }

export function showAIGenerateToasts(
  promise: Promise<AIGenerateResult>,
  platform: string | null | undefined,
  mode: "add" | "regenerate" = "add"
): void {
  const verb = mode === "regenerate" ? "再生成" : "生成"

  toast.promise(promise, {
    loading: `AIがタグ・出演者を${verb}中...`,
    success: `タグ・出演者の${verb}が完了しました`,
    error: `タグ・出演者の${verb}に失敗しました`,
  })

  if (platform === "youtube") {
    toast.promise(
      promise.then((result) => {
        if (!result.summary) throw new Error("文字起こしが生成されませんでした")
      }),
      {
        loading: "AIがYouTube動画を文字起こし中...",
        success: "YouTube動画の文字起こしが完了しました",
        error: "YouTube文字起こしに失敗しました",
      }
    )
  }
}
