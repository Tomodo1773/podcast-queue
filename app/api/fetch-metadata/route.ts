import { NextResponse } from "next/server";
import { fetchMetadata } from "@/lib/metadata/fetcher";

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URLが必要です" }, { status: 400 });
    }

    const metadata = await fetchMetadata(url);

    // 相対パスの画像URLを絶対URLに変換
    if (metadata.image && metadata.image.startsWith("/")) {
      const host = request.headers.get("host");
      const protocol = request.headers.get("x-forwarded-proto") || "https";
      metadata.image = `${protocol}://${host}${metadata.image}`;
    }

    return NextResponse.json(metadata);
  } catch (error: unknown) {
    console.error("メタデータ取得エラー:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "メタデータの取得に失敗しました" },
      { status: 500 }
    );
  }
}
