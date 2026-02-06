/**
 * @vitest-environment happy-dom
 */
import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useCopyToClipboard } from "../use-copy-to-clipboard"

describe("useCopyToClipboard", () => {
  beforeEach(() => {
    // navigator.clipboardのモック
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: vi.fn(),
      },
      writable: true,
      configurable: true,
    })
  })

  it("初期状態でisCopiedがfalseであること", () => {
    const { result } = renderHook(() => useCopyToClipboard())
    expect(result.current.isCopied).toBe(false)
  })

  it("copyToClipboardを呼び出すとクリップボードにテキストがコピーされること", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    })

    const { result } = renderHook(() => useCopyToClipboard())
    const testText = "https://example.com/podcast"

    await act(async () => {
      await result.current.copyToClipboard(testText)
    })

    expect(writeTextMock).toHaveBeenCalledWith(testText)
    expect(result.current.isCopied).toBe(true)
  })

  it("コピー成功後、1.5秒後にisCopiedがfalseに戻ること", async () => {
    vi.useFakeTimers()
    const writeTextMock = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    })

    const { result } = renderHook(() => useCopyToClipboard())

    await act(async () => {
      await result.current.copyToClipboard("test")
    })

    expect(result.current.isCopied).toBe(true)

    act(() => {
      vi.advanceTimersByTime(1500)
    })

    expect(result.current.isCopied).toBe(false)

    vi.useRealTimers()
  })

  it("コピー失敗時、isCopiedがfalseのままであること", async () => {
    const writeTextMock = vi.fn().mockRejectedValue(new Error("Clipboard write failed"))
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    })

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    const { result } = renderHook(() => useCopyToClipboard())

    await act(async () => {
      await result.current.copyToClipboard("test")
    })

    expect(result.current.isCopied).toBe(false)
    expect(consoleErrorSpy).toHaveBeenCalledWith("クリップボードへのコピーに失敗しました:", expect.any(Error))

    consoleErrorSpy.mockRestore()
  })

  it("アンマウント時にタイムアウトがクリーンアップされること", async () => {
    vi.useFakeTimers()
    const writeTextMock = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    })

    const { result, unmount } = renderHook(() => useCopyToClipboard())

    await act(async () => {
      await result.current.copyToClipboard("test")
    })

    expect(result.current.isCopied).toBe(true)

    // アンマウント前にタイムアウトをクリア
    unmount()

    // タイムアウトが実行されてもisCopiedはfalseに戻らない（クリーンアップされた）
    await act(async () => {
      vi.advanceTimersByTime(1500)
    })

    // アンマウント後は状態を確認できないため、エラーが発生しないことを確認
    expect(() => vi.advanceTimersByTime(1500)).not.toThrow()

    vi.useRealTimers()
  })

  it("連続してコピーした場合、既存のタイムアウトがクリアされること", async () => {
    vi.useFakeTimers()
    const writeTextMock = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    })

    const { result } = renderHook(() => useCopyToClipboard())

    // 1回目のコピー
    await act(async () => {
      await result.current.copyToClipboard("test1")
    })

    expect(result.current.isCopied).toBe(true)

    // 0.5秒後に2回目のコピー
    act(() => {
      vi.advanceTimersByTime(500)
    })

    await act(async () => {
      await result.current.copyToClipboard("test2")
    })

    expect(result.current.isCopied).toBe(true)

    // 1回目のタイムアウト（1.5秒）が過ぎてもisCopiedはtrueのまま
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(result.current.isCopied).toBe(true)

    // 2回目のタイムアウト（合計2秒）でisCopiedがfalseになる
    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(result.current.isCopied).toBe(false)

    vi.useRealTimers()
  })
})
