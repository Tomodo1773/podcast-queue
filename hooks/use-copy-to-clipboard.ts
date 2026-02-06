import { useCallback, useEffect, useRef, useState } from "react"

/**
 * クリップボードにテキストをコピーするカスタムフック
 * @returns {Object} - isCopied: コピー成功状態, copyToClipboard: コピー実行関数
 */
export function useCopyToClipboard() {
  const [isCopied, setIsCopied] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // コンポーネントのアンマウント時にタイムアウトをクリーンアップ
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setIsCopied(true)

      // 既存のタイムアウトをクリア
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // 1.5秒後にisCopiedをfalseに戻す
      timeoutRef.current = setTimeout(() => {
        setIsCopied(false)
        timeoutRef.current = null
      }, 1500)
    } catch (error) {
      console.error("クリップボードへのコピーに失敗しました:", error)
    }
  }, [])

  return { isCopied, copyToClipboard }
}
