# AGENTS.md

## 言語設定

常に日本語で回答してください。

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
  - `podcasts/` - Podcast一覧・追加ページ
  - `api/fetch-metadata/` - URLからメタデータを取得するAPI Route
- `components/` - Reactコンポーネント
  - `ui/` - shadcn/uiベースのUIコンポーネント
  - `podcast-list.tsx` - Podcast一覧表示（クライアントコンポーネント）
  - `podcast-card.tsx` - 個別Podcastカード
  - `add-podcast-form.tsx` - Podcast追加フォーム
- `lib/supabase/` - Supabaseクライアント
  - `client.ts` - ブラウザ用クライアント
  - `server.ts` - サーバー用クライアント（Server Components/Actions用）
- `scripts/` - データベースマイグレーションSQL

### 技術スタック

- **フロントエンド**: React 19, Next.js 16, Tailwind CSS 4
- **UI**: shadcn/ui (new-york スタイル), Radix UI, Lucide Icons
- **バックエンド**: Supabase (認証 + PostgreSQL)
- **パスエイリアス**: `@/*` でルートからのインポート

### データモデル

`podcasts` テーブル:

- `id`, `user_id`, `url`, `title`, `description`, `thumbnail_url`, `platform`, `is_watched`, `created_at`, `updated_at`
- Row Level Security有効（ユーザーは自分のデータのみアクセス可能）

### メタデータ取得

`/api/fetch-metadata` エンドポイントはURLからOGP/oEmbedでタイトル・説明・サムネイルを取得。YouTube、Spotifyは専用処理あり。
