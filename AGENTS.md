# AGENTS.md

## 言語設定

常に日本語で回答してください。

## サービスレベル

少人数向けの個人開発アプリだが、ポートフォリオとして第三者に見せることを想定している。コードの読みやすさや設計の妥当性は意識しつつ、過度なエンジニアリングは避ける

## 実装方針

- 過度に高品質な実装は不要。
- 必要な要件をよく考え最小のコードで要件を達成することが望ましい。
- 開発者は1人。自分が使う上で最低限のエラーハンドリングやセキュリティ対応を行う
- 病的なまでの正確さよりも、常にシンプルさを優先すること。
- YAGNI、KISS、DRYを徹底せよ。
- サイクロマチック複雑度（循環的複雑度）を増大させずに済む場合を除き、後方互換性のためのシムやフォールバックパスは設けないこと。

## テスト方針

- カバレッジだけを追い求めず、開発者が認知・管理できる範囲に留める
- 正常系を中心にテストを実装
- 異常系は必要最低限のものに限定
- 1人開発のため、過度な品質は追求しない
- 外部リソース中心でモック中心になるテストは見送る
- テストフレームワーク: Vitest + Testing Library + happy-dom

## アプリ概要

PodQueueは、ポッドキャストをプラットフォーム横断で一元管理するためのWebアプリケーション。YouTube、Spotify、NewsPicks等のコンテンツを「あとで聴く」リストとして管理する。

## ディレクトリ構成

- `app/` — Next.js App Routerのページ・APIルート
  - `app/api/` — APIエンドポイント（LINE webhook、Google OAuth、Google Drive等）
  - `app/podcasts/` — ポッドキャスト一覧・詳細ページ
  - `app/settings/` — 設定ページ
  - `app/samples/` — サンプルポッドキャストページ
- `components/` — UIコンポーネント（`components/ui/` はshadcn/ui自動生成）
- `lib/` — ビジネスロジック・ユーティリティ
  - `lib/supabase/` — Supabaseクライアント（client/server/admin）
  - `lib/gemini/` — Gemini AI連携（タグ生成、要約）
  - `lib/google/` — Google Drive/OAuth連携
  - `lib/metadata/` — URLからのメタデータ取得
  - `lib/line/` — LINE Messaging API連携
- `hooks/` — カスタムReact hooks
- `scripts/` — DBマイグレーション・ユーティリティスクリプト

## 実装手順

1. 実装計画を立てる。セッション内ですでにプランニングが終わっている場合は不要
2. コードを実装する
3. テストコードを実装する
4. pnpm install で依存関係を更新する
5. pnpm run test でテストを行う
6. pnpm run check を実行し、lint/format/typecheck/knipが通ることを確認する
7. ドキュメント(AGENTS.md,README.md)を更新する

## コマンド

```bash
pnpm run dev          # 開発サーバー起動
pnpm run build        # ビルド
pnpm run test         # テスト実行（vitest run）
pnpm run test:watch   # テスト監視モード
pnpm run check        # formatting + linting + typecheck + knip（CI前に必ず実行）
pnpm run lint         # Biome lint（--write付き）
pnpm run format       # Biome format（--write付き）
pnpm run typecheck    # tsc --noEmit
pnpm run knip         # 未使用コード検出
```

## 技術スタック

- **フレームワーク**: Next.js 16 (App Router), React 19
- **UI**: shadcn/ui (new-york), Tailwind CSS 4, Radix UI, sonner
- **DB/認証**: Supabase (PostgreSQL + Auth)
- **AI**: Vercel AI SDK + Google Gemini
- **Linter/Formatter**: Biome（ESLint/Prettierは不使用）
- **テスト**: Vitest + Testing Library + happy-dom
- **パスエイリアス**: `@/*` でルートからのインポート

## コードスタイル

- Biomeで統一（`biome.json`参照）
- インデント: スペース2、行幅: 110
- ダブルクォート、セミコロンなし（ASI）、末尾カンマES5
- `components/ui/` はshadcn/ui自動生成のためlint対象外

## 環境変数

```
# 必須
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# Google Drive連携
GOOGLE_OAUTH_CLIENT_ID
GOOGLE_OAUTH_CLIENT_SECRET
ENCRYPTION_KEY              # リフレッシュトークン暗号化用（node scripts/generate-encryption-key.mjsで生成）

# AI機能
GEMINI_API_KEY

# LINE連携
LINE_MESSAGING_CHANNEL_SECRET

# 共通
NEXT_PUBLIC_APP_URL         # アプリのベースURL

# オプション（Observability）
LANGCHAIN_TRACING_V2        # "true"で有効化
LANGSMITH_PROJECT
```
