"use client"

import { useEffect, useState } from "react"
import { Loader2, Wand2 } from "lucide-react"
import { useEditor } from "./editor-context"
import type { EditorPage } from "@/lib/editor/types"

interface AiSeedBannerProps {
  bookId: string
}

export function AiSeedBanner({ bookId }: AiSeedBannerProps) {
  const { dispatch } = useEditor()
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false

    async function seed() {
      try {
        const res = await fetch("/api/ai/seed-pages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookId }),
        })
        const data = await res.json()
        if (cancelled) return
        if (!res.ok) throw new Error(data.error ?? "Generation failed")
        const pages = data.pages as EditorPage[]
        dispatch({ type: "REPLACE_PAGES", pages })
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to build layout")
      }
    }

    seed()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId])

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="pointer-events-auto flex flex-col items-center gap-4 rounded-xl border border-white/10 bg-[#1a1a1a]/90 backdrop-blur-sm px-8 py-8 max-w-sm text-center shadow-2xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
          <Wand2 className="h-6 w-6 text-primary" />
        </div>
        {error ? (
          <p className="text-xs text-destructive bg-destructive/10 rounded px-3 py-2 w-full">
            {error}
          </p>
        ) : (
          <>
            <p className="text-sm font-medium text-white mb-1 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Building layout from your chapters…
            </p>
            <p className="text-xs text-white/50 leading-relaxed">
              Your chapter content is being laid out now.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
