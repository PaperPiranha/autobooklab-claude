"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpen, LayoutDashboard, Library, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "My Books",
    href: "/books",
    icon: Library,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-60 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 ring-1 ring-primary/20">
          <BookOpen className="h-4 w-4 text-primary" />
        </div>
        <span
          className="text-[15px] font-normal text-foreground"
          style={{ fontFamily: "var(--font-instrument-serif)" }}
        >
          AutoBook<span className="text-primary">Lab</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 p-2 pt-3">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-sidebar-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  isActive ? "text-primary" : "opacity-70"
                )}
              />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
