import type { createAdminClient } from "@/lib/supabase/admin"

/**
 * LINE User IDから連携済みのPodQueueユーザーIDを解決する（未連携ならnull）
 */
export async function resolveUserId(
  supabase: ReturnType<typeof createAdminClient>,
  lineUserId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("line_user_links")
    .select("user_id")
    .eq("line_user_id", lineUserId)
    .single()

  return data?.user_id ?? null
}
