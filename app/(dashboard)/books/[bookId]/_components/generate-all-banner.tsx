"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, PenLine, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { updateChapterContent } from "@/app/actions/books"
import type { Book, Chapter } from "@/lib/types"
import Link from "next/link"

interface GenerateAllBannerProps {
  book: Book
  chapters: Chapter[]
  creditBalance: number
  canBatchGenerate?: boolean
}

const CREDITS_PER_CHAPTER = 2

export function GenerateAllBanner({ book, chapters, creditBalance, canBatchGenerate = true }: GenerateAllBannerProps) {
  const router = useRouter()
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [customPrompt, setCustomPrompt] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  // Only show for chapters with no content
  const emptyChapters = chapters.filter((c) => !c.content?.trim())
  const totalCost = emptyChapters.length * CREDITS_PER_CHAPTER

  // Don't render if batch generate not available on this plan
  if (!canBatchGenerate) return null

  // Don't render if all chapters already have content
  if (emptyChapters.length === 0 || status === "done") {
    if (status === "done") {
      return (
        <div className="rounded-lg border border-border bg-muted/30 px-5 py-4 flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            ✅ All chapters generated. Ready to design your eBook.
          </p>
          <Button size="sm" asChild>
            <Link href={`/books/${book.id}/editor`}>Open Visual Editor →</Link>
          </Button>
        </div>
      )
    }
    return null
  }

  const progress = status === "running" ? Math.round((currentIndex / emptyChapters.length) * 100) : 0
  const currentChapter = emptyChapters[currentIndex]

  async function handleGenerate() {
    if (creditBalance < totalCost) {
      setErrorMessage(
        `You need ${totalCost} credits but only have ${creditBalance}. Please upgrade your plan.`
      )
      return
    }

    setStatus("running")
    setCurrentIndex(0)
    setErrorMessage("")

    for (let i = 0; i < emptyChapters.length; i++) {
      setCurrentIndex(i)
      const chapter = emptyChapters[i]

      try {
        const response = await fetch("/api/ai/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "generate",
            bookTitle: book.title,
            chapterTitle: chapter.title,
            genre: book.genre,
            description: book.description,
            customPrompt: customPrompt.trim() || undefined,
          }),
        })

        if (!response.ok) {
          const err = await response.json().catch(() => ({}))
          throw new Error(err.error ?? `HTTP ${response.status}`)
        }

        // Read streaming response
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        let text = ""

        if (reader) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            text += decoder.decode(value, { stream: true })
          }
        }

        // Save immediately so partial progress is kept if tab closes
        await updateChapterContent(chapter.id, text)
      } catch (err) {
        setStatus("error")
        setErrorMessage(err instanceof Error ? err.message : "Generation failed")
        return
      }
    }

    setStatus("done")
    router.refresh()
  }

  if (status === "running") {
    return (
      <div className="rounded-lg border border-orange-500/30 bg-orange-500/5 px-5 py-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <PenLine className="h-4 w-4 text-orange-400 shrink-0" />
          <p className="text-sm font-medium">
            Writing &ldquo;{currentChapter?.title}&rdquo;{" "}
            <span className="text-muted-foreground font-normal">
              ({currentIndex + 1} of {emptyChapters.length})
            </span>
          </p>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden mb-2">
          <div
            className="h-full bg-orange-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">Do not close this tab</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-muted/20 px-5 py-4 mb-4 space-y-3">
      <div className="flex items-start gap-2">
        <Sparkles className="h-4 w-4 text-orange-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium">
            Your chapters are ready — let AI write the content
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Generate a full draft for all {emptyChapters.length} chapter
            {emptyChapters.length !== 1 ? "s" : ""} automatically.{" "}
            <span className="text-foreground">Cost: {totalCost} credits</span>
            {" · "}
            <span>You have {creditBalance}</span>
            {" · "}
            <span>~{Math.ceil(emptyChapters.length * 0.4)} min</span>
          </p>
        </div>
      </div>

      <Input
        placeholder='Optional: Add context (e.g. "casual tone, UK audience")'
        value={customPrompt}
        onChange={(e) => setCustomPrompt(e.target.value)}
        className="text-sm"
      />

      {errorMessage && (
        <div className="flex items-center gap-2 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>
            {errorMessage}{" "}
            {errorMessage.includes("credits") && (
              <Link href="/settings" className="underline">
                Upgrade plan →
              </Link>
            )}
          </span>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button
          size="sm"
          className="gap-2 bg-orange-500 hover:bg-orange-600 text-white"
          onClick={handleGenerate}
          disabled={creditBalance < totalCost}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Generate all chapters
        </Button>
        <span className="text-xs text-muted-foreground">or</span>
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-auto py-0" asChild>
          <Link href={`/books/${book.id}/chapters/${chapters[0]?.id}`}>I&apos;ll write myself</Link>
        </Button>
      </div>
    </div>
  )
}
