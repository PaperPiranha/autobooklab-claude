import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Trash2, Download, LayoutGrid, Globe } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { deleteBook } from "@/app/actions/books"
import { EditableBookHeader } from "./_components/editable-book-header"
import { AddChapterForm } from "./_components/add-chapter-form"
import { SortableChapters } from "./_components/sortable-chapters"
import { ExportPanel } from "./_components/export-panel"
import { GenerateAllBanner } from "./_components/generate-all-banner"
import { BookCover3D } from "./_components/book-cover-3d"
import { PublishPanel } from "./_components/publish-panel"
import type { Book, Chapter } from "@/lib/types"
import { getUserPlanFeatures } from "@/lib/plans"

interface PageProps {
  params: Promise<{ bookId: string }>
}

export default async function BookPage({ params }: PageProps) {
  const { bookId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/sign-in")

  // Parallel fetch — book + chapters + recent exports + credit balance
  const [{ data: book }, { data: chapters }, { data: recentExports }, { data: creditsRow }] = await Promise.all([
    supabase
      .from("books")
      .select("*")
      .eq("id", bookId)
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("chapters")
      .select("*")
      .eq("book_id", bookId)
      .order("position", { ascending: true }),
    supabase
      .from("exports")
      .select("id, format, status, created_at")
      .eq("book_id", bookId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("credits")
      .select("balance")
      .eq("user_id", user.id)
      .single(),
  ])

  if (!book) notFound()

  const { features } = await getUserPlanFeatures(user.id)
  const typedBook = book as Book
  const typedChapters = (chapters ?? []) as Chapter[]
  const creditBalance = creditsRow?.balance ?? 0

  function wordsFromContent(html: string): number {
    const stripped = html.replace(/<[^>]+>/g, " ").trim()
    return stripped ? stripped.split(/\s+/).filter(Boolean).length : 0
  }
  const totalWords = typedChapters.reduce(
    (sum, c) => sum + (c.word_count || wordsFromContent(c.content)),
    0
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-start justify-between border-b border-border px-4 sm:px-8 py-5">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" className="mt-0.5 shrink-0" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <EditableBookHeader
            bookId={bookId}
            title={typedBook.title}
            genre={typedBook.genre ?? ""}
            description={typedBook.description ?? ""}
            chapterCount={typedChapters.length}
            totalWords={totalWords}
          />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="default" size="sm" className="gap-2" asChild>
            <Link href={`/books/${bookId}/editor`}>
              <LayoutGrid className="h-4 w-4" />
              <span>Visual Editor</span>
            </Link>
          </Button>
          <form action={deleteBook.bind(null, bookId)}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive gap-2"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Delete book</span>
            </Button>
          </form>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
        <div className="flex gap-8 items-start">
          {/* Left column — chapters + export + publish */}
          <div className="flex-1 min-w-0 space-y-8">
            {/* Chapters section */}
            <section>
              <GenerateAllBanner book={typedBook} chapters={typedChapters} creditBalance={creditBalance} canBatchGenerate={features.batchGenerate} />
              <SortableChapters chapters={typedChapters} bookId={bookId} />
              <div className="mt-3">
                <AddChapterForm bookId={bookId} />
              </div>
            </section>

            <Separator />

            {/* Export section */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Download className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-medium">Export</h2>
              </div>
              <ExportPanel
                bookId={bookId}
                bookTitle={typedBook.title}
                initialExports={(recentExports ?? []) as { id: string; format: "pdf" | "epub"; status: string; created_at: string }[]}
              />
            </section>

            <Separator />

            {/* Publish section */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-medium">Publish to web</h2>
              </div>
              <PublishPanel
                bookId={bookId}
                initialStatus={typedBook.status as "draft" | "published"}
              />
            </section>
          </div>

          {/* Right column — 3D cover (hidden on small screens) */}
          <div className="hidden lg:flex flex-col items-center gap-4 pt-2 shrink-0">
            <BookCover3D book={typedBook} />
            <p className="text-xs text-muted-foreground text-center max-w-[140px] leading-snug">
              {typedBook.status === "published" ? "Published" : "Draft"}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
