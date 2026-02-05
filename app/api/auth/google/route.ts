import { randomBytes } from "node:crypto"
import { cookies } from "next/headers"
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

  // 暗号学的に安全なランダムトークンを生成
  const state = randomBytes(32).toString("hex")

  // HTTP-onlyクッキーにトークンを保存（10分間有効）
  const cookieStore = await cookies()
  cookieStore.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10分
    path: "/",
  })

  const authUrl = getGoogleAuthUrl(state)

  return NextResponse.redirect(authUrl)
}
