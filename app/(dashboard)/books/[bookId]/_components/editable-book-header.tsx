"use client"

import { useRef, useState } from "react"
import { Pencil } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { updateBookTitle, updateBookDescription } from "@/app/actions/books"

interface EditableBookHeaderProps {
  bookId: string
  title: string
  genre: string
  description: string
  chapterCount: number
  totalWords: number
}

export function EditableBookHeader({
  bookId,
  title: initialTitle,
  genre,
  description: initialDescription,
  chapterCount,
  totalWords,
}: EditableBookHeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [title, setTitle] = useState(initialTitle)
  const [isEditingDesc, setIsEditingDesc] = useState(false)
  const [description, setDescription] = useState(initialDescription)
  const titleRef = useRef<HTMLInputElement>(null)
  const descRef = useRef<HTMLTextAreaElement>(null)

  function startEditingTitle() {
    setTitle(initialTitle)
    setIsEditingTitle(true)
    setTimeout(() => titleRef.current?.select(), 0)
  }

  function saveTitle() {
    const trimmed = title.trim()
    if (trimmed && trimmed !== initialTitle) {
      updateBookTitle(bookId, trimmed)
    } else {
      setTitle(initialTitle)
    }
    setIsEditingTitle(false)
  }

  function startEditingDesc() {
    setDescription(initialDescription)
    setIsEditingDesc(true)
    setTimeout(() => descRef.current?.select(), 0)
  }

  function saveDescription() {
    const trimmed = description.trim()
    if (trimmed !== initialDescription) {
      updateBookDescription(bookId, trimmed)
    } else {
      setDescription(initialDescription)
    }
    setIsEditingDesc(false)
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-1 group/title">
        {isEditingTitle ? (
          <input
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveTitle()
              if (e.key === "Escape") { setTitle(initialTitle); setIsEditingTitle(false) }
            }}
            className="text-2xl font-normal bg-transparent border-b border-primary outline-none py-0.5 w-full max-w-md"
            style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
            autoFocus
          />
        ) : (
          <>
            <h1
              className="text-2xl font-normal"
              style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
            >
              {initialTitle}
            </h1>
            <button
              onClick={startEditingTitle}
              className="shrink-0 opacity-0 group-hover/title:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"
              title="Rename book"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </>
        )}
        {genre && !isEditingTitle && (
          <Badge variant="secondary" className="text-xs">
            {genre}
          </Badge>
        )}
      </div>
      {(initialDescription || isEditingDesc) && (
        <div className="group/desc">
          {isEditingDesc ? (
            <textarea
              ref={descRef}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={saveDescription}
              onKeyDown={(e) => {
                if (e.key === "Escape") { setDescription(initialDescription); setIsEditingDesc(false) }
              }}
              className="text-sm text-muted-foreground max-w-xl w-full bg-transparent border border-border rounded-md p-2 outline-none focus:border-primary resize-none"
              rows={2}
              autoFocus
            />
          ) : (
            <div className="flex items-start gap-1.5">
              <p className="text-sm text-muted-foreground max-w-xl">
                {initialDescription}
              </p>
              <button
                onClick={startEditingDesc}
                className="shrink-0 mt-0.5 opacity-0 group-hover/desc:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"
                title="Edit description"
              >
                <Pencil className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}
      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
        <span>{chapterCount} chapters</span>
        <span>{totalWords.toLocaleString()} words</span>
      </div>
    </div>
  )
}
