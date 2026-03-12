"use client"

import { Layers, Layout, Sparkles } from "lucide-react"

interface EmptyPageOverlayProps {
  onOpenElements: () => void
  onOpenLayouts: () => void
  onOpenAI: () => void
}

export function EmptyPageOverlay({ onOpenElements, onOpenLayouts, onOpenAI }: EmptyPageOverlayProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
      <div className="flex flex-col items-center gap-4 pointer-events-auto">
        <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center">
          <Layers className="h-6 w-6 text-muted-foreground/60" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">This page is empty</p>
        <div className="flex gap-2">
          <button
            onClick={onOpenElements}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Layers className="h-3.5 w-3.5" />
            Add Elements
          </button>
          <button
            onClick={onOpenLayouts}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-border text-foreground hover:bg-muted transition-colors"
          >
            <Layout className="h-3.5 w-3.5" />
            Choose Layout
          </button>
          <button
            onClick={onOpenAI}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-border text-foreground hover:bg-muted transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI Generate
          </button>
        </div>
        <p className="text-xs text-muted-foreground/60">
          Click elements from the left panel to get started
        </p>
      </div>
    </div>
  )
}
