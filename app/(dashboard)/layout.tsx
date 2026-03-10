import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Sidebar } from "@/components/sidebar"
import { UserMenu } from "@/components/user-menu"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/sign-in")
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <div className="flex flex-col h-full">
        <Sidebar />
        {/* User menu pinned to sidebar bottom */}
        <div className="border-r border-sidebar-border bg-sidebar w-60 p-2 border-t border-t-sidebar-border">
          <UserMenu email={user.email ?? ""} />
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
