import { redirect } from "next/navigation"
import { StatsContainer } from "@/components/stats-container"
import { createClient } from "@/lib/supabase/server"

export default async function StatsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  return <StatsContainer userId={user.id} />
}
