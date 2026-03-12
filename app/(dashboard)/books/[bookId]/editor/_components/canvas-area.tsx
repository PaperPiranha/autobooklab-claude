"use client"

import { useRef, useState, useCallback } from "react"
import { useEditor } from "./editor-context"
import { PageCanvas } from "./page-canvas"
import { AiSeedBanner } from "./ai-seed-banner"
import type { PageElement } from "@/lib/editor/types"
import type { AlignmentGuide } from "@/lib/editor/snap"

interface CanvasAreaProps {
  bookId: string
  onOpenTab?: (tab: string) => void
}

export function CanvasArea({ bookId, onOpenTab }: CanvasAreaProps) {
  const { state, dispatch } = useEditor()
  const { pages, activePageId, selectedElementId, zoom } = state
  const isBlank = pages.every((p) => p.elements.length === 0)
  const containerRef = useRef<HTMLDivElement>(null)
  const [guides, setGuides] = useState<AlignmentGuide[]>([])

  const handleGuidesChange = useCallback((newGuides: AlignmentGuide[]) => {
    setGuides(newGuides)
  }, [])

  function handleUpdateElement(id: string, updates: Partial<PageElement>) {
    dispatch({ type: "UPDATE_ELEMENT", elementId: id, updates })
  }

  function handleSelectElement(id: string | null) {
    dispatch({ type: "SET_SELECTED_ELEMENT", elementId: id })
  }

  function handlePageClick(pageId: string) {
    if (pageId !== activePageId) {
      dispatch({ type: "SET_ACTIVE_PAGE", pageId })
    }
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className="flex-1 min-w-0 overflow-auto bg-[#2a2a2a] focus:outline-none relative"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleSelectElement(null)
        }
      }}
    >
      {isBlank && <AiSeedBanner bookId={bookId} />}
      <div
        className="py-12 px-12 flex flex-col items-center"
        style={{
          gap: 40,
          transform: `scale(${zoom})`,
          transformOrigin: "top center",
          minHeight: `${(pages.length * (1123 + 40) + 80) * zoom}px`,
        }}
      >
        {pages.map((page) => {
          const isActive = page.id === activePageId
          return (
            <div key={page.id} className="flex flex-col items-center">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-white/30 select-none">{page.name}</span>
                {page.pageType && page.pageType !== "content" && (
                  <span
                    className={cn(
                      "text-[9px] px-1.5 py-0.5 rounded-full font-medium",
                      page.pageType === "cover"
                        ? "bg-orange-500/20 text-orange-400"
                        : "bg-purple-500/20 text-purple-400"
                    )}
                  >
                    {page.pageType === "cover" ? "Cover" : "Back Cover"}
                  </span>
                )}
              </div>
              <div
                onClick={(e) => {
                  if (!isActive) {
                    e.stopPropagation()
                    handlePageClick(page.id)
                  }
                }}
              >
                <PageCanvas
                  page={page}
                  isActive={isActive}
                  selectedElementId={isActive ? selectedElementId : null}
                  onSelectElement={handleSelectElement}
                  onUpdateElement={handleUpdateElement}
                  guides={isActive ? guides : []}
                  onGuidesChange={isActive ? handleGuidesChange : undefined}
                  onOpenTab={onOpenTab}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ")
}
