import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const rawNext = searchParams.get("next")

  // オープンリダイレクト脆弱性対策: nextパラメータを検証
  let nextPath = "/podcasts"
  if (rawNext) {
    try {
      const nextUrl = new URL(rawNext, origin)
      if (nextUrl.origin === origin) {
        nextPath = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`
      }
    } catch {
      // パースに失敗した場合はデフォルトのパスを利用する
    }
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${nextPath}`)
    }
    // 認証エラーをログに記録
    console.error("OAuth認証エラー:", error.message)
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_error`)
}
