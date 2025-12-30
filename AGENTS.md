# AGENTS.md

## 言語設定

常に日本語で回答してください。

## サービスレベル
このアプリはユーザが自分一人で使うことを想定しています。そのため、過度な品質は不要です

## 実装方針

- 過度に高品質な実装は不要。
- 必要な要件をよく考え最小のコードで要件を達成することが望ましい。
- 開発者は1人。自分が使う上で最低限のエラーハンドリングやセキュリティ対応を行う


## コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# Lint
npm run lint

# 本番起動
npm start
```

## アーキテクチャ

Next.js 16 (App Router) + Supabase + shadcn/ui で構成されたPodcast管理Webアプリ。

### ディレクトリ構成

- `app/` - Next.js App Router ページ群
  - `page.tsx` - 認証状態に応じてリダイレクト
  - `auth/` - ログイン・サインアップページ
    - `auth/sign-up-success/` - サインアップ完了ページ
  - `podcasts/` - Podcast一覧・追加ページ
  - `api/fetch-metadata/` - URLからメタデータを取得するAPI Route
- `components/` - Reactコンポーネント
  - `ui/` - shadcn/uiベースのUIコンポーネント
  - `podcast-list.tsx` - Podcast一覧表示（クライアントコンポーネント）
  - `podcast-card.tsx` - 個別Podcastカード
  - `podcast-list-item.tsx` - Podcastリストアイテム
  - `podcast-dialog.tsx` - Podcast詳細ダイアログ
  - `add-podcast-form.tsx` - Podcast追加フォーム
  - `podcasts-header.tsx` - Podcastページヘッダー
  - `podcasts-container.tsx` - Podcastページコンテナ
  - `theme-provider.tsx` - テーマプロバイダー
- `lib/` - ユーティリティ
  - `utils.ts` - 汎用ユーティリティ関数
  - `supabase/` - Supabaseクライアント
    - `client.ts` - ブラウザ用クライアント
    - `server.ts` - サーバー用クライアント（Server Components/Actions用）
    - `proxy.ts` - Supabaseプロキシ
- `scripts/` - データベースマイグレーションSQL

### 技術スタック

- **フロントエンド**: React 19, Next.js 16, Tailwind CSS 4
- **UI**: shadcn/ui (new-york スタイル), Radix UI, Lucide Icons
- **バックエンド**: Supabase (認証 + PostgreSQL)
- **パスエイリアス**: `@/*` でルートからのインポート

### データモデル

`podcasts` テーブル:

- `id`, `user_id`, `url`, `title`, `description`, `thumbnail_url`, `platform`, `is_watched`, `is_watching`, `watched_at`, `priority`, `created_at`, `updated_at`
- Row Level Security有効（ユーザーは自分のデータのみアクセス可能）

### メタデータ取得

`/api/fetch-metadata` エンドポイントはURLからOGP/oEmbedでタイトル・説明・サムネイルを取得。YouTube、Spotifyは専用処理あり。
