"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BookOpen,
  LayoutDashboard,
  Library,
  Menu,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "./theme-toggle"

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Books", href: "/books", icon: Library },
]

export function MobileHeader({ email }: { email: string }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Close nav on route change
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  return (
    <>
      {/* Top bar */}
      <header className="flex h-14 items-center justify-between border-b border-sidebar-border bg-sidebar px-4 lg:hidden">
        <button
          onClick={() => setOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Logo centre */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-white">
            <BookOpen className="h-3 w-3" />
          </div>
          <span
            className="text-[15px] font-semibold tracking-tight text-foreground"
            style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
          >
            AutoBook<span className="text-primary font-bold">Lab</span>
          </span>
        </Link>

        <ThemeToggle />
      </header>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-out nav */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar border-r border-sidebar-border transition-transform duration-200 lg:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Sheet header */}
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-white">
              <BookOpen className="h-3.5 w-3.5" />
            </div>
            <span
              className="text-[15px] font-semibold tracking-tight text-foreground"
              style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
            >
              AutoBook<span className="text-primary font-bold">Lab</span>
            </span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 space-y-0.5 p-2 pt-3">
          {navItems.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/")
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "opacity-70")} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* User info at bottom */}
        <div className="border-t border-sidebar-border p-4">
          <p className="text-xs text-muted-foreground truncate">{email}</p>
        </div>
      </div>
    </>
  )
}
