# テストリスト

本ドキュメントは、PodQueueアプリケーションで実装すべきテストをリスト化したものです。

## テスト方針

- カバレッジだけを追い求めず、開発者が認知・管理できる範囲に留める
- 正常系を中心にテストを実装
- 異常系は必要最低限のものに限定
- 1人開発のため、過度な品質は追求しない

---

## ユーティリティ関数 (`lib/utils.ts`)

### `detectPlatform`
- [ ] YouTube URLを正しく判定できる (`youtube.com`, `youtu.be`)
- [ ] Spotify URLを正しく判定できる
- [ ] NewsPicks URLを正しく判定できる (`newspicks.com`, `npx.me`)
- [ ] Pivot URLを正しく判定できる
- [ ] テレ東Biz URLを正しく判定できる
- [ ] 未知のURLは `other` を返す

### `getPlatformLabel`
- [ ] 各プラットフォームに対応するラベルを正しく返す
- [ ] null/undefinedの場合は「その他」を返す

### `getPriorityLabel`
- [ ] high/medium/lowに対応するラベル（高/中/低）を正しく返す

### `getPriorityOrder`
- [ ] 優先度を正しいソート順（high:0, medium:1, low:2）で返す

---

## メタデータ取得 (`lib/metadata/fetcher.ts`)

### `extractYouTubeVideoId`
- [ ] 標準形式 (`youtube.com/watch?v=xxx`) からIDを抽出できる
- [ ] 短縮形式 (`youtu.be/xxx`) からIDを抽出できる
- [ ] Shorts形式 (`youtube.com/shorts/xxx`) からIDを抽出できる
- [ ] Live形式 (`youtube.com/live/xxx`) からIDを抽出できる
- [ ] 無効なURLの場合はnullを返す

### `extractSpotifyId`
- [ ] エピソードURL からtype(`episode`)とIDを抽出できる
- [ ] 番組URL からtype(`show`)とIDを抽出できる
- [ ] 無効なURLの場合はnullを返す

### `fetchMetadata`
- [ ] YouTube URLからメタデータを取得できる
- [ ] Spotify URLからメタデータを取得できる
- [ ] 一般的なURLからOGPメタデータを取得できる

---

## API Route (`app/api/fetch-metadata/route.ts`)

### POST `/api/fetch-metadata`
- [ ] 有効なURLに対してメタデータを返す
- [ ] URLが空の場合は400エラーを返す

---

## API Route (`app/api/line-webhook/route.ts`)

### POST `/api/line-webhook`
- [ ] 署名検証が正しく動作する（正当な署名で通過、不正な署名で403）
- [ ] テキストメッセージからURLを抽出できる
- [ ] 連携済みユーザーのPodcast登録が成功する

---

## コンポーネント

### `PodcastList` (`components/podcast-list.tsx`)
- [ ] Podcastリストが正しくレンダリングされる
- [ ] 視聴状態フィルタ（すべて/未視聴/視聴済み）が機能する
- [ ] 優先度フィルタが機能する
- [ ] 並び替え（追加日順/優先度順）が機能する
- [ ] グリッド/リスト表示切替が機能する

### `AddPodcastForm` (`components/add-podcast-form.tsx`)
- [ ] URLを入力してメタデータ取得ボタンが有効になる
- [ ] 優先度選択が機能する
- [ ] フォーム送信時にPodcastが追加される

### `PodcastCard` / `PodcastListItem`
- [ ] Podcastの情報が正しく表示される
- [ ] 視聴済み/未視聴の切り替えが機能する
- [ ] 優先度変更が機能する
- [ ] 削除が機能する

---

## 認証関連

### ログインページ (`app/auth/login/page.tsx`)
- [ ] フォームが正しくレンダリングされる
- [ ] 有効な認証情報でログインが成功する

### ルートページ (`app/page.tsx`)
- [ ] 認証済みユーザーは `/podcasts` にリダイレクトされる
- [ ] 未認証ユーザーは `/auth/login` にリダイレクトされる

---

## 今後の拡張（優先度低）

以下は現時点では実装しないが、将来的に必要になる可能性があるテスト:

- [ ] E2Eテスト（Playwright等）
- [ ] アクセシビリティテスト
- [ ] パフォーマンステスト
- [ ] Supabase RLS（Row Level Security）のテスト
