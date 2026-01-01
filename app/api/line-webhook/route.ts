import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { detectPlatform } from "@/lib/utils";
import { fetchMetadata } from "@/lib/metadata/fetcher";
import { replyMessage } from "@/lib/line/reply";
import {
  buildSuccessFlexMessage,
  buildErrorMessage,
  buildMetadataFailedMessage,
} from "@/lib/line/flex-message";

// 署名検証
function verifySignature(body: string, signature: string): boolean {
  const channelSecret = process.env.LINE_MESSAGING_CHANNEL_SECRET;
  if (!channelSecret) {
    console.error("LINE_MESSAGING_CHANNEL_SECRET is not set");
    return false;
  }

  const hash = crypto
    .createHmac("SHA256", channelSecret)
    .update(body)
    .digest("base64");
  return hash === signature;
}

// リストページのURL生成
function getListUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://localhost:3000";
  return `${baseUrl}/podcasts`;
}

type LineEvent = {
  type: string;
  message?: {
    type: string;
    text: string;
  };
  source?: {
    userId?: string;
    type: string;
  };
  replyToken?: string;
};

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-line-signature") || "";

    // 署名検証
    if (!verifySignature(body, signature)) {
      console.error("Invalid LINE signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    const { events } = JSON.parse(body) as { events: LineEvent[] };
    const supabase = createAdminClient();

    for (const event of events) {
      // テキストメッセージのみ処理
      if (event.type !== "message" || event.message?.type !== "text") continue;

      const lineUserId = event.source?.userId;
      const messageText = event.message.text;
      const replyToken = event.replyToken;

      if (!lineUserId) continue;

      // URLを抽出（複数URLがある場合は最初のもの）
      const urlMatch = messageText.match(/https?:\/\/[^\s]+/);
      if (!urlMatch) continue;

      const url = urlMatch[0];
      const listUrl = getListUrl();

      // LINE User IDからPodQueueユーザーを検索
      const { data: link } = await supabase
        .from("line_user_links")
        .select("user_id")
        .eq("line_user_id", lineUserId)
        .single();

      if (!link) {
        // 未連携ユーザーにはエラーメッセージを返信
        console.log(`Unlinked LINE user: ${lineUserId}`);
        if (replyToken) {
          await replyMessage(replyToken, [
            buildErrorMessage(
              "PodQueueアカウントと連携されていません。PodQueueの設定画面からLINE連携を行ってください。"
            ),
          ]);
        }
        continue;
      }

      // メタデータ取得（共通関数を直接呼び出し - HTTPリクエスト不要）
      let metadata = { title: "", description: "", image: "" };
      let metadataFailed = false;
      try {
        metadata = await fetchMetadata(url);
      } catch (error) {
        console.error("Failed to fetch metadata:", error);
        metadataFailed = true;
        // メタデータ取得失敗時は空のまま続行
      }

      // メタデータがすべて空の場合も失敗とみなす
      if (!metadata.title && !metadata.description && !metadata.image) {
        metadataFailed = true;
      }

      // Podcast登録
      const { error: insertError } = await supabase.from("podcasts").insert({
        user_id: link.user_id,
        url,
        title: metadata.title || url,
        description: metadata.description || "",
        thumbnail_url: metadata.image || "",
        platform: detectPlatform(url),
        priority: "medium",
        is_watched: false,
        is_watching: false,
      });

      if (insertError) {
        console.error("Failed to insert podcast:", insertError);
        // 登録失敗時はエラーメッセージを返信
        if (replyToken) {
          await replyMessage(replyToken, [
            buildErrorMessage("登録に失敗しました。時間をおいて再度お試しください。"),
          ]);
        }
      } else {
        console.log(`Podcast added for user ${link.user_id}: ${url}`);
        // 登録成功時は成功メッセージを返信
        if (replyToken) {
          if (metadataFailed) {
            // メタデータ取得失敗時はテキストメッセージ
            await replyMessage(replyToken, [
              buildMetadataFailedMessage(url, listUrl),
            ]);
          } else {
            // 成功時はFlex Message
            await replyMessage(replyToken, [
              buildSuccessFlexMessage({
                thumbnailUrl: metadata.image,
                title: metadata.title,
                description: metadata.description,
                listUrl,
              }),
            ]);
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("LINE webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
