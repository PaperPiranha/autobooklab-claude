import Link from "next/link"
import { Plus, BookOpen, Sparkles, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/server"
import { BillingCard } from "./_components/billing-card"
import { BrowseTemplatesModal } from "./_components/browse-templates-modal"
import type { Book } from "@/lib/types"
import type { Plan } from "@/lib/stripe"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const firstName = user?.email?.split("@")[0] ?? "there"

  const [{ data: books }, { data: credits }, { data: subscription }] = await Promise.all([
    supabase.from("books").select("*").order("updated_at", { ascending: false }),
    supabase.from("credits").select("balance").eq("user_id", user!.id).single(),
    supabase
      .from("subscriptions")
      .select("plan, status, current_period_end")
      .eq("user_id", user!.id)
      .single(),
  ])

  const typedBooks = (books ?? []) as Book[]
  const totalChapters = typedBooks.reduce((s, b) => s + b.chapter_count, 0)
  const creditBalance = credits?.balance ?? 0
  const currentPlan = (subscription?.plan ?? "free") as Plan
  const periodEnd = subscription?.current_period_end ?? null

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-8 py-4">
        <div>
          <h1 className="text-lg font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back, {firstName}</p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/books/new">
            <Plus className="h-4 w-4" />
            New Book
          </Link>
        </Button>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="flex gap-8 items-start">
          {/* Main column */}
          <div className="flex-1 min-w-0">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
              <StatCard label="Books" value={String(typedBooks.length)} />
              <StatCard label="Chapters" value={String(totalChapters)} />
              <StatCard label="AI credits" value={String(creditBalance)} accent />
            </div>

            {typedBooks.length === 0 ? (
              <EmptyState />
            ) : (
              <div>
                <h2 className="text-sm font-medium text-muted-foreground mb-3">Recent books</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {typedBooks.map((book) => (
                    <BookCard key={book.id} book={book} />
                  ))}
                </div>
              </div>
            )}

            {/* Billing card on mobile (below books) */}
            <div className="mt-8 lg:hidden">
              <BillingCard
                currentPlan={currentPlan}
                credits={creditBalance}
                currentPeriodEnd={periodEnd}
              />
            </div>
          </div>

          {/* Billing sidebar */}
          <div className="w-72 shrink-0 hidden lg:block">
            <BillingCard
              currentPlan={currentPlan}
              credits={creditBalance}
              currentPeriodEnd={periodEnd}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${accent ? "text-primary" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  )
}

function BookCard({ book }: { book: Book }) {
  const updatedAt = new Date(book.updated_at)
  const relativeTime = formatRelative(updatedAt)

  return (
    <Link href={`/books/${book.id}`} className="group block">
      <div className="rounded-lg border border-border bg-card p-5 hover:border-primary/40 hover:bg-card/80 transition-all h-full flex flex-col gap-3">
        {/* Genre bar accent */}
        <div className="h-0.5 w-8 rounded-full bg-primary opacity-60 group-hover:opacity-100 transition-opacity" />

        <div className="flex-1">
          <h3
            className="text-base font-normal leading-snug mb-1 group-hover:text-primary transition-colors"
            style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
          >
            {book.title}
          </h3>
          {book.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{book.description}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {book.genre && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                {book.genre}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {book.chapter_count}
            </span>
          </div>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {relativeTime}
          </span>
        </div>
      </div>
    </Link>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 py-20 px-8 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
        <BookOpen className="h-7 w-7 text-primary" />
      </div>
      <h2 className="text-lg font-semibold mb-2">No books yet</h2>
      <p className="text-sm text-muted-foreground max-w-xs mb-6">
        Create your first AI-powered eBook. Write chapters, add images, and export to PDF or EPUB.
      </p>
      <div className="flex gap-3">
        <Button asChild className="gap-2">
          <Link href="/books/new">
            <Plus className="h-4 w-4" />
            Create your first book
          </Link>
        </Button>
        <BrowseTemplatesModal>
          <Button variant="outline" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Browse templates
          </Button>
        </BrowseTemplatesModal>
      </div>
    </div>
  )
}

function formatRelative(date: Date): string {
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diff < 60) return "just now"
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
}
