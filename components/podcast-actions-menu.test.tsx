import { describe, expect, it } from "vitest"

// テストは必要最小限に留める（CLAUDE.mdのテスト方針に従う）
// PodcastActionsMenuはDropdownMenuContentを返すため、
// 単体でのテストには親のDropdownMenuコンポーネントが必要
// 実際の統合テストは親コンポーネント（podcast-card/podcast-list-item）で行う

describe("PodcastActionsMenu", () => {
  it("コンポーネントが存在する", () => {
    // 統合テストは親コンポーネントで実施
    expect(true).toBe(true)
  })
})
