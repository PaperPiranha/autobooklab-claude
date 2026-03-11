"use client"

import { useState } from "react"
import { Sparkles, Loader2, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEditor } from "./editor-context"
import type { EditorPage } from "@/lib/editor/types"

interface AiSeedBannerProps {
  bookId: string
}

export function AiSeedBanner({ bookId }: AiSeedBannerProps) {
  const { dispatch } = useEditor()
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState("")

  async function handleGenerate() {
    setIsGenerating(true)
    setError("")
    try {
      const res = await fetch("/api/ai/seed-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Generation failed")
      const pages = data.pages as EditorPage[]
      dispatch({ type: "REPLACE_PAGES", pages })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate layout")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div
        className="pointer-events-auto flex flex-col items-center gap-4 rounded-xl border border-white/10 bg-[#1a1a1a]/90 backdrop-blur-sm px-8 py-8 max-w-sm text-center shadow-2xl"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
          <Wand2 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-white mb-1">This page is blank</p>
          <p className="text-xs text-white/50 leading-relaxed">
            Let AI build a full book layout from your chapters, or start adding elements manually.
          </p>
        </div>
        {error && (
          <p className="text-xs text-destructive bg-destructive/10 rounded px-3 py-2 w-full">
            {error}
          </p>
        )}
        <div className="flex flex-col gap-2 w-full">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full gap-2"
            size="sm"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Generating layout…
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Generate with AI
              </>
            )}
          </Button>
          <p className="text-[10px] text-white/30">
            Uses your book title, genre &amp; chapters as context
          </p>
        </div>
      </div>
    </div>
  )
}
