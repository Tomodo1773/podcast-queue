import { NextResponse } from "next/server"
import { getGoogleAuthUrl } from "@/lib/google/oauth"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL("/auth/login", process.env.NEXT_PUBLIC_APP_URL))
  }

  // CSRFトークンとしてユーザーIDを使用
  const state = user.id

  const authUrl = getGoogleAuthUrl(state)

  return NextResponse.redirect(authUrl)
}
