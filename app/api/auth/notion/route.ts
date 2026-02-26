import { randomBytes } from "node:crypto"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { getNotionAuthUrl } from "@/lib/notion/oauth"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL("/auth/login", process.env.NEXT_PUBLIC_APP_URL))
  }

  const state = randomBytes(32).toString("hex")

  const cookieStore = await cookies()
  cookieStore.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  })

  const authUrl = getNotionAuthUrl(state)

  return NextResponse.redirect(authUrl)
}
