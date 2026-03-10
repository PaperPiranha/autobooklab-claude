"use client"

import { useState } from "react"
import { useCompletion } from "@ai-sdk/react"
import {
  Sparkles,
  Image as ImageIcon,
  X,
  Loader2,
  RotateCcw,
  CheckCheck,
  Search,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

type Tab = "write" | "images"
type WriteAction = "generate" | "rewrite" | "summarize"

interface Book {
  title: string
  genre: string
  description: string
}

interface Chapter {
  id: string
  title: string
  content: string
}

interface UnsplashPhoto {
  id: string
  url: string
  thumb: string
  description: string
  credit: string
  creditLink: string
}

interface AiPanelProps {
  book: Book
  chapter: Chapter
  selectedText: string
  onInsert: (text: string, replace?: boolean) => void
  onInsertImage?: (src: string, alt: string, credit: string) => void
  onClose: () => void
  credits: number
  onCreditsChange: (delta: number) => void
}

export function AiPanel({
  book,
  chapter,
  selectedText,
  onInsert,
  onInsertImage,
  onClose,
  credits,
  onCreditsChange,
}: AiPanelProps) {
  const [tab, setTab] = useState<Tab>("write")
  const [action, setAction] = useState<WriteAction>("generate")
  const [customPrompt, setCustomPrompt] = useState("")
  const [apiError, setApiError] = useState("")

  // Image search state
  const [imageQuery, setImageQuery] = useState("")
  const [images, setImages] = useState<UnsplashPhoto[]>([])
  const [imageLoading, setImageLoading] = useState(false)

  const creditCost = action === "generate" ? 2 : 1

  const {
    completion,
    complete,
    isLoading: isGenerating,
    stop,
    setCompletion,
  } = useCompletion({
    api: action === "rewrite" ? "/api/ai/rewrite" : "/api/ai/generate",
    streamProtocol: "text",
    onError: (err) => {
      try {
        const msg = JSON.parse(err.message)?.error ?? err.message
        setApiError(msg)
      } catch {
        setApiError(err.message)
      }
    },
    onFinish: () => {
      onCreditsChange(-creditCost)
    },
  })

  async function handleGenerate() {
    setApiError("")
    if (action === "rewrite" && !selectedText.trim()) {
      setApiError("Select text in the editor first.")
      return
    }
    setCompletion("")
    await complete("", {
      body:
        action === "rewrite"
          ? { selectedText, instruction: customPrompt }
          : {
              action,
              bookTitle: book.title,
              chapterTitle: chapter.title,
              genre: book.genre,
              description: book.description,
              chapterContent: chapter.content,
              customPrompt,
            },
    })
  }

  async function searchImages() {
    if (!imageQuery.trim()) return
    setImageLoading(true)
    try {
      const res = await fetch(`/api/images/search?q=${encodeURIComponent(imageQuery)}`)
      const data = await res.json()
      setImages(data)
    } finally {
      setImageLoading(false)
    }
  }

  function handleInsertImage(photo: UnsplashPhoto) {
    if (onInsertImage) {
      onInsertImage(photo.url, photo.description, photo.credit)
    } else {
      onInsert(`\n![${photo.description}](${photo.url})\n*Photo by ${photo.credit}*\n`)
    }
  }

  return (
    <div className="flex w-80 shrink-0 flex-col border-l border-sidebar-border bg-sidebar">
      {/* Header tabs */}
      <div className="flex items-center justify-between border-b border-sidebar-border px-3 py-2">
        <div className="flex gap-0.5 rounded-md bg-secondary p-0.5">
          <button
            onClick={() => setTab("write")}
            className={cn(
              "flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors",
              tab === "write"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Sparkles className="h-3 w-3" />
            Write
          </button>
          <button
            onClick={() => setTab("images")}
            className={cn(
              "flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors",
              tab === "images"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ImageIcon className="h-3 w-3" />
            Images
          </button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Write tab */}
      {tab === "write" && (
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
          {/* Credits badge */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">AI credits remaining</span>
            <span
              className={cn(
                "font-medium tabular-nums",
                credits <= 2 ? "text-destructive" : "text-primary"
              )}
            >
              {credits}
            </span>
          </div>

          {/* Action selector */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Action</label>
            <Select
              value={action}
              onValueChange={(v) => {
                setAction(v as WriteAction)
                setCompletion("")
                setApiError("")
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="generate">Generate draft (2 credits)</SelectItem>
                <SelectItem value="rewrite">Rewrite selection (1 credit)</SelectItem>
                <SelectItem value="summarize">Summarize chapter (1 credit)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Rewrite: show selected text */}
          {action === "rewrite" && (
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Selected text</label>
              <div
                className={cn(
                  "min-h-[60px] rounded-md border px-3 py-2 text-xs leading-relaxed",
                  selectedText.trim()
                    ? "border-border bg-input text-foreground"
                    : "border-border/50 bg-secondary text-muted-foreground italic"
                )}
              >
                {selectedText.trim() || "Select text in the editor…"}
              </div>
            </div>
          )}

          {/* Custom prompt */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">
              {action === "rewrite" ? "How to rewrite? (optional)" : "Extra instructions (optional)"}
            </label>
            <Textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder={
                action === "rewrite"
                  ? "e.g. more concise, formal tone…"
                  : "e.g. add examples, more conversational…"
              }
              rows={2}
              className="text-xs"
            />
          </div>

          {/* Error */}
          {apiError && (
            <div className="flex items-start gap-2 rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              {apiError}
            </div>
          )}

          {/* Generate button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || credits < creditCost}
            size="sm"
            className="gap-1.5 w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                {action === "generate" ? "Generate" : action === "rewrite" ? "Rewrite" : "Summarize"}
                <span className="ml-auto opacity-60 text-[10px]">{creditCost}cr</span>
              </>
            )}
          </Button>

          {/* Result area */}
          {(completion || isGenerating) && (
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground">Result</label>
                {!isGenerating && (
                  <button
                    onClick={() => setCompletion("")}
                    className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <RotateCcw className="h-2.5 w-2.5" />
                    Clear
                  </button>
                )}
              </div>
              <div
                className="min-h-[120px] max-h-[280px] overflow-y-auto rounded-md border border-border bg-background p-3 text-xs leading-relaxed text-foreground"
                style={{ fontFamily: "var(--font-instrument-serif)", fontSize: "0.8125rem" }}
              >
                {completion}
                {isGenerating && (
                  <span className="inline-block h-3 w-0.5 animate-pulse bg-primary ml-0.5" />
                )}
              </div>

              {!isGenerating && completion && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-1.5 text-xs h-7"
                    onClick={() =>
                      onInsert(
                        completion,
                        action === "rewrite" && !!selectedText.trim()
                      )
                    }
                  >
                    <CheckCheck className="h-3 w-3" />
                    {action === "rewrite" && selectedText.trim() ? "Replace selection" : "Insert"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs h-7 text-muted-foreground"
                    onClick={handleGenerate}
                  >
                    Retry
                  </Button>
                </div>
              )}

              {isGenerating && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs h-7 text-muted-foreground"
                  onClick={stop}
                >
                  Stop
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Images tab */}
      {tab === "images" && (
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
          <div className="flex gap-2">
            <Input
              value={imageQuery}
              onChange={(e) => setImageQuery(e.target.value)}
              placeholder="Search Unsplash…"
              className="h-8 text-xs"
              onKeyDown={(e) => e.key === "Enter" && searchImages()}
            />
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 shrink-0"
              onClick={searchImages}
              disabled={imageLoading || !imageQuery.trim()}
            >
              {imageLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Search className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>

          {!process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY && images.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              Add <code className="bg-secondary px-1 rounded">NEXT_PUBLIC_UNSPLASH_ACCESS_KEY</code>{" "}
              to .env.local to enable image search.
            </p>
          )}

          {images.length > 0 && (
            <>
              <div className="grid grid-cols-3 gap-1.5">
                {images.map((photo) => (
                  <button
                    key={photo.id}
                    onClick={() => handleInsertImage(photo)}
                    className="group relative aspect-video overflow-hidden rounded-md border border-border hover:border-primary/60 transition-colors"
                    title={`${photo.description} — by ${photo.credit}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.thumb}
                      alt={photo.description}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                Photos from Unsplash. Click to insert into chapter.
              </p>
            </>
          )}

          {images.length === 0 && imageQuery && !imageLoading && (
            <p className="text-xs text-muted-foreground text-center py-4">No results found.</p>
          )}
        </div>
      )}
    </div>
  )
}
