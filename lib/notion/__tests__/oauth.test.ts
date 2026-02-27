/**
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it } from "vitest"
import { getNotionAuthUrl } from "../oauth"

describe("getNotionAuthUrl", () => {
  beforeEach(() => {
    process.env.NOTION_OAUTH_CLIENT_ID = "test-client-id"
    process.env.NEXT_PUBLIC_APP_URL = "https://example.com"
  })

  it("正しいNotion認可URLを生成すること", () => {
    const url = getNotionAuthUrl("test-state")

    expect(url).toContain("https://api.notion.com/v1/oauth/authorize")
    expect(url).toContain("client_id=test-client-id")
    expect(url).toContain("state=test-state")
    expect(url).toContain("response_type=code")
    expect(url).toContain("owner=user")
    expect(url).toContain("redirect_uri=")
    expect(url).toContain("api%2Fauth%2Fnotion%2Fcallback")
  })

  it("環境変数が未設定時にエラーをスローすること", () => {
    delete process.env.NOTION_OAUTH_CLIENT_ID

    expect(() => getNotionAuthUrl("test-state")).toThrow("Notion OAuth環境変数が設定されていません")
  })
})
