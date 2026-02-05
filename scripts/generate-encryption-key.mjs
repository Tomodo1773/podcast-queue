#!/usr/bin/env node

import { randomBytes } from "node:crypto"

const ENCRYPTION_KEY_LENGTH = 32 // 256 bits

const key = randomBytes(ENCRYPTION_KEY_LENGTH).toString("hex")

console.log("新しい暗号化キーを生成しました:")
console.log("")
console.log(`ENCRYPTION_KEY=${key}`)
console.log("")
console.log("このキーを .env.local ファイルに追加してください。")
console.log("本番環境では、Supabaseの環境変数に設定してください。")
