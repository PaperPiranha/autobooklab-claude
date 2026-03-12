import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CalendarDays } from "lucide-react"
import { MarkdownRenderer } from "@/components/markdown-renderer"

export interface BlogPostMeta {
  title: string
  description: string
  date: string
  slug: string
  author: string
  tags: string[]
}

export function BlogPostLayout({
  meta,
  content,
}: {
  meta: BlogPostMeta
  content: string
}) {
  return (
    <article className="py-24 lg:py-32">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Blog
        </Link>

        {/* Header */}
        <header className="mb-12">
          <div className="flex flex-wrap gap-2 mb-4">
            {meta.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          <h1 className="font-[family-name:var(--font-instrument-serif)] text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-4">
            {meta.title}
          </h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              {new Date(meta.date).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
            <span>{meta.author}</span>
          </div>
        </header>

        {/* Content */}
        <MarkdownRenderer content={content} />
      </div>
    </article>
  )
}
