import type { ReactNode } from "react"

type SimpleMarkdownProps = {
  text: string
  className?: string
}

/**
 * 簡易マークダウンレンダラー
 * 太字（**text**）、見出し（### text）、箇条書き（- item）のみサポート
 */
export function SimpleMarkdown({ text, className }: SimpleMarkdownProps) {
  const lines = text.split("\n")
  const elements: ReactNode[] = []
  let listItems: ReactNode[] = []
  let nextElementId = 0
  let nextListId = 0
  let currentListId = 0

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${nextListId}`} className="list-disc list-inside space-y-1">
          {listItems}
        </ul>
      )
      nextListId += 1
      listItems = []
    }
  }

  const parseBold = (line: string): ReactNode[] => {
    const parts: ReactNode[] = []
    let lastIndex = 0
    const regex = /\*\*(.+?)\*\*/g
    let match: RegExpExecArray | null = regex.exec(line)

    while (match !== null) {
      if (match.index > lastIndex) {
        parts.push(line.slice(lastIndex, match.index))
      }
      parts.push(<strong key={`bold-${match.index}`}>{match[1]}</strong>)
      lastIndex = regex.lastIndex
      match = regex.exec(line)
    }

    if (lastIndex < line.length) {
      parts.push(line.slice(lastIndex))
    }

    return parts.length > 0 ? parts : [line]
  }

  lines.forEach((line) => {
    const trimmed = line.trim()

    if (trimmed.startsWith("### ")) {
      flushList()
      const content = trimmed.slice(4)
      elements.push(
        <h3 key={`h3-${nextElementId}`} className="font-bold mt-4 mb-2 break-all">
          {parseBold(content)}
        </h3>
      )
      nextElementId += 1
    } else if (trimmed.startsWith("- ")) {
      if (listItems.length === 0) {
        currentListId = nextListId
      }
      const content = trimmed.slice(2)
      listItems.push(<li key={`li-${currentListId}-${listItems.length}`}>{parseBold(content)}</li>)
    } else {
      flushList()
      if (trimmed.length > 0) {
        elements.push(
          <p key={`p-${nextElementId}`} className="break-all">
            {parseBold(trimmed)}
          </p>
        )
        nextElementId += 1
      }
    }
  })

  flushList()

  return <div className={className}>{elements}</div>
}
