import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { PLANS, type Plan } from "@/lib/stripe"

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/sign-in")

  const [{ data: credits }, { data: subscription }, { data: bookCount }] = await Promise.all([
    supabase.from("credits").select("balance").eq("user_id", user.id).single(),
    supabase.from("subscriptions").select("plan, status, created_at").eq("user_id", user.id).single(),
    supabase.from("books").select("id", { count: "exact", head: true }).eq("user_id", user.id),
  ])

  const plan = (subscription?.plan ?? "free") as Plan
  const initials = (user.email ?? "?").split("@")[0].slice(0, 2).toUpperCase()
  const memberSince = new Date(user.created_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between border-b border-border px-8 py-4">
        <div>
          <h1 className="text-lg font-semibold">Profile</h1>
          <p className="text-sm text-muted-foreground">Your account information</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-lg space-y-8">
          {/* Avatar + email */}
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20 text-lg font-semibold text-primary">
              {initials}
            </div>
            <div>
              <p className="font-medium">{user.email}</p>
              <p className="text-sm text-muted-foreground">Member since {memberSince}</p>
            </div>
          </div>

          <Separator />

          {/* Stats */}
          <div>
            <h2 className="text-sm font-medium mb-3">Account stats</h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground mb-1">Plan</p>
                <div className="flex items-center gap-1.5">
                  <Badge variant="secondary" className="text-xs">
                    {PLANS[plan].name}
                  </Badge>
                </div>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground mb-1">Books</p>
                <p className="text-xl font-semibold">{(bookCount as unknown as { count: number })?.count ?? 0}</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground mb-1">AI credits</p>
                <p className="text-xl font-semibold text-primary">{credits?.balance ?? 0}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Account actions */}
          <div>
            <h2 className="text-sm font-medium mb-3">Account</h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Email address</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Password</p>
                  <p className="text-xs text-muted-foreground">Change your password via email</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/forgot-password">Reset password</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
