import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"
import Link from "next/link"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="size-6 text-green-600" />
              <CardTitle className="text-2xl">登録完了</CardTitle>
            </div>
            <CardDescription>確認メールを送信しました</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              ご登録いただいたメールアドレスに確認メールを送信しました。
              メール内のリンクをクリックして、アカウントを有効化してください。
            </p>
            <Link href="/auth/login" className="text-sm underline underline-offset-4">
              ログインページに戻る
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
