"use client"

import { useEffect, useRef } from "react"
import { useEditor } from "./editor-context"
import { PageCanvas } from "./page-canvas"
import { AiSeedBanner } from "./ai-seed-banner"
import type { PageElement } from "@/lib/editor/types"

export function CanvasArea({ bookId }: { bookId: string }) {
  const { state, dispatch } = useEditor()
  const { pages, activePageId, selectedElementId } = state
  const isBlank = pages.every((p) => p.elements.length === 0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Delete/Backspace key listener
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!selectedElementId) return
      const tag = (e.target as HTMLElement).tagName.toLowerCase()
      if (tag === "input" || tag === "textarea" || (e.target as HTMLElement).isContentEditable) return
      if (e.key === "Delete" || e.key === "Backspace") {
        dispatch({ type: "DELETE_ELEMENT", elementId: selectedElementId })
      }
    }
    const el = containerRef.current
    el?.addEventListener("keydown", onKeyDown)
    return () => el?.removeEventListener("keydown", onKeyDown)
  }, [selectedElementId, dispatch])

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
      <div className="py-12 px-12 flex flex-col items-center" style={{ gap: 40 }}>
        {pages.map((page) => {
          const isActive = page.id === activePageId
          return (
            <div key={page.id} className="flex flex-col items-center">
              <span className="text-xs text-white/30 mb-2 select-none">{page.name}</span>
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
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
