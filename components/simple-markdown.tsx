import type { ReactNode } from "react"

type SimpleMarkdownProps = {
  text: string
  className?: string
}

/**
 * 簡易マークダウンレンダラー
 * 太字（**text**）と箇条書き（- item）のみサポート
 */
export function SimpleMarkdown({ text, className }: SimpleMarkdownProps) {
  const lines = text.split("\n")
  const elements: ReactNode[] = []
  let listItems: ReactNode[] = []
  let listStartIndex = 0

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${listStartIndex}`} className="list-disc list-inside space-y-1">
          {listItems}
        </ul>
      )
      listItems = []
    }
  }

  const parseBold = (line: string, lineIndex: number): ReactNode[] => {
    const parts: ReactNode[] = []
    let lastIndex = 0
    const regex = /\*\*(.+?)\*\*/g
    let match: RegExpExecArray | null = regex.exec(line)

    while (match !== null) {
      if (match.index > lastIndex) {
        parts.push(line.slice(lastIndex, match.index))
      }
      parts.push(<strong key={`bold-${lineIndex}-${match.index}`}>{match[1]}</strong>)
      lastIndex = regex.lastIndex
      match = regex.exec(line)
    }

    if (lastIndex < line.length) {
      parts.push(line.slice(lastIndex))
    }

    return parts.length > 0 ? parts : [line]
  }

  lines.forEach((line, index) => {
    const trimmed = line.trim()

    if (trimmed.startsWith("- ")) {
      if (listItems.length === 0) {
        listStartIndex = index
      }
      const content = trimmed.slice(2)
      listItems.push(<li key={`li-${listStartIndex}-${listItems.length}`}>{parseBold(content, index)}</li>)
    } else {
      flushList()
      if (trimmed.length > 0) {
        elements.push(
          <p key={`p-${index}-${line.substring(0, 10)}`} className="break-all">
            {parseBold(trimmed, index)}
          </p>
        )
      }
    }
  })

  flushList()

  return <div className={className}>{elements}</div>
}
