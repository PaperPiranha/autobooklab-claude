"use client"

import { useState, useEffect } from "react"
import { Trash2, ChevronUp, ChevronDown, Plus, BookOpen, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEditor } from "./editor-context"
import { PropertiesPanel } from "./properties-panel"
import type { PageElement } from "@/lib/editor/types"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { COVER_PRESETS, CONTENT_PRESETS, BACK_COVER_PRESETS } from "@/lib/editor/page-presets"

const SCALE = 0.17
const THUMB_W = Math.round(794 * SCALE)   // ~135
const THUMB_H = Math.round(1123 * SCALE)  // ~191

function elementColor(type: PageElement["type"]): string {
  switch (type) {
    case "image":
    case "captioned-image":
      return "#93c5fd"
    case "heading":
    case "chapter-heading":
      return "#374151"
    case "divider":
      return "#d1d5db"
    case "callout":
      return "#fed7aa"
    case "table":
      return "#bbf7d0"
    case "toc":
      return "#ddd6fe"
    case "shape":
      return "#fca5a5"
    default:
      return "#9ca3af"
  }
}

function ThumbnailPreview({ elements, backgroundColor }: { elements: PageElement[]; backgroundColor: string }) {
  const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex)

  return (
    <div
      style={{
        width: THUMB_W,
        height: THUMB_H,
        overflow: "hidden",
        position: "relative",
        backgroundColor,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 794,
          height: 1123,
          transform: `scale(${SCALE})`,
          transformOrigin: "top left",
          position: "absolute",
          top: 0,
          left: 0,
          pointerEvents: "none",
        }}
      >
        {sorted.map((el) => (
          <div
            key={el.id}
            style={{
              position: "absolute",
              left: el.x,
              top: el.y,
              width: el.w,
              height: el.h,
              backgroundColor: elementColor(el.type),
              borderRadius: 2,
              zIndex: el.zIndex,
            }}
          />
        ))}
      </div>
    </div>
  )
}

type TabId = "navigator" | "properties"

export function NavigatorPanel() {
  const { state, dispatch } = useEditor()
  const { pages, activePageId, selectedElementId } = state

  const [activeTab, setActiveTab] = useState<TabId>("navigator")

  useEffect(() => {
    if (selectedElementId !== null) {
      setActiveTab("properties")
    }
  }, [selectedElementId])

  const activePage = pages.find((p) => p.id === activePageId)
  const selectedElement = activePage?.elements.find((el) => el.id === selectedElementId) ?? null

  const hasCoverPage = pages.some((p) => p.isCover)

  function handleDeletePage(pageId: string) {
    const page = pages.find((p) => p.id === pageId)
    if (page?.isCover) return
    dispatch({ type: "DELETE_PAGE", pageId })
  }

  function handleMovePage(fromIndex: number, toIndex: number) {
    const page = pages[fromIndex]
    if (page?.isCover) return
    if (toIndex === 0 && pages[0]?.isCover) return
    dispatch({ type: "MOVE_PAGE", fromIndex, toIndex })
  }

  function handleActivatePage(pageId: string) {
    dispatch({ type: "SET_ACTIVE_PAGE", pageId })
  }

  function handleUpdateElement(updates: Partial<PageElement>) {
    if (!selectedElementId) return
    dispatch({ type: "UPDATE_ELEMENT", elementId: selectedElementId, updates })
  }

  function handleDeleteElement() {
    if (!selectedElementId) return
    dispatch({ type: "DELETE_ELEMENT", elementId: selectedElementId })
  }

  return (
    <aside className="w-[220px] shrink-0 bg-sidebar border-l border-border flex flex-col">
      {/* Tab bar */}
      <div className="flex border-b border-border shrink-0">
        <button
          className={cn(
            "flex-1 px-2 py-2 text-xs font-medium transition-colors",
            activeTab === "navigator"
              ? "text-foreground border-b-2 border-primary -mb-px"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setActiveTab("navigator")}
        >
          Navigator
        </button>
        <button
          className={cn(
            "flex-1 px-2 py-2 text-xs font-medium transition-colors",
            activeTab === "properties"
              ? "text-foreground border-b-2 border-primary -mb-px"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setActiveTab("properties")}
        >
          Properties
        </button>
      </div>

      {/* Navigator tab */}
      {activeTab === "navigator" && (
        <>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {pages.map((page, idx) => {
              const isActive = page.id === activePageId
              const isCover = page.isCover ?? false
              const pageType = page.pageType
              return (
                <div key={page.id} className="group relative">
                  <button
                    className={cn(
                      "w-full rounded overflow-hidden border-2 transition-colors",
                      isActive ? "border-primary" : "border-transparent hover:border-muted-foreground/40"
                    )}
                    onClick={() => handleActivatePage(page.id)}
                  >
                    <ThumbnailPreview
                      elements={page.elements}
                      backgroundColor={page.backgroundColor}
                    />
                  </button>

                  <div className="flex items-center justify-center gap-1 mt-1">
                    {isCover && (
                      <BookOpen className="h-3 w-3 text-primary shrink-0" />
                    )}
                    <p className="text-[10px] text-muted-foreground text-center truncate">
                      {page.name}
                    </p>
                    {/* Page type badge */}
                    {pageType === "cover" && !isCover && (
                      <span className="text-[8px] px-1 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-medium">C</span>
                    )}
                    {pageType === "back-cover" && (
                      <span className="text-[8px] px-1 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-medium">BC</span>
                    )}
                  </div>

                  {/* Page actions — visible on hover */}
                  <div className="absolute top-1 right-1 hidden group-hover:flex flex-col gap-0.5">
                    {!isCover && (
                      <>
                        <button
                          className="p-0.5 bg-background/80 rounded hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (idx > 0) handleMovePage(idx, idx - 1)
                          }}
                          disabled={idx === 0 || (idx === 1 && pages[0]?.isCover)}
                          title="Move up"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </button>
                        <button
                          className="p-0.5 bg-background/80 rounded hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (idx < pages.length - 1) handleMovePage(idx, idx + 1)
                          }}
                          disabled={idx === pages.length - 1}
                          title="Move down"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </button>
                        <button
                          className={cn(
                            "p-0.5 bg-background/80 rounded transition-colors",
                            pages.length <= 1
                              ? "text-muted-foreground/30 cursor-not-allowed"
                              : "text-muted-foreground hover:text-destructive hover:bg-background"
                          )}
                          onClick={(e) => {
                            e.stopPropagation()
                            if (pages.length > 1) handleDeletePage(page.id)
                          }}
                          disabled={pages.length <= 1}
                          title="Delete page"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Add Page dropdown */}
          <div className="p-3 border-t border-border shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center justify-center gap-1.5 py-2 rounded border border-dashed border-border text-xs text-muted-foreground hover:text-foreground hover:border-muted-foreground/60 transition-colors">
                  <Plus className="h-3.5 w-3.5" />
                  Add Page
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-48">
                <DropdownMenuItem onClick={() => dispatch({ type: "ADD_PAGE" })}>
                  Blank Page
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    Content
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {CONTENT_PRESETS.map((preset) => (
                      <DropdownMenuItem
                        key={preset.id}
                        onClick={() => dispatch({ type: "ADD_TYPED_PAGE", pageType: "content", presetId: preset.id })}
                      >
                        <div>
                          <div className="text-xs font-medium">{preset.label}</div>
                          <div className="text-[10px] text-muted-foreground">{preset.description}</div>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    Back Cover
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {BACK_COVER_PRESETS.map((preset) => (
                      <DropdownMenuItem
                        key={preset.id}
                        onClick={() => dispatch({ type: "ADD_TYPED_PAGE", pageType: "back-cover", presetId: preset.id })}
                      >
                        <div>
                          <div className="text-xs font-medium">{preset.label}</div>
                          <div className="text-[10px] text-muted-foreground">{preset.description}</div>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                {!hasCoverPage && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        Cover
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        {COVER_PRESETS.map((preset) => (
                          <DropdownMenuItem
                            key={preset.id}
                            onClick={() => dispatch({ type: "ADD_TYPED_PAGE", pageType: "cover", presetId: preset.id })}
                          >
                            <div>
                              <div className="text-xs font-medium">{preset.label}</div>
                              <div className="text-[10px] text-muted-foreground">{preset.description}</div>
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </>
      )}

      {/* Properties tab */}
      {activeTab === "properties" && (
        <div className="flex-1 overflow-hidden flex flex-col">
          {selectedElement ? (
            <PropertiesPanel
              element={selectedElement}
              onUpdate={handleUpdateElement}
              onDelete={handleDeleteElement}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 p-4 text-center">
              <p className="text-xs text-muted-foreground">No element selected</p>
              <p className="text-xs text-muted-foreground/60">
                Click an element on the canvas to inspect its properties.
              </p>
            </div>
          )}
        </div>
      )}
    </aside>
  )
}
