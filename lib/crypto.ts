import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 16
const ENCRYPTION_KEY_LENGTH = 32

/**
 * 暗号化キーを取得（環境変数から）
 * キーは32バイト（256ビット）の16進数文字列である必要がある
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is not set")
  }

  const keyBuffer = Buffer.from(key, "hex")
  if (keyBuffer.length !== ENCRYPTION_KEY_LENGTH) {
    throw new Error(
      `ENCRYPTION_KEY must be ${ENCRYPTION_KEY_LENGTH} bytes (${ENCRYPTION_KEY_LENGTH * 2} hex characters)`
    )
  }

  return keyBuffer
}

/**
 * テキストを暗号化
 * @param text 暗号化するテキスト
 * @returns 暗号化されたテキスト（Base64エンコード: iv:authTag:encryptedData）
 */
export function encrypt(text: string): string {
  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(text, "utf8", "hex")
  encrypted += cipher.final("hex")

  const authTag = cipher.getAuthTag()

  // iv:authTag:encryptedData の形式で保存
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`
}

/**
 * テキストを復号化
 * @param encryptedText 暗号化されたテキスト（encrypt関数で生成されたもの）
 * @returns 復号化されたテキスト
 */
export function decrypt(encryptedText: string): string {
  const key = getEncryptionKey()
  const parts = encryptedText.split(":")

  if (parts.length !== 3) {
    throw new Error("Invalid encrypted text format")
  }

  const iv = Buffer.from(parts[0], "hex")
  const authTag = Buffer.from(parts[1], "hex")
  const encrypted = parts[2]

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted, "hex", "utf8")
  decrypted += decipher.final("utf8")

  return decrypted
}

/**
 * 新しい暗号化キーを生成（初回セットアップ用）
 * @returns 32バイトのランダムキー（16進数文字列）
 */
export function generateEncryptionKey(): string {
  return randomBytes(ENCRYPTION_KEY_LENGTH).toString("hex")
}
