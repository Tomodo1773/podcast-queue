# Dialog状態リフトアップ実装計画

## 問題

### 根本原因

`PodcastDialog` / `PodcastEditDialog` の `open` 状態が各 `PodcastCard` / `PodcastListItem` 内部の `useState` で管理されており、Dialog 自体もカード内にレンダリングされている。

フィルタリングやデータ変更（ステータス変更、優先度変更、削除）でカードがアンマウントされると、`open=true` のまま Dialog も消え、Radix UI の body スクロールロック（`pointer-events: none`）が解除されず **UIが操作不能** になる。

### なぜ「先に Dialog を閉じる」対処が不完全か

ステータス変更時に `onOpenChange(false)` を呼ぶ対症療法は、操作を追加するたびに漏れるリスクがある。根本的に Dialog のライフサイクルをカードのアンマウントから切り離す必要がある。

---

## 実装方針

Dialog 状態を `PodcastList` レベルにリフトアップし、Dialog をフィルタリングから独立させる。

### 変更対象ファイル

1. `components/podcast-card.tsx`
2. `components/podcast-list-item.tsx`
3. `components/podcast-list.tsx`
4. `components/podcast-dialog.tsx`

---

## 各ファイルの変更内容

### 1. podcast-card.tsx / podcast-list-item.tsx（共通）

**削除:**
- `isDialogOpen` / `isEditDialogOpen` の `useState`
- `PodcastDialog` / `PodcastEditDialog` のレンダリング
- import文から `PodcastDialog`, `PodcastEditDialog`, `useState` を削除
- props: `onUpdate`, `onChangeWatchedStatus`, `onRegenerateAI`（これらは Dialog を介さず PodcastList から直接 Dialog に渡す）

**追加:**
- props: `onSelect: () => void`（カードクリック時）
- props: `onEditSelect: () => void`（アクションメニューの編集クリック時）

**変更:**
- カードクリック: `setIsDialogOpen(true)` → `onSelect()`
- アクションメニューの編集: `setIsEditDialogOpen(true)` → `onEditSelect()`
- `podcast.is_watching` → `podcast.status === "watching"`（mainの変更に合わせる）

### 2. podcast-list.tsx

**state 追加:**
```tsx
const [selectedPodcastId, setSelectedPodcastId] = useState<string | null>(null)
const [editingPodcastId, setEditingPodcastId] = useState<string | null>(null)
```

**派生値（フィルタ済みリストではなく `podcasts` 全体から検索）:**
```tsx
const selectedPodcast = selectedPodcastId
  ? (podcasts.find((p) => p.id === selectedPodcastId) ?? null)
  : null
const editingPodcast = editingPodcastId
  ? (podcasts.find((p) => p.id === editingPodcastId) ?? null)
  : null
```

> ポイント: `filteredPodcasts` ではなく `podcasts` から検索することで、フィルタリングで該当カードが消えても Dialog が保持される。

**PodcastCard / PodcastListItem の props 変更:**
```tsx
// 削除
onUpdate={handleUpdatePodcast}
onChangeWatchedStatus={handleChangeWatchedStatus}
onRegenerateAI={handleRegenerateAI}

// 追加
onSelect={() => setSelectedPodcastId(podcast.id)}
onEditSelect={() => setEditingPodcastId(podcast.id)}
```

**handleDelete に Dialog 閉じ処理を追加:**
```tsx
if (selectedPodcastId === id) setSelectedPodcastId(null)
if (editingPodcastId === id) setEditingPodcastId(null)
```

**JSX 末尾に Dialog を1インスタンスずつ追加:**
```tsx
{selectedPodcast && (
  <PodcastDialog
    podcast={selectedPodcast}
    open={true}
    onOpenChange={(open) => { if (!open) setSelectedPodcastId(null) }}
    onDelete={handleDelete}
    onChangePriority={handleChangePriority}
    onStartWatching={handleStartWatching}
    onChangeWatchedStatus={handleChangeWatchedStatus}
    onRegenerateAI={handleRegenerateAI}
  />
)}
{editingPodcast && (
  <PodcastEditDialog
    podcast={editingPodcast}
    open={true}
    onOpenChange={(open) => { if (!open) setEditingPodcastId(null) }}
    onUpdate={handleUpdatePodcast}
  />
)}
```

### 3. podcast-dialog.tsx

ステータス変更時の対症療法的 `onOpenChange(false)` を削除。ステータスや優先度変更後も Dialog を開いたままにする（ユーザーが続けて操作できる方が自然）。

削除時の `onOpenChange(false)` は **残す**（削除後に Dialog を閉じるのは自然な動作）。

---

## 注意点（前回の失敗から）

**ブランチの分岐元に注意。** 前回は `chrore/update-trace-settings` ブランチにいた状態で `main` を指定してブランチを切ったが、ローカルの `main` が古く（38コミット遅れ）、最新の `origin/main` を反映していなかった。

mainには以下の破壊的変更が含まれており、コンフリクトの原因になった:
- `is_watched` / `is_watching` → `status: PodcastStatus` カラムに統合（PR #272）
- `onRegenerateAI` props の追加（PR #262）
- Notion連携、CSVエクスポートなどの新機能追加

**正しい手順:**
```bash
git fetch origin
git checkout -b fix/dialog-state-lift-up origin/main  # origin/main を明示
```

---

## 検証方法

1. `pnpm run check`（lint/format/typecheck/knip）
2. 動作確認:
   - 優先度フィルタ適用中に Dialog 内で優先度変更 → UIが操作不能にならないこと
   - 未視聴フィルタ適用中に Dialog 内でステータス変更 → 同上
   - Dialog 内で削除 → Dialog が閉じ、UIが操作可能であること
   - 通常の Dialog 開閉が正常に動作すること
   - 編集 Dialog が正常に動作すること
