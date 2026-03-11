"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, BookOpen, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { createBook } from "@/app/actions/books"
import { BOOK_TEMPLATES, type BookTemplate } from "@/lib/book-templates"

export function BrowseTemplatesModal({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<BookTemplate | null>(null)
  const [title, setTitle] = useState("")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSelectTemplate(template: BookTemplate) {
    setSelected(template)
    setTitle(template.name)
    setError(null)
  }

  function handleBack() {
    setSelected(null)
    setTitle("")
    setError(null)
  }

  function handleOpenChange(val: boolean) {
    setOpen(val)
    if (!val) {
      setSelected(null)
      setTitle("")
      setError(null)
    }
  }

  function handleCreate() {
    if (!selected || !title.trim()) return
    setError(null)
    startTransition(async () => {
      const result = await createBook({
        title: title.trim(),
        genre: selected.genre,
        description: "",
        chapters: selected.chapters,
      })
      if (result.error) {
        setError(result.error)
        return
      }
      setOpen(false)
      router.push(`/books/${result.bookId}`)
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        {selected ? (
          <DetailView
            template={selected}
            title={title}
            onTitleChange={setTitle}
            onBack={handleBack}
            onCreate={handleCreate}
            isPending={isPending}
            error={error}
          />
        ) : (
          <BrowseView onSelect={handleSelectTemplate} />
        )}
      </DialogContent>
    </Dialog>
  )
}

function BrowseView({ onSelect }: { onSelect: (t: BookTemplate) => void }) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Choose a template</DialogTitle>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-3 mt-2">
        {BOOK_TEMPLATES.map((template) => (
          <TemplateCard key={template.id} template={template} onSelect={onSelect} />
        ))}
      </div>
    </>
  )
}

function TemplateCard({
  template,
  onSelect,
}: {
  template: BookTemplate
  onSelect: (t: BookTemplate) => void
}) {
  return (
    <button
      onClick={() => onSelect(template)}
      className="text-left rounded-lg border border-border bg-card hover:border-primary/40 hover:bg-card/80 transition-all overflow-hidden group"
    >
      {/* Color swatch bar */}
      <div className="h-2 w-full" style={{ backgroundColor: template.accentColor }} />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-sm font-medium leading-snug group-hover:text-primary transition-colors">
            {template.name}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
            {template.genre}
          </Badge>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            {template.chapters.length} chapters
          </span>
        </div>
      </div>
    </button>
  )
}

function DetailView({
  template,
  title,
  onTitleChange,
  onBack,
  onCreate,
  isPending,
  error,
}: {
  template: BookTemplate
  title: string
  onTitleChange: (v: string) => void
  onBack: () => void
  onCreate: () => void
  isPending: boolean
  error: string | null
}) {
  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <DialogTitle className="leading-snug">{template.name}</DialogTitle>
        </div>
      </DialogHeader>

      <div className="mt-1 space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{template.genre}</Badge>
          <span className="text-sm text-muted-foreground">{template.tagline}</span>
        </div>

        {/* Chapter list */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
            Chapters ({template.chapters.length})
          </p>
          <ol className="max-h-48 overflow-y-auto space-y-1 pr-1">
            {template.chapters.map((chapter, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span className="text-xs text-muted-foreground w-5 shrink-0 text-right">
                  {i + 1}.
                </span>
                <span>{chapter}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Title input */}
        <div className="space-y-1.5">
          <label htmlFor="book-title" className="text-sm font-medium">
            Book title
          </label>
          <Input
            id="book-title"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Enter a title for your book"
            disabled={isPending}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          className="w-full gap-2"
          onClick={onCreate}
          disabled={isPending || !title.trim()}
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isPending ? "Creating…" : "Create from template"}
        </Button>
      </div>
    </>
  )
}
