import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { ChapterEditor } from "./_components/chapter-editor"
import type { Book, Chapter } from "@/lib/types"

interface PageProps {
  params: Promise<{ bookId: string; chapterId: string }>
}

export default async function ChapterPage({ params }: PageProps) {
  const { bookId, chapterId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/sign-in")

  // Parallel fetch — book, chapter, sibling chapters, credits
  const [{ data: book }, { data: chapter }, { data: allChapters }, { data: credits }] =
    await Promise.all([
      supabase
        .from("books")
        .select("id, title, genre, description, user_id")
        .eq("id", bookId)
        .single(),
      supabase.from("chapters").select("*").eq("id", chapterId).single(),
      supabase
        .from("chapters")
        .select("id, title, position")
        .eq("book_id", bookId)
        .order("position", { ascending: true }),
      supabase.from("credits").select("balance").eq("user_id", user.id).single(),
    ])

  if (!book || !chapter || book.user_id !== user.id) notFound()

  const typedBook = book as Pick<Book, "id" | "title" | "genre" | "description" | "user_id">
  const typedChapter = chapter as Chapter
  const chapters = (allChapters ?? []) as Pick<Chapter, "id" | "title" | "position">[]
  const currentIndex = chapters.findIndex((c) => c.id === chapterId)
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null
  const nextChapter = currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null
  const creditBalance = credits?.balance ?? 0

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-border px-6 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/books/${bookId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span
              className="text-foreground font-medium"
              style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
            >
              {typedBook.title}
            </span>
            <span>/</span>
            <span>{typedChapter.title}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Credits pill */}
          <span className="text-xs text-muted-foreground tabular-nums">
            <span className="text-primary font-medium">{creditBalance}</span> credits
          </span>
          {/* Chapter navigation */}
          {prevChapter && (
            <Button variant="ghost" size="sm" asChild className="text-xs">
              <Link href={`/books/${bookId}/chapters/${prevChapter.id}`}>← Prev</Link>
            </Button>
          )}
          {nextChapter && (
            <Button variant="ghost" size="sm" asChild className="text-xs">
              <Link href={`/books/${bookId}/chapters/${nextChapter.id}`}>Next →</Link>
            </Button>
          )}
        </div>
      </header>

      {/* Editor */}
      <ChapterEditor
        chapter={typedChapter}
        book={{
          id: typedBook.id,
          title: typedBook.title,
          genre: typedBook.genre,
          description: typedBook.description,
        }}
        initialCredits={creditBalance}
      />
    </div>
  )
}
