"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, PenLine, Trash2, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { reorderChapters, deleteChapter } from "@/app/actions/books"
import { cn } from "@/lib/utils"
import type { Chapter } from "@/lib/types"

interface SortableChaptersProps {
  chapters: Chapter[]
  bookId: string
}

export function SortableChapters({ chapters: initial, bookId }: SortableChaptersProps) {
  const [chapters, setChapters] = useState(initial)
  const [, startTransition] = useTransition()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = chapters.findIndex((c) => c.id === active.id)
    const newIndex = chapters.findIndex((c) => c.id === over.id)
    const reordered = arrayMove(chapters, oldIndex, newIndex)

    setChapters(reordered)
    startTransition(() => {
      reorderChapters(bookId, reordered.map((c) => c.id))
    })
  }

  if (chapters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
        <BookOpen className="h-8 w-8 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">No chapters yet. Add one below.</p>
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={chapters.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <ol className="space-y-1">
          {chapters.map((chapter, i) => (
            <SortableChapterRow
              key={chapter.id}
              chapter={chapter}
              index={i}
              bookId={bookId}
            />
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  )
}

function SortableChapterRow({
  chapter,
  index,
  bookId,
}: {
  chapter: Chapter
  index: number
  bookId: string
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: chapter.id })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group flex items-center gap-2 rounded-lg border px-3 py-3 transition-colors select-none",
        isDragging
          ? "border-primary/40 bg-card shadow-lg shadow-black/20 z-10"
          : "border-transparent hover:border-border hover:bg-card"
      )}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground transition-colors touch-none"
        tabIndex={-1}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Index */}
      <span className="w-5 text-xs text-muted-foreground text-right shrink-0 tabular-nums">
        {index + 1}
      </span>

      {/* Title + meta */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{chapter.title}</p>
        {(() => {
          const wc =
            chapter.word_count ||
            (() => {
              const s = chapter.content.replace(/<[^>]+>/g, " ").trim()
              return s ? s.split(/\s+/).filter(Boolean).length : 0
            })()
          return wc > 0 ? (
            <p className="text-xs text-muted-foreground">{wc.toLocaleString()} words</p>
          ) : null
        })()}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="sm" className="gap-1.5 h-8 text-xs" asChild>
          <Link href={`/books/${bookId}/chapters/${chapter.id}`}>
            <PenLine className="h-3.5 w-3.5" />
            Write
          </Link>
        </Button>
        <form action={deleteChapter.bind(null, chapter.id, bookId)}>
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </form>
      </div>
    </li>
  )
}
