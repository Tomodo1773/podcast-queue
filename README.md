# PodQueue

ポッドキャストをプラットフォーム横断で一元管理する「あとで聴く」Webアプリ

<p align="center">
  <a href="https://github.com/Tomodo1773/podcast-queue"><img alt="GitHub Last Commit" src="https://img.shields.io/github/last-commit/Tomodo1773/podcast-queue"></a>
  <a href="https://github.com/Tomodo1773/podcast-queue"><img alt="GitHub Top Language" src="https://img.shields.io/github/languages/top/Tomodo1773/podcast-queue"></a>
  <a href="https://github.com/Tomodo1773/podcast-queue/issues"><img alt="GitHub issues" src="https://img.shields.io/github/issues/Tomodo1773/podcast-queue"></a>
  <a href="https://github.com/Tomodo1773/podcast-queue/blob/main/LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg"></a>
</p>

## 概要

PodQueueは、YouTube、Spotify、NewsPicksなど様々なプラットフォームの動画・音声コンテンツを「あとで聴く」リストとして一箇所で管理できるWebアプリケーションです。

## 使い方イメージ

### 1) URLを集約して「あとで聴く」をキュー化

<p align="center">
  <img src="images/sample_podqueue_home.png" alt="PodQueueのホーム画面（キュー一覧）" width="420" />
</p>

YouTube / Spotify / NewsPicks などのURLを同じリストで管理し、優先度や状態でサクッと並び替えできます。

### 2) 詳細画面で内容を確認して、状態を切り替え

<p align="center">
  <img src="images/sample_podcast_details.png" alt="PodQueueの詳細画面（説明・サムネイル・状態）" width="420" />
</p>

タイトル・説明・サムネイルを自動取得し、未視聴/視聴済み・視聴中や優先度をその場で更新できます。

### 3) LINEにURLを送るだけで登録（あとからまとめて消化）

<p align="center">
  <img src="images/sample_line_integration.png" alt="LINE連携（URL送信で自動登録）" width="420" />
</p>

移動中にLINEへURLを投げておけば、あとでPodQueueを開いたときに「聴くもの」が揃っています。

## 主な機能

- **URLからメタデータ自動取得** - URLを入力するだけで、タイトル・説明・サムネイル・番組名を自動取得（OGP/oEmbed対応、YouTube/Spotify専用API対応）
- **プラットフォーム横断管理** - YouTube、Spotify、NewsPicks、Pivot、テレ東Bizなど複数プラットフォームのコンテンツを一箇所で管理
- **優先度による管理** - 高・中・低の3段階で優先度を設定し、優先度順でソート可能
- **視聴ステータス管理** - 未視聴/視聴済みのステータスを切り替え可能
- **視聴中のピックアップ表示** - 現在視聴中のコンテンツは常にリストの先頭に表示
- **フィルタリング・並び替え** - 視聴状態・優先度でのフィルタリング、追加日順・優先度順での並び替え
- **グリッド/リスト表示切替** - 好みに合わせて表示形式を選択可能
- **視聴統計** - 視聴履歴を客観的に把握できる統計ページ（総視聴数、日別・週別・月別の推移グラフ、プラットフォーム別統計）
- **LINE連携** - LINEにURLを送信するだけでPodcastを自動登録（設定画面からLINE User IDを連携）
- **Google Drive連携** - ポッドキャストを視聴中に設定した際、Google Driveへマークダウンファイル（YAMLフロントマター形式）を自動生成し、視聴後の学びを記録可能（リフレッシュトークンはAES-256-GCMで暗号化保存）
- **タグ自動生成** - Gemini APIを使用してポッドキャストのタイトル・説明から検索用タグを自動生成（6〜12個）

## サンプルポッドキャスト

デモ用のサンプルポッドキャストページを公開しています。OGP対応しており、URLプレビューの動作確認などにご利用いただけます。

- [テクノロジーの未来 - AI革命の最前線](/samples/podcast-1)
- [スタートアップ成功の秘訣](/samples/podcast-2)
- [日々のマインドフルネス習慣](/samples/podcast-3)

## 技術スタック

- **フロントエンド**: Next.js 16 (App Router), React 19, Tailwind CSS 4
- **UI**: shadcn/ui, Radix UI, Lucide Icons
- **グラフ**: recharts
- **バックエンド**: Supabase (認証 + PostgreSQL)
- **AI**: Vercel AI SDK + Google Gemini (タグ生成)
- **Observability**: LangSmith (オプション、AIトレーシング)

## セットアップ

### 環境変数

`.env.example`を参考に`.env.local`を作成してください。

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Gemini API
GEMINI_API_KEY=your-gemini-api-key

# LINE Messaging API
LINE_CHANNEL_SECRET=your-line-channel-secret
LINE_CHANNEL_ACCESS_TOKEN=your-line-channel-access-token

# Google OAuth & Drive
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# 暗号化キー（32バイトの16進数文字列）
ENCRYPTION_KEY=your-encryption-key

# LangSmith トレーシング（オプション）
LANGCHAIN_TRACING_V2=false
LANGCHAIN_API_KEY=your-langsmith-api-key
LANGSMITH_PROJECT=your-project-name
```

**暗号化キーの生成**

Google Drive連携を使用する場合、暗号化キーの生成が必要です。

```bash
node scripts/generate-encryption-key.mjs
```

生成されたキーを `.env.local` に追加してください。本番環境では、Supabaseの環境変数に設定してください。

## 開発

```bash
# 開発サーバー起動
pnpm run dev

# ビルド
pnpm run build

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

## ユーティリティスクリプト

### 過去分ポッドキャストへのメタデータ一括付与

既存のポッドキャスト（約100件）にタグ・出演者名・YouTube要約を一括で付与するスクリプトです。

**前提条件:**
- 環境変数の設定
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY` (RLSバイパス用)
  - `GEMINI_API_KEY` (Gemini API用)
  - `YOUTUBE_API_KEY` (YouTube要約用、オプション)

**実行方法:**

```bash
npx tsx scripts/backfill-metadata.ts
```

**動作:**
- `tags IS NULL` または `tags = '{}'` のポッドキャストのみを対象
- 各ポッドキャストに対して `updatePodcastMetadata()` を順次実行
- 進捗ログと成功/失敗のサマリを出力
- 途中で止めても再実行可能（処理済みはスキップ）

## ライセンス

[MIT](LICENSE)
