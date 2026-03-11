import Link from "next/link"
import { BookOpen } from "lucide-react"
import { SignUpForm } from "./_components/sign-up-form"

interface PageProps {
  searchParams: Promise<{ error?: string; message?: string }>
}

export default async function SignUpPage({ searchParams }: PageProps) {
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
            Start creating eBooks with AI
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

        <SignUpForm />

        <p className="mt-4 text-center text-xs text-muted-foreground">
          By signing up you agree to our{" "}
          <span className="text-foreground/60">Terms of Service</span> and{" "}
          <span className="text-foreground/60">Privacy Policy</span>.
        </p>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="text-foreground font-medium hover:text-primary transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
