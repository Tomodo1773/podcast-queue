# AGENTS.md

## 言語設定

常に日本語で回答してください。

## アプリ概要

PodQueueは、ポッドキャストをプラットフォーム横断で一元管理するためのWebアプリケーションです。YouTube、Spotify、NewsPicksなど様々なプラットフォームの動画・音声コンテンツを「あとで聴く」リストとして管理できます。

## 主な機能

- **URLからメタデータ自動取得**: URLを入力するだけで、タイトル・説明・サムネイル・番組名を自動取得（OGP/oEmbed対応、YouTube/Spotify専用API対応）
- **プラットフォーム横断管理**: YouTube、Spotify、NewsPicks、Pivot、テレ東Bizなど複数プラットフォームのコンテンツを一箇所で管理
- **優先度による管理**: 高・中・低の3段階で優先度を設定し、優先度順でソート可能
- **視聴ステータス管理**: 未視聴/視聴済みのステータスを切り替え可能
- **視聴中のピックアップ表示**: 現在視聴中のコンテンツは常にリストの先頭に表示
- **フィルタリング・並び替え**: 視聴状態・優先度でのフィルタリング、追加日順・優先度順での並び替え
- **グリッド/リスト表示切替**: 好みに合わせて表示形式を選択可能
- **LINE連携**: LINEにURLを送信するだけでポッドキャストを登録可能。登録結果はFlex Messageで通知
- **Google Drive連携**: ポッドキャストを視聴中に設定した際、Google Driveへマークダウンファイルを自動生成。視聴後の学びを記録するのに活用可能
- **サンプルポッドキャスト**: デモ用のサンプルURLを公開しており、LINE連携の動作確認に利用可能

## サービスレベル

このアプリはユーザが自分一人で使うことを想定しています。そのため、過度な品質は不要です

## 実装手順

1. 実装計画を立てる。セッション内ですでにプランニングが終わっている場合は不要
2. コードを実装する
3. テストコードを実装する
4. pnpm install で依存関係を更新する
5. pnpm run test でテストを行う
6. pnpm run check を実行し、lint/format/typecheck/knipが通ることを確認する
7. ドキュメント(AGENTS.md,README.md)を更新する

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
  - `settings/` - 設定ページ（LINE連携、Google Drive連携）
  - `samples/[id]/` - サンプルPodcastページ（OGP対応）
  - `api/fetch-metadata/` - URLからメタデータを取得するAPI Route
  - `api/line-webhook/` - LINE Messaging API Webhookエンドポイント
  - `api/auth/google/` - Google OAuth認証（認証開始・コールバック）
  - `api/google-drive/` - Google Driveファイル作成API
- `components/` - Reactコンポーネント
  - `ui/` - shadcn/uiベースのUIコンポーネント
  - `podcast-list.tsx` - Podcast一覧表示（クライアントコンポーネント）
  - `podcast-card.tsx` - 個別Podcastカード
  - `podcast-list-item.tsx` - Podcastリストアイテム
  - `podcast-dialog.tsx` - Podcast詳細ダイアログ
  - `add-podcast-form.tsx` - Podcast追加フォーム
  - `podcasts-header.tsx` - Podcastページヘッダー
  - `podcasts-container.tsx` - Podcastページコンテナ
  - `settings-form.tsx` - 設定フォーム（LINE連携、Google Drive連携）
  - `theme-provider.tsx` - テーマプロバイダー
- `lib/` - ユーティリティ
  - `utils.ts` - 汎用ユーティリティ関数
  - `crypto.ts` - 暗号化・復号化ユーティリティ（AES-256-GCM）
  - `supabase/` - Supabaseクライアント
    - `client.ts` - ブラウザ用クライアント
    - `server.ts` - サーバー用クライアント（Server Components/Actions用）
    - `proxy.ts` - Supabaseプロキシ
- `scripts/` - データベースマイグレーションSQL
- `lib/line/` - LINE Messaging API関連
  - `flex-message.ts` - Flex Message生成
  - `reply.ts` - メッセージ返信
  - `loading.ts` - ローディングアニメーション
- `lib/google/` - Google API関連
  - `oauth.ts` - OAuth認証ユーティリティ
  - `drive.ts` - Google Drive APIファイル操作
- `lib/samples/` - サンプルPodcastデータ
  - `data.ts` - サンプルデータ定義
- `lib/gemini/` - Gemini AI関連
  - `generate-metadata.ts` - タグと出演者名の自動生成機能

### 技術スタック

- **フロントエンド**: React 19, Next.js 16, Tailwind CSS 4
- **UI**: shadcn/ui (new-york スタイル), Radix UI, Lucide Icons
- **バックエンド**: Supabase (認証 + PostgreSQL)
- **AI**: Vercel AI SDK + Google Gemini (タグ生成、出演者名抽出)
- **Observability**: LangSmith (オプション、AIトレーシング)
- **パスエイリアス**: `@/*` でルートからのインポート

### データモデル

`podcasts` テーブル:

- `id`, `user_id`, `url`, `title`, `description`, `thumbnail_url`, `platform`, `is_watched`, `is_watching`, `watched_at`, `priority`, `google_drive_file_created`, `show_name`, `tags`, `speakers`, `gemini_summary`, `created_at`, `updated_at`
- `show_name`: 番組名またはチャンネル名（YouTubeはチャンネル名、Spotifyは番組名）
- `tags`: 検索用タグの配列（Gemini APIで自動生成）
- `speakers`: 出演者名の配列（Gemini APIで自動抽出）
- `gemini_summary`: YouTube動画の内容要約（Gemini APIで自動生成、YouTubeのみ）
- Row Level Security有効（ユーザーは自分のデータのみアクセス可能）

### メタデータ取得

`/api/fetch-metadata` エンドポイントはURLからOGP/oEmbedでタイトル・説明・サムネイル・番組名を取得。

- **YouTube**: YouTube Data API v3の`videos.list`エンドポイントで`snippet.channelTitle`からチャンネル名を取得
- **Spotify**: Spotify Web APIのエピソード取得エンドポイントで`show.name`から番組名を取得
- **その他**: OGPベースの取得（番組名は未登録）
- **HTMLエンティティのデコード**: OGP取得時にHTMLエンティティ（`&quot;`、`&amp;`など）を自動的にデコードして正しい文字列に変換

### LINE連携

LINEにURLを送信してポッドキャストを登録可能。`/api/line-webhook`でWebhookを受信し、`line_user_links`テーブルでユーザーを紐付け。

### Google Drive連携

ポッドキャストを視聴中に設定した際、Google Driveへマークダウンファイルを自動生成。

- OAuth認証でGoogle Driveアクセス権限を取得
- `google_drive_settings`テーブルで暗号化されたリフレッシュトークン・保存先フォルダIDを管理
- リフレッシュトークンはAES-256-GCMで暗号化保存（アクセストークンは保存せず毎回リフレッシュ）
- 暗号化キーは環境変数`ENCRYPTION_KEY`で管理
- マークダウンファイルはYAMLフロントマター形式（title、platform、source、show_name、tags、speakersフィールド）で開始し、説明、動画内容（Gemini生成、YouTubeのみ）、学びセクション（空欄）を含む
- `google_drive_file_created`フラグで重複作成を防止（一度作成したPodcastは再度視聴中にしても作成しない）

### サンプルポッドキャスト

LINE連携の動作確認用。`/samples/{id}`でOGP対応のデモページを提供。

### AI機能（タグ・出演者名の自動生成、YouTube動画要約）

Gemini APIを使用してポッドキャストのメタデータを自動生成。

#### タグ・出演者名の自動生成

- **使用SDK**: Vercel AI SDK (`ai`, `@ai-sdk/google`)
- **モデル**: `gemini-3-flash-preview`
- **生成内容**:
  - **タグ**: 6〜12個の検索用タグ（業界・技術・テーマ・国・企業など）
  - **出演者名**: 0〜20個の出演者名（フルネーム、カタカナ名、ハンドルネームなど）
- **統合呼び出し**: 1回のAPI呼び出しでタグと出演者名を同時に生成
- **LangSmithトレーシング**: 環境変数で有効化可能（`LANGCHAIN_TRACING_V2=true`、`LANGSMITH_PROJECT`でプロジェクト名を設定）

#### YouTube動画内容の自動要約

- **使用SDK**: Vercel AI SDK (`ai`, `@ai-sdk/google`)
- **モデル**: `gemini-3-pro-preview`
- **入力**: YouTube動画URL
- **生成内容**: セクション別箇条書きで整理された動画内容の詳細要約
- **実行タイミング**: タグ・出演者名生成と並行実行（Podcast登録時）
- **対象**: YouTubeプラットフォームのみ
- **表示場所**:
  - Podcast詳細ダイアログ（「動画内容（Gemini生成）」セクション）
  - Google Driveマークダウンファイル（「## 動画内容（Gemini生成）」セクション）
- **LangSmithトレーシング**: タグ生成と同じ設定を使用
