"use client"

import { cn } from "@/lib/utils"
import type { EditorPage, PageElement } from "@/lib/editor/types"
import { ElementBlock } from "./element-block"
import { EmptyPageOverlay } from "./empty-page-overlay"
import type { AlignmentGuide } from "@/lib/editor/snap"

interface PageCanvasProps {
  page: EditorPage
  isActive: boolean
  selectedElementId: string | null
  onSelectElement: (id: string | null) => void
  onUpdateElement: (id: string, updates: Partial<PageElement>) => void
  isNavigator?: boolean
  guides?: AlignmentGuide[]
  onGuidesChange?: (guides: AlignmentGuide[]) => void
  onOpenTab?: (tab: string) => void
}

export function PageCanvas({
  page,
  isActive,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  isNavigator = false,
  guides = [],
  onGuidesChange,
  onOpenTab,
}: PageCanvasProps) {
  const sorted = [...page.elements].sort((a, b) => a.zIndex - b.zIndex)
  const isEmpty = page.elements.length === 0 && isActive && !isNavigator

  return (
    <div
      data-page-id={page.id}
      className={cn(
        "relative shadow-2xl",
        isActive && !isNavigator && "ring-2 ring-primary",
        isNavigator && "pointer-events-none"
      )}
      style={{
        width: 794,
        height: 1123,
        backgroundColor: page.backgroundColor,
        flexShrink: 0,
      }}
      onClick={(e) => {
        if (!isNavigator && e.target === e.currentTarget) {
          onSelectElement(null)
        }
      }}
    >
      {sorted.map((element) => (
        <ElementBlock
          key={element.id}
          element={element}
          isSelected={!isNavigator && selectedElementId === element.id}
          isNavigator={isNavigator}
          onSelect={() => {
            if (!isNavigator) onSelectElement(element.id)
          }}
          onUpdate={(updates) => {
            if (!isNavigator) onUpdateElement(element.id, updates)
          }}
          onGuidesChange={onGuidesChange}
          allElements={page.elements}
        />
      ))}

      {/* Alignment guide lines */}
      {guides.map((guide, i) => (
        <div
          key={i}
          className="absolute pointer-events-none z-[999]"
          style={
            guide.orientation === "vertical"
              ? {
                  left: guide.position,
                  top: 0,
                  width: 1,
                  height: 1123,
                  borderLeft: "1px dashed #3b82f6",
                }
              : {
                  top: guide.position,
                  left: 0,
                  height: 1,
                  width: 794,
                  borderTop: "1px dashed #3b82f6",
                }
          }
        />
      ))}

      {/* Empty page overlay */}
      {isEmpty && onOpenTab && (
        <EmptyPageOverlay
          onOpenElements={() => onOpenTab("elements")}
          onOpenLayouts={() => onOpenTab("layouts")}
          onOpenAI={() => onOpenTab("ai")}
        />
      )}
    </div>
  )
}
