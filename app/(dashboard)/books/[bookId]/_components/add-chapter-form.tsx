"use client"

import { useState, useTransition } from "react"
import { Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { addChapter } from "@/app/actions/books"

export function AddChapterForm({ bookId }: { bookId: string }) {
  const [title, setTitle] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleAdd() {
    if (!title.trim()) return
    startTransition(async () => {
      await addChapter(bookId, title)
      setTitle("")
    })
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="New chapter title…"
        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        disabled={isPending}
        className="max-w-sm"
      />
      <Button
        onClick={handleAdd}
        disabled={!title.trim() || isPending}
        size="sm"
        variant="outline"
        className="gap-1.5"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        Add chapter
      </Button>
    </div>
  )
}
