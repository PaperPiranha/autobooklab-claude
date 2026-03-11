import Link from "next/link"
import { BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signIn } from "@/app/actions/auth"

interface PageProps {
  searchParams: Promise<{ error?: string; message?: string }>
}

export default async function SignInPage({ searchParams }: PageProps) {
  const params = await searchParams

  return (
    <div className="mx-auto w-full max-w-sm space-y-8">
      {/* Brand */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
          <BookOpen className="h-6 w-6 text-primary" />
        </div>
        <div className="text-center">
          <h1
            className="text-2xl font-normal tracking-tight"
            style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
          >
            AutoBook<span className="text-primary">Lab</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to your workspace
          </p>
        </div>
      </div>

      {/* Form card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-xl shadow-black/20">
        {params.error && (
          <div className="mb-4 rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
            {params.error}
          </div>
        )}
        {params.message && (
          <div className="mb-4 rounded-md bg-primary/10 border border-primary/20 px-3 py-2 text-sm text-primary">
            {params.message}
          </div>
        )}

        <form action={signIn} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <Button type="submit" className="w-full font-medium">
            Sign in
          </Button>
        </form>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/sign-up"
          className="text-foreground font-medium hover:text-primary transition-colors"
        >
          Create one free
        </Link>
      </p>
    </div>
  )
}
