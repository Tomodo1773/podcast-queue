# AGENTS.md

## 言語設定

常に日本語で回答してください。

## アプリ概要

PodQueueは、ポッドキャストをプラットフォーム横断で一元管理するためのWebアプリケーションです。YouTube、Spotify、NewsPicksなど様々なプラットフォームの動画・音声コンテンツを「あとで聴く」リストとして管理できます。

## 主な機能

- **URLからメタデータ自動取得**: URLを入力するだけで、タイトル・説明・サムネイルを自動取得（OGP/oEmbed対応）
- **プラットフォーム横断管理**: YouTube、Spotify、NewsPicks、Pivot、テレ東Bizなど複数プラットフォームのコンテンツを一箇所で管理
- **優先度による管理**: 高・中・低の3段階で優先度を設定し、優先度順でソート可能
- **視聴ステータス管理**: 未視聴/視聴済みのステータスを切り替え可能
- **視聴中のピックアップ表示**: 現在視聴中のコンテンツは常にリストの先頭に表示
- **フィルタリング・並び替え**: 視聴状態・優先度でのフィルタリング、追加日順・優先度順での並び替え
- **グリッド/リスト表示切替**: 好みに合わせて表示形式を選択可能
- **LINE連携**: LINEにURLを送信するだけでポッドキャストを登録可能。登録結果はFlex Messageで通知
- **サンプルポッドキャスト**: デモ用のサンプルURLを公開しており、LINE連携の動作確認に利用可能

## サービスレベル

このアプリはユーザが自分一人で使うことを想定しています。そのため、過度な品質は不要です

## 実装方針

- 過度に高品質な実装は不要。
- 必要な要件をよく考え最小のコードで要件を達成することが望ましい。
- 開発者は1人。自分が使う上で最低限のエラーハンドリングやセキュリティ対応を行う

## コマンド

```bash
# 開発サーバー起動
pnpm run dev

# ビルド
pnpm run build

# 本番起動
pnpm start

# Lint
pnpm run lint

# フォーマット
pnpm run format

# 型チェック
pnpm run typecheck

# 未使用コード検出
pnpm run knip

# チェック（formatting + linting + typecheck + knip）
pnpm run check
```

## アーキテクチャ

Next.js 16 (App Router) + Supabase + shadcn/ui で構成されたPodcast管理Webアプリ。

### ディレクトリ構成

- `app/` - Next.js App Router ページ群
  - `page.tsx` - 認証状態に応じてリダイレクト
  - `auth/` - ログイン・サインアップページ
    - `auth/sign-up-success/` - サインアップ完了ページ
  - `podcasts/` - Podcast一覧・追加ページ
  - `settings/` - 設定ページ（LINE連携など）
  - `samples/[id]/` - サンプルPodcastページ（OGP対応）
  - `api/fetch-metadata/` - URLからメタデータを取得するAPI Route
  - `api/line-webhook/` - LINE Messaging API Webhookエンドポイント
- `components/` - Reactコンポーネント
  - `ui/` - shadcn/uiベースのUIコンポーネント
  - `podcast-list.tsx` - Podcast一覧表示（クライアントコンポーネント）
  - `podcast-card.tsx` - 個別Podcastカード
  - `podcast-list-item.tsx` - Podcastリストアイテム
  - `podcast-dialog.tsx` - Podcast詳細ダイアログ
  - `add-podcast-form.tsx` - Podcast追加フォーム
  - `podcasts-header.tsx` - Podcastページヘッダー
  - `podcasts-container.tsx` - Podcastページコンテナ
  - `settings-form.tsx` - 設定フォーム（LINE連携）
  - `theme-provider.tsx` - テーマプロバイダー
- `lib/` - ユーティリティ
  - `utils.ts` - 汎用ユーティリティ関数
  - `supabase/` - Supabaseクライアント
    - `client.ts` - ブラウザ用クライアント
    - `server.ts` - サーバー用クライアント（Server Components/Actions用）
    - `proxy.ts` - Supabaseプロキシ
- `scripts/` - データベースマイグレーションSQL
- `lib/line/` - LINE Messaging API関連
  - `flex-message.ts` - Flex Message生成
  - `reply.ts` - メッセージ返信
  - `loading.ts` - ローディングアニメーション
- `lib/samples/` - サンプルPodcastデータ
  - `data.ts` - サンプルデータ定義

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

### LINE連携

LINEにURLを送信してポッドキャストを登録可能。`/api/line-webhook`でWebhookを受信し、`line_user_links`テーブルでユーザーを紐付け。

### サンプルポッドキャスト

LINE連携の動作確認用。`/samples/{id}`でOGP対応のデモページを提供。
