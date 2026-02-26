import type { SupabaseClient } from "@supabase/supabase-js"
import { decrypt } from "@/lib/crypto"

export interface NotionAuthResult {
  accessToken: string
  databaseId: string
}

export class NotionAuthError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code?: string
  ) {
    super(message)
    this.name = "NotionAuthError"
  }
}

export async function getNotionAuth(supabase: SupabaseClient, userId: string): Promise<NotionAuthResult> {
  const { data: settings, error: settingsError } = await supabase
    .from("notion_settings")
    .select("*")
    .eq("user_id", userId)
    .single()

  if (settingsError || !settings) {
    throw new NotionAuthError("Notion連携が設定されていません", 400)
  }

  if (!settings.database_id) {
    throw new NotionAuthError("NotionデータベースIDが設定されていません", 400)
  }

  const accessToken = decrypt(settings.encrypted_access_token)
  return { accessToken, databaseId: settings.database_id }
}
