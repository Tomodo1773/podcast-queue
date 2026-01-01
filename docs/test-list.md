# テストリスト

本ドキュメントは、PodQueueアプリケーションで実装すべきテストをリスト化したものです。

## テスト方針

- カバレッジだけを追い求めず、開発者が認知・管理できる範囲に留める
- 正常系を中心にテストを実装
- 異常系は必要最低限のものに限定
- 1人開発のため、過度な品質は追求しない

---

## 優先度：高

純粋関数でモック不要、アプリのコアロジックを担うため、テスト価値が最も高い。

### ユーティリティ関数 (`lib/utils.ts`)

#### `detectPlatform`
- [ ] YouTube URLを正しく判定できる (`youtube.com`, `youtu.be`)
- [ ] Spotify URLを正しく判定できる
- [ ] NewsPicks URLを正しく判定できる (`newspicks.com`, `npx.me`)
- [ ] Pivot URLを正しく判定できる
- [ ] テレ東Biz URLを正しく判定できる
- [ ] 未知のURLは `other` を返す

#### `getPlatformLabel`
- [ ] 各プラットフォームに対応するラベルを正しく返す
- [ ] null/undefinedの場合は「その他」を返す

#### `getPriorityLabel`
- [ ] high/medium/lowに対応するラベル（高/中/低）を正しく返す

#### `getPriorityOrder`
- [ ] 優先度を正しいソート順（high:0, medium:1, low:2）で返す

### URL解析関数 (`lib/metadata/fetcher.ts`)

#### `extractYouTubeVideoId`
- [ ] 標準形式 (`youtube.com/watch?v=xxx`) からIDを抽出できる
- [ ] 短縮形式 (`youtu.be/xxx`) からIDを抽出できる
- [ ] Shorts形式 (`youtube.com/shorts/xxx`) からIDを抽出できる
- [ ] Live形式 (`youtube.com/live/xxx`) からIDを抽出できる
- [ ] 無効なURLの場合はnullを返す

#### `extractSpotifyId`
- [ ] エピソードURLからtype(`episode`)とIDを抽出できる
- [ ] 番組URLからtype(`show`)とIDを抽出できる
- [ ] 無効なURLの場合はnullを返す

---

## 優先度：中

多少のモックやセットアップが必要だが、ユーザー体験に直結する重要な機能。

### コンポーネント - フィルタリング・並び替え (`components/podcast-list.tsx`)

ロジック部分のみ。UI表示は手動確認やE2Eでカバー可能。

- [ ] 視聴状態フィルタ（すべて/未視聴/視聴済み）が正しく動作する
- [ ] 優先度フィルタが正しく動作する
- [ ] 並び替え（追加日順/優先度順）が正しく動作する

---

## 優先度：低

以下は実装コストに対してテスト価値が低い、または他のテストでカバーされる。

### `fetchMetadata` (`lib/metadata/fetcher.ts`)

外部API（YouTube, Spotify, OGP）呼び出しが中心。ほぼモックになるため価値が薄い。
URL解析のコアロジックは `extractYouTubeVideoId` / `extractSpotifyId` のテストでカバー済み。

### API Route `/api/fetch-metadata`

`fetchMetadata` を呼び出すだけの薄いラッパー。`fetchMetadata` のテストと重複するため不要。

### LINE Webhook (`/api/line-webhook`)

署名検証・外部API・DB操作が複雑に絡み合う。ほとんどがモックになるためテストコストが高い割に得られる安心感が少ない。
実際の動作確認は手動またはステージング環境で行う方が効率的。

### コンポーネント - UI表示・操作

以下は手動確認またはE2Eテストでカバーする方が効率的。

- `AddPodcastForm`: フォーム入力・送信の統合テスト
- `PodcastCard` / `PodcastListItem`: 表示・操作のテスト
- グリッド/リスト表示切替

### 認証関連

Supabase Authに依存し、ほぼモックになる。実際のログインフローは手動確認で十分。

- ログインページのフォーム動作
- 認証状態によるリダイレクト

---

## 今後の拡張（必要に応じて）

以下は現時点では実装しないが、将来的に必要になる可能性があるテスト:

- [ ] E2Eテスト（Playwright等）: ユーザーフロー全体の確認
- [ ] アクセシビリティテスト
- [ ] パフォーマンステスト
- [ ] Supabase RLS（Row Level Security）のテスト
