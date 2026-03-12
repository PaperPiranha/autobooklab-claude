import { AdminSidebar } from "./_components/admin-sidebar"

export default function AdminShellLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden lg:flex lg:flex-col lg:h-full">
        <AdminSidebar />
      </div>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
