import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"
import Link from "next/link"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="w-full max-w-sm">
        <Card className="border-t-4 border-t-primary shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="size-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">登録完了</CardTitle>
            <CardDescription>確認メールを送信しました</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              ご登録いただいたメールアドレスに確認メールを送信しました。
              メール内のリンクをクリックして、アカウントを有効化してください。
            </p>
            <Link href="/auth/login" className="text-sm text-primary hover:text-primary/80 underline underline-offset-4">
              ログインページに戻る
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
