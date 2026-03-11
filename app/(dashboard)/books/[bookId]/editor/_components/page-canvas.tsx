"use client"

import { cn } from "@/lib/utils"
import type { EditorPage, PageElement } from "@/lib/editor/types"
import { ElementBlock } from "./element-block"

interface PageCanvasProps {
  page: EditorPage
  isActive: boolean
  selectedElementId: string | null
  onSelectElement: (id: string | null) => void
  onUpdateElement: (id: string, updates: Partial<PageElement>) => void
  isNavigator?: boolean
}

export function PageCanvas({
  page,
  isActive,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  isNavigator = false,
}: PageCanvasProps) {
  const sorted = [...page.elements].sort((a, b) => a.zIndex - b.zIndex)

  return (
    <div
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
        />
      ))}
    </div>
  )
}
