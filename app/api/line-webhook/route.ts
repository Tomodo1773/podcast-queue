import crypto from "crypto"
import { NextResponse } from "next/server"
import { handleDislike } from "@/lib/line/handle-dislike"
import { handleTextMessage } from "@/lib/line/handle-text-message"
import { createAdminClient } from "@/lib/supabase/admin"

// 署名検証
function verifySignature(body: string, signature: string): boolean {
  const channelSecret = process.env.LINE_MESSAGING_CHANNEL_SECRET
  if (!channelSecret) {
    console.error("LINE_MESSAGING_CHANNEL_SECRET is not set")
    return false
  }

  const hash = crypto.createHmac("SHA256", channelSecret).update(body).digest("base64")
  return hash === signature
}

type LineEvent = {
  type: string
  message?: {
    type: string
    text: string
  }
  postback?: {
    data: string
  }
  source?: {
    userId?: string
    type: string
  }
  replyToken?: string
}

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const signature = request.headers.get("x-line-signature") || ""

    // 署名検証
    if (!verifySignature(body, signature)) {
      console.error("Invalid LINE signature")
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 })
    }

    const { events } = JSON.parse(body) as { events: LineEvent[] }
    const supabase = createAdminClient()

    for (const event of events) {
      const lineUserId = event.source?.userId
      if (!lineUserId) continue

      if (event.type === "message" && event.message?.type === "text") {
        await handleTextMessage(supabase, {
          lineUserId,
          text: event.message.text,
          replyToken: event.replyToken,
        })
      } else if (event.type === "postback" && event.postback) {
        await handleDislike(supabase, {
          lineUserId,
          data: event.postback.data,
          replyToken: event.replyToken,
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("LINE webhook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
