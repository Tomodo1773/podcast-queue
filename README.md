# PodQueue

ポッドキャストをプラットフォーム横断で一元管理する「あとで聴く」Webアプリ

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 概要

PodQueueは、YouTube、Spotify、NewsPicksなど様々なプラットフォームの動画・音声コンテンツを「あとで聴く」リストとして一箇所で管理できるWebアプリケーションです。

## 主な機能

- **URLからメタデータ自動取得** - URLを入力するだけで、タイトル・説明・サムネイルを自動取得（OGP/oEmbed対応）
- **プラットフォーム横断管理** - YouTube、Spotify、NewsPicks、Pivot、テレ東Bizなど複数プラットフォームのコンテンツを一箇所で管理
- **優先度による管理** - 高・中・低の3段階で優先度を設定し、優先度順でソート可能
- **視聴ステータス管理** - 未視聴/視聴済みのステータスを切り替え可能
- **視聴中のピックアップ表示** - 現在視聴中のコンテンツは常にリストの先頭に表示
- **フィルタリング・並び替え** - 視聴状態・優先度でのフィルタリング、追加日順・優先度順での並び替え
- **グリッド/リスト表示切替** - 好みに合わせて表示形式を選択可能
- **視聴統計** - 視聴履歴を客観的に把握できる統計ページ（総視聴数、日別・週別・月別の推移グラフ、プラットフォーム別統計）
- **LINE連携** - LINEにURLを送信するだけでPodcastを自動登録（設定画面からLINE User IDを連携）

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

## ライセンス

[MIT](LICENSE)
