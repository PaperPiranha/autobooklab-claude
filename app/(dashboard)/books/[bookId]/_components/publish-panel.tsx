"use client"

import { useState, useTransition } from "react"
import { Globe, Lock, Copy, Check, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { publishBook, unpublishBook } from "@/app/actions/books"

interface PublishPanelProps {
  bookId: string
  initialStatus: "draft" | "published"
}

export function PublishPanel({ bookId, initialStatus }: PublishPanelProps) {
  const [status, setStatus] = useState(initialStatus)
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")

  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/p/${bookId}`
      : `/p/${bookId}`

  function handleToggle() {
    setError("")
    startTransition(async () => {
      const result = status === "published" ? await unpublishBook(bookId) : await publishBook(bookId)
      if (result?.error) {
        setError(result.error)
      } else {
        setStatus((s) => (s === "published" ? "draft" : "published"))
      }
    })
  }

  function handleCopy() {
    navigator.clipboard.writeText(publicUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {status === "published" ? (
            <Globe className="h-4 w-4 text-green-500" />
          ) : (
            <Lock className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-sm">
            {status === "published" ? (
              <span className="text-green-600 font-medium">Published</span>
            ) : (
              <span className="text-muted-foreground">Private draft</span>
            )}
          </span>
        </div>
        <Button
          size="sm"
          variant={status === "published" ? "outline" : "default"}
          onClick={handleToggle}
          disabled={isPending}
          className="text-xs h-7 px-3"
        >
          {isPending
            ? "Saving…"
            : status === "published"
            ? "Unpublish"
            : "Publish to web"}
        </Button>
      </div>

      {status === "published" && (
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
          <span className="flex-1 text-xs text-muted-foreground truncate">/p/{bookId}</span>
          <button
            onClick={handleCopy}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            title="Copy link"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
          <a
            href={`/p/${bookId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            title="Open public page"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
