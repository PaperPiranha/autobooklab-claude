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
import { useEditor } from "./editor-context"

type Tab = "write" | "images"
type WriteAction = "generate" | "rewrite" | "summarize"

interface BookInfo {
  id: string
  title: string
  genre: string
  description: string
}

interface UnsplashPhoto {
  id: string
  url: string
  thumb: string
  description: string
  credit: string
  creditLink: string
}

interface EditorAIPanelProps {
  book: BookInfo
  onClose: () => void
}

const TEXT_ELEMENT_TYPES = new Set([
  "text",
  "heading",
  "chapter-heading",
  "callout",
])

function elementTypeLabel(type: string): string {
  switch (type) {
    case "text": return "Text Block"
    case "heading": return "Heading"
    case "chapter-heading": return "Chapter Heading"
    case "callout": return "Callout"
    case "image": return "Image"
    case "captioned-image": return "Captioned Image"
    default: return type
  }
}

export function EditorAIPanel({ book, onClose }: EditorAIPanelProps) {
  const { state, dispatch } = useEditor()
  const { selectedElementId, pages, activePageId } = state

  const activePage = pages.find((p) => p.id === activePageId)
  const selectedElement = activePage?.elements.find((e) => e.id === selectedElementId) ?? null

  const isTextElement = selectedElement ? TEXT_ELEMENT_TYPES.has(selectedElement.type) : false
  const isImageElement =
    selectedElement?.type === "image" || selectedElement?.type === "captioned-image"

  const [tab, setTab] = useState<Tab>("write")
  const [action, setAction] = useState<WriteAction>("generate")
  const [customPrompt, setCustomPrompt] = useState("")
  const [apiError, setApiError] = useState("")

  // Image search state
  const [imageQuery, setImageQuery] = useState("")
  const [images, setImages] = useState<UnsplashPhoto[]>([])
  const [imageLoading, setImageLoading] = useState(false)
  const [imagePage, setImagePage] = useState(1)
  const [imageTotalPages, setImageTotalPages] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)

  const {
    completion,
    complete,
    isLoading: isGenerating,
    stop,
    setCompletion,
  } = useCompletion({
    api: "/api/ai/generate",
    streamProtocol: "text",
    onError: (err) => {
      try {
        const msg = JSON.parse(err.message)?.error ?? err.message
        setApiError(msg)
      } catch {
        setApiError(err.message)
      }
    },
  })

  async function handleGenerate() {
    setApiError("")
    setCompletion("")
    await complete("", {
      body: {
        action,
        bookTitle: book.title,
        chapterTitle:
          selectedElement?.type === "chapter-heading"
            ? (selectedElement.content.text ?? "")
            : "Section",
        genre: book.genre ?? "",
        description: book.description ?? "",
        chapterContent: selectedElement?.content.text ?? "",
        customPrompt,
      },
    })
  }

  function handleInsert() {
    if (!selectedElementId || !completion) return
    dispatch({
      type: "UPDATE_ELEMENT",
      elementId: selectedElementId,
      updates: {
        content: {
          ...(selectedElement?.content ?? {}),
          text: completion,
        },
      },
    })
  }

  async function searchImages() {
    if (!imageQuery.trim()) return
    setImageLoading(true)
    setImagePage(1)
    try {
      const res = await fetch(
        `/api/images/search?q=${encodeURIComponent(imageQuery)}&page=1`
      )
      const data = await res.json()
      setImages(data.photos ?? [])
      setImageTotalPages(data.totalPages ?? 0)
    } finally {
      setImageLoading(false)
    }
  }

  async function loadMoreImages() {
    const nextPage = imagePage + 1
    setLoadingMore(true)
    try {
      const res = await fetch(
        `/api/images/search?q=${encodeURIComponent(imageQuery)}&page=${nextPage}`
      )
      const data = await res.json()
      setImages((prev) => [...prev, ...(data.photos ?? [])])
      setImageTotalPages(data.totalPages ?? 0)
      setImagePage(nextPage)
    } finally {
      setLoadingMore(false)
    }
  }

  function handleInsertImage(photo: UnsplashPhoto) {
    if (!selectedElementId) return
    dispatch({
      type: "UPDATE_ELEMENT",
      elementId: selectedElementId,
      updates: {
        content: {
          ...(selectedElement?.content ?? {}),
          src: photo.url,
          alt: photo.description,
        },
      },
    })
  }

  return (
    <aside className="w-[280px] shrink-0 border-l border-border bg-sidebar flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2 shrink-0">
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
          {/* Selected element info */}
          {selectedElement && isTextElement ? (
            <div className="text-xs text-muted-foreground bg-secondary/50 rounded px-2 py-1.5">
              Editing:{" "}
              <span className="text-foreground font-medium">
                {elementTypeLabel(selectedElement.type)}
              </span>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground bg-secondary/50 rounded px-2 py-1.5 italic">
              Select a text element to use AI writing tools
            </div>
          )}

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
                <SelectItem value="generate">Generate draft</SelectItem>
                <SelectItem value="rewrite">Rewrite</SelectItem>
                <SelectItem value="summarize">Summarize</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom prompt */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">
              Extra instructions (optional)
            </label>
            <Textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g. more concise, add examples…"
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
            disabled={isGenerating || !isTextElement}
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
                {action === "generate"
                  ? "Generate"
                  : action === "rewrite"
                  ? "Rewrite"
                  : "Summarize"}
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
                className="min-h-[100px] max-h-[240px] overflow-y-auto rounded-md border border-border bg-background p-3 text-xs leading-relaxed text-foreground"
                style={{
                  fontFamily: "var(--font-inter), system-ui, sans-serif",
                  fontSize: "0.8125rem",
                }}
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
                    onClick={handleInsert}
                    disabled={!isTextElement}
                  >
                    <CheckCheck className="h-3 w-3" />
                    Insert
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
          {!isImageElement && (
            <div className="text-xs text-muted-foreground bg-secondary/50 rounded px-2 py-1.5 italic">
              Select an image element to search photos
            </div>
          )}

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
              Add{" "}
              <code className="bg-secondary px-1 rounded">
                NEXT_PUBLIC_UNSPLASH_ACCESS_KEY
              </code>{" "}
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
                    disabled={!isImageElement}
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
              {imagePage < imageTotalPages && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={loadMoreImages}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  ) : null}
                  {loadingMore ? "Loading…" : "Load more"}
                </Button>
              )}
              <p className="text-[10px] text-muted-foreground text-center">
                Photos from Unsplash. Click to insert into element.
              </p>
            </>
          )}

          {images.length === 0 && imageQuery && !imageLoading && (
            <p className="text-xs text-muted-foreground text-center py-4">
              No results found.
            </p>
          )}
        </div>
      )}
    </aside>
  )
}
