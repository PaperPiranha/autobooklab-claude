import { notFound } from "next/navigation"
import Link from "next/link"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Book, Chapter } from "@/lib/types"

interface PageProps {
  params: Promise<{ bookId: string }>
}

// Genre → accent colour mapping (matches dashboard palette)
const GENRE_COLORS: Record<string, string> = {
  Business: "#3B82F6",
  "Self-Help": "#8B5CF6",
  "Non-Fiction": "#10B981",
  Fiction: "#EC4899",
  Technology: "#06B6D4",
  Science: "#14B8A6",
  Biography: "#F59E0B",
  History: "#EF4444",
  "Health & Wellness": "#22C55E",
  "Children's": "#F97316",
  Poetry: "#A855F7",
  Other: "#6B7280",
}

export async function generateMetadata({ params }: PageProps) {
  const { bookId } = await params
  const supabase = createAdminClient()
  const { data: book } = await supabase
    .from("books")
    .select("title, description, status")
    .eq("id", bookId)
    .single()

  if (!book || book.status !== "published") return { title: "Not Found" }

  return {
    title: book.title,
    description: book.description || undefined,
  }
}

export default async function PublicBookPage({ params }: PageProps) {
  const { bookId } = await params
  const supabase = createAdminClient()

  const [{ data: book }, { data: chapters }] = await Promise.all([
    supabase.from("books").select("*").eq("id", bookId).single(),
    supabase
      .from("chapters")
      .select("id, title, content, position, word_count")
      .eq("book_id", bookId)
      .order("position", { ascending: true }),
  ])

  if (!book || book.status !== "published") notFound()

  const typedBook = book as Book
  const typedChapters = (chapters ?? []) as Chapter[]
  const accent = GENRE_COLORS[typedBook.genre] ?? "#F97316"

  const totalWords = typedChapters.reduce((s, c) => s + (c.word_count ?? 0), 0)

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Cover banner */}
      <div
        className="w-full py-20 px-6 text-white"
        style={{ background: `linear-gradient(135deg, #111 0%, ${accent}55 100%)`, backgroundColor: "#111" }}
      >
        <div className="max-w-2xl mx-auto">
          {typedBook.genre && (
            <span
              className="inline-block text-xs font-semibold tracking-widest uppercase mb-4 px-3 py-1 rounded-full"
              style={{ backgroundColor: `${accent}33`, color: accent }}
            >
              {typedBook.genre}
            </span>
          )}
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-4 text-white">
            {typedBook.title}
          </h1>
          {typedBook.description && (
            <p className="text-lg text-white/70 max-w-xl leading-relaxed">{typedBook.description}</p>
          )}
          <div className="flex gap-6 mt-6 text-sm text-white/50">
            <span>{typedChapters.length} chapters</span>
            {totalWords > 0 && <span>{totalWords.toLocaleString()} words</span>}
          </div>
        </div>
      </div>

      {/* Table of contents */}
      {typedChapters.length > 1 && (
        <div className="max-w-2xl mx-auto px-6 py-10 border-b border-gray-100">
          <h2 className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">
            Contents
          </h2>
          <ol className="space-y-2">
            {typedChapters.map((ch, i) => (
              <li key={ch.id}>
                <a
                  href={`#chapter-${ch.id}`}
                  className="flex items-baseline gap-3 text-gray-700 hover:text-gray-900 transition-colors group"
                >
                  <span className="text-xs text-gray-400 tabular-nums w-5 shrink-0">{i + 1}</span>
                  <span className="group-hover:underline underline-offset-2">{ch.title}</span>
                  {ch.word_count > 0 && (
                    <span className="text-xs text-gray-400 ml-auto shrink-0">
                      {ch.word_count.toLocaleString()} words
                    </span>
                  )}
                </a>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Chapters */}
      <div className="max-w-2xl mx-auto px-6 py-12 space-y-16">
        {typedChapters.map((ch, i) => (
          <article key={ch.id} id={`chapter-${ch.id}`} className="scroll-mt-8">
            <div className="flex items-center gap-3 mb-6">
              <span
                className="text-xs font-bold tabular-nums px-2 py-0.5 rounded"
                style={{ backgroundColor: `${accent}15`, color: accent }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <h2 className="text-2xl font-bold text-gray-900">{ch.title}</h2>
            </div>
            {ch.content ? (
              <div
                className="prose prose-gray max-w-none prose-p:leading-relaxed prose-headings:font-bold"
                // Content from TipTap is trusted HTML (user-authored)
                dangerouslySetInnerHTML={{ __html: ch.content }}
              />
            ) : (
              <p className="text-gray-400 italic">This chapter has no content yet.</p>
            )}
          </article>
        ))}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 mt-16 py-8 px-6 text-center">
        <p className="text-sm text-gray-400">
          Created with{" "}
          <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
            AutoBookLab
          </Link>
        </p>
      </footer>
    </div>
  )
}
