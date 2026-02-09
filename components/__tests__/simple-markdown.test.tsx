/**
 * @vitest-environment happy-dom
 */
import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { SimpleMarkdown } from "../simple-markdown"

describe("SimpleMarkdown", () => {
  it("通常のテキストを<p>タグでレンダリングすること", () => {
    const { container } = render(<SimpleMarkdown text="これは通常のテキストです" />)
    const paragraph = container.querySelector("p")
    expect(paragraph).not.toBeNull()
    expect(paragraph?.textContent).toBe("これは通常のテキストです")
  })

  it("太字（**text**）を<strong>タグでレンダリングすること", () => {
    const { container } = render(<SimpleMarkdown text="これは**太字**のテキストです" />)
    const strongElement = container.querySelector("strong")
    expect(strongElement).not.toBeNull()
    expect(strongElement?.textContent).toBe("太字")
  })

  it("複数の太字を正しくレンダリングすること", () => {
    const { container } = render(<SimpleMarkdown text="**最初の太字**と**次の太字**があります" />)
    const strongElements = container.querySelectorAll("strong")
    expect(strongElements).toHaveLength(2)
    expect(strongElements[0].textContent).toBe("最初の太字")
    expect(strongElements[1].textContent).toBe("次の太字")
  })

  it("箇条書き（- item）を<ul><li>タグでレンダリングすること", () => {
    const text = `- アイテム1
- アイテム2
- アイテム3`
    const { container } = render(<SimpleMarkdown text={text} />)
    const ul = container.querySelector("ul")
    expect(ul).not.toBeNull()
    const listItems = container.querySelectorAll("li")
    expect(listItems).toHaveLength(3)
    expect(listItems[0].textContent).toBe("アイテム1")
    expect(listItems[1].textContent).toBe("アイテム2")
    expect(listItems[2].textContent).toBe("アイテム3")
  })

  it("箇条書き内の太字を正しくレンダリングすること", () => {
    const text = `- **重要な**アイテム
- 通常のアイテム`
    const { container } = render(<SimpleMarkdown text={text} />)
    const strongElement = container.querySelector("strong")
    expect(strongElement).not.toBeNull()
    expect(strongElement?.textContent).toBe("重要な")
  })

  it("複数行のテキストと箇条書きを混在して正しくレンダリングすること", () => {
    const text = `これは導入文です

- アイテム1
- アイテム2

これは結論文です`
    const { container } = render(<SimpleMarkdown text={text} />)
    const paragraphs = container.querySelectorAll("p")
    expect(paragraphs).toHaveLength(2)
    const ul = container.querySelector("ul")
    expect(ul).not.toBeNull()
  })

  it("空行を無視すること", () => {
    const text = `テキスト1

テキスト2`
    const { container } = render(<SimpleMarkdown text={text} />)
    const paragraphs = container.querySelectorAll("p")
    expect(paragraphs).toHaveLength(2)
  })

  it("classNameプロパティを正しく適用すること", () => {
    const { container } = render(<SimpleMarkdown text="テスト" className="custom-class" />)
    const div = container.firstChild as HTMLElement
    expect(div.className).toBe("custom-class")
  })

  it("太字がない場合でも正常に動作すること", () => {
    const { container } = render(<SimpleMarkdown text="太字なしのテキスト" />)
    const paragraph = container.querySelector("p")
    expect(paragraph).not.toBeNull()
    expect(paragraph?.textContent).toBe("太字なしのテキスト")
  })

  it("箇条書きが連続していない場合、複数の<ul>を作成すること", () => {
    const text = `- アイテム1
- アイテム2

段落

- アイテム3
- アイテム4`
    const { container } = render(<SimpleMarkdown text={text} />)
    const uls = container.querySelectorAll("ul")
    expect(uls).toHaveLength(2)
    expect(uls[0].querySelectorAll("li")).toHaveLength(2)
    expect(uls[1].querySelectorAll("li")).toHaveLength(2)
  })

  it("Geminiが生成する実際のフォーマットを正しくレンダリングすること", () => {
    const text = `**イントロダクション**
- ポイント1
- ポイント2

**メインコンテンツ**
- 詳細1
- 詳細2`
    const { container } = render(<SimpleMarkdown text={text} />)
    const strongElements = container.querySelectorAll("strong")
    expect(strongElements).toHaveLength(2)
    expect(strongElements[0].textContent).toBe("イントロダクション")
    expect(strongElements[1].textContent).toBe("メインコンテンツ")

    const uls = container.querySelectorAll("ul")
    expect(uls).toHaveLength(2)
  })

  it("見出し3（### text）を<h3>タグでレンダリングすること", () => {
    const { container } = render(<SimpleMarkdown text="### これは見出しです" />)
    const h3Element = container.querySelector("h3")
    expect(h3Element).not.toBeNull()
    expect(h3Element?.textContent).toBe("これは見出しです")
  })

  it("見出し3内の太字を正しくレンダリングすること", () => {
    const { container } = render(<SimpleMarkdown text="### **重要な**見出し" />)
    const h3Element = container.querySelector("h3")
    const strongElement = h3Element?.querySelector("strong")
    expect(strongElement).not.toBeNull()
    expect(strongElement?.textContent).toBe("重要な")
  })

  it("見出し3と箇条書きを混在して正しくレンダリングすること", () => {
    const text = `### セクション1

- アイテム1
- アイテム2

### セクション2

- アイテム3`
    const { container } = render(<SimpleMarkdown text={text} />)
    const h3Elements = container.querySelectorAll("h3")
    expect(h3Elements).toHaveLength(2)
    expect(h3Elements[0].textContent).toBe("セクション1")
    expect(h3Elements[1].textContent).toBe("セクション2")

    const uls = container.querySelectorAll("ul")
    expect(uls).toHaveLength(2)
  })

  it("Geminiが生成する新しいフォーマット（### 見出し）を正しくレンダリングすること", () => {
    const text = `### イントロダクション

- ポイント1
- ポイント2

### メインコンテンツ

- 詳細1
- 詳細2`
    const { container } = render(<SimpleMarkdown text={text} />)
    const h3Elements = container.querySelectorAll("h3")
    expect(h3Elements).toHaveLength(2)
    expect(h3Elements[0].textContent).toBe("イントロダクション")
    expect(h3Elements[1].textContent).toBe("メインコンテンツ")

    const uls = container.querySelectorAll("ul")
    expect(uls).toHaveLength(2)
  })
})
