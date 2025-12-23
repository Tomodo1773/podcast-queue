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

export default function LoginPage() {
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [error, setError] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const router = useRouter()

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault()
		const supabase = createClient()
		setIsLoading(true)
		setError(null)

		try {
			const { error } = await supabase.auth.signInWithPassword({
				email,
				password,
			})
			if (error) throw error
			router.push("/podcasts")
			router.refresh()
		} catch (error: unknown) {
			setError(error instanceof Error ? error.message : "ログインに失敗しました")
			setIsLoading(false)
		}
	}

	return (
		<div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
			<div className="w-full max-w-sm">
				<Card>
					<CardHeader>
						<CardTitle className="text-2xl">ログイン</CardTitle>
						<CardDescription>メールアドレスとパスワードを入力してログインしてください</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleLogin}>
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
								{error && <p className="text-sm text-destructive">{error}</p>}
								<Button type="submit" className="w-full" disabled={isLoading}>
									{isLoading ? "ログイン中..." : "ログイン"}
								</Button>
							</div>
							<div className="mt-4 text-center text-sm">
								アカウントをお持ちでない方は{" "}
								<Link href="/auth/sign-up" className="underline underline-offset-4">
									新規登録
								</Link>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
