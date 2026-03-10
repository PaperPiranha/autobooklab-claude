import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Trash2, Download } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { deleteBook } from "@/app/actions/books"
import { AddChapterForm } from "./_components/add-chapter-form"
import { SortableChapters } from "./_components/sortable-chapters"
import { ExportPanel } from "./_components/export-panel"
import type { Book, Chapter } from "@/lib/types"

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

  // Parallel fetch — book + chapters + recent exports
  const [{ data: book }, { data: chapters }, { data: recentExports }] = await Promise.all([
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
  ])

  if (!book) notFound()

  const typedBook = book as Book
  const typedChapters = (chapters ?? []) as Chapter[]

  const totalWords = typedChapters.reduce((sum, c) => sum + c.word_count, 0)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-start justify-between border-b border-border px-8 py-5">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" className="mt-0.5 shrink-0" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1
                className="text-2xl font-normal"
                style={{ fontFamily: "var(--font-instrument-serif)" }}
              >
                {typedBook.title}
              </h1>
              {typedBook.genre && (
                <Badge variant="secondary" className="text-xs">
                  {typedBook.genre}
                </Badge>
              )}
            </div>
            {typedBook.description && (
              <p className="text-sm text-muted-foreground max-w-xl">
                {typedBook.description}
              </p>
            )}
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span>{typedChapters.length} chapters</span>
              <span>{totalWords.toLocaleString()} words</span>
            </div>
          </div>
        </div>

        <form action={deleteBook.bind(null, bookId)}>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete book
          </Button>
        </form>
      </header>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-2xl space-y-8">
          {/* Chapters section */}
          <section>
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
        </div>
      </div>
    </div>
  )
}
