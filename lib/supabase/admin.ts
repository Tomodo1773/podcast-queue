import { createClient } from "@supabase/supabase-js";

// Service Roleクライアント（RLSをバイパス）
// Webhookなど、特定ユーザーのセッションがない場面で使用
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
