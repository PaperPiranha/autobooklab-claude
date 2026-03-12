"use client"

import { useRef, useState } from "react"
import { Pencil } from "lucide-react"
import { updateChapterTitle } from "@/app/actions/books"

interface EditableChapterBreadcrumbProps {
  bookTitle: string
  chapterTitle: string
  chapterId: string
  bookId: string
}

export function EditableChapterBreadcrumb({
  bookTitle,
  chapterTitle: initialTitle,
  chapterId,
  bookId,
}: EditableChapterBreadcrumbProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(initialTitle)
  const inputRef = useRef<HTMLInputElement>(null)

  function startEditing() {
    setTitle(initialTitle)
    setIsEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  function saveTitle() {
    const trimmed = title.trim()
    if (trimmed && trimmed !== initialTitle) {
      updateChapterTitle(chapterId, trimmed, bookId)
    } else {
      setTitle(initialTitle)
    }
    setIsEditing(false)
  }

  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <span
        className="text-foreground font-medium"
        style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
      >
        {bookTitle}
      </span>
      <span>/</span>
      {isEditing ? (
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={saveTitle}
          onKeyDown={(e) => {
            if (e.key === "Enter") saveTitle()
            if (e.key === "Escape") { setTitle(initialTitle); setIsEditing(false) }
          }}
          className="text-sm bg-transparent border-b border-primary outline-none py-0 text-foreground"
          autoFocus
        />
      ) : (
        <span className="group/breadcrumb flex items-center gap-1">
          <span>{initialTitle}</span>
          <button
            onClick={startEditing}
            className="shrink-0 opacity-0 group-hover/breadcrumb:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"
            title="Rename chapter"
          >
            <Pencil className="h-3 w-3" />
          </button>
        </span>
      )}
    </div>
  )
}
