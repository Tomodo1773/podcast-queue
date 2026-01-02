"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

export default function SignUpPage() {
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [repeatPassword, setRepeatPassword] = useState("")
	const [error, setError] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const router = useRouter()

	const handleSignUp = async (e: React.FormEvent) => {
		e.preventDefault()
		const supabase = createClient()
		setIsLoading(true)
		setError(null)

		if (password !== repeatPassword) {
			setError("パスワードが一致しません")
			setIsLoading(false)
			return
		}

		try {
			const { error } = await supabase.auth.signUp({
				email,
				password,
				options: {
					emailRedirectTo:
						process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/podcasts`,
				},
			})
			if (error) throw error
			router.push("/auth/sign-up-success")
		} catch (error: unknown) {
			setError(error instanceof Error ? error.message : "登録に失敗しました")
			setIsLoading(false)
		}
	}

	return (
		<div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-purple-50 to-blue-50">
			<div className="w-full max-w-sm">
				<Card className="border-t-4 border-t-primary shadow-lg">
					<CardHeader className="text-center">
						<img src="/podqueue-icon.svg" alt="PodQueue" className="mx-auto mb-4 h-12 w-12" />
						<CardTitle className="text-2xl">新規登録</CardTitle>
						<CardDescription>新しいアカウントを作成します</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSignUp}>
							<div className="flex flex-col gap-6">
								<div className="grid gap-2">
									<Label htmlFor="email">メールアドレス</Label>
									<Input
										id="email"
										type="email"
										placeholder="mail@example.com"
										required
										value={email}
										onChange={(e) => setEmail(e.target.value)}
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="password">パスワード</Label>
									<Input
										id="password"
										type="password"
										required
										value={password}
										onChange={(e) => setPassword(e.target.value)}
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="repeat-password">パスワード(確認)</Label>
									<Input
										id="repeat-password"
										type="password"
										required
										value={repeatPassword}
										onChange={(e) => setRepeatPassword(e.target.value)}
									/>
								</div>
								{error && <p className="text-sm text-destructive">{error}</p>}
								<Button type="submit" className="w-full" disabled={isLoading}>
									{isLoading ? "登録中..." : "新規登録"}
								</Button>
							</div>
							<div className="mt-4 text-center text-sm">
								既にアカウントをお持ちの方は{" "}
								<Link
									href="/auth/login"
									className="text-primary hover:text-primary/80 underline underline-offset-4"
								>
									ログイン
								</Link>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
