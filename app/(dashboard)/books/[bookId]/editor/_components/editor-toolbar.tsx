"use client"

import Link from "next/link"
import {
  ArrowLeft,
  Check,
  Loader2,
  Undo2,
  Redo2,
  Download,
  ChevronDown,
  Minus,
  Plus,
  Maximize,
  Keyboard,
} from "lucide-react"
import { useEditor } from "./editor-context"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5]

interface EditorToolbarProps {
  book: { id: string; title: string }
  onExportPDF: () => void
  onExportEPUB: () => void
  isExporting: boolean
  onShowShortcuts?: () => void
}

export function EditorToolbar({
  book,
  onExportPDF,
  onExportEPUB,
  isExporting,
  onShowShortcuts,
}: EditorToolbarProps) {
  const { state, dispatch } = useEditor()
  const { saveStatus, zoom } = state

  const canUndo = state.past.length > 0
  const canRedo = state.future.length > 0

  function setZoom(z: number) {
    dispatch({ type: "SET_ZOOM", zoom: Math.max(0.5, Math.min(1.5, z)) })
  }

  return (
    <header className="flex items-center justify-between h-12 px-3 border-b border-border bg-background shrink-0 z-20">
      {/* Left */}
      <div className="flex items-center gap-2 min-w-0 w-[220px]">
        <Link
          href={`/books/${book.id}`}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back</span>
        </Link>
        <span className="text-muted-foreground/40 shrink-0">/</span>
        <span className="text-sm font-medium truncate">{book.title}</span>
      </div>

      {/* Center — save status */}
      <div className="flex items-center gap-1.5 text-xs">
        {saveStatus === "saved" && (
          <>
            <Check className="h-3.5 w-3.5 text-green-500" />
            <span className="text-muted-foreground">Saved</span>
          </>
        )}
        {saveStatus === "saving" && (
          <>
            <Loader2 className="h-3.5 w-3.5 text-muted-foreground animate-spin" />
            <span className="text-muted-foreground">Saving…</span>
          </>
        )}
        {saveStatus === "unsaved" && (
          <span className={cn("text-orange-400")}>Unsaved changes</span>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-1.5 w-[320px] justify-end">
        {/* Undo */}
        <button
          onClick={() => dispatch({ type: "UNDO" })}
          disabled={!canUndo}
          title="Undo (Cmd+Z)"
          className={cn(
            "p-1.5 rounded transition-colors",
            canUndo
              ? "text-muted-foreground hover:text-foreground hover:bg-accent"
              : "text-muted-foreground/30 cursor-not-allowed"
          )}
        >
          <Undo2 className="h-4 w-4" />
        </button>

        {/* Redo */}
        <button
          onClick={() => dispatch({ type: "REDO" })}
          disabled={!canRedo}
          title="Redo (Cmd+Shift+Z)"
          className={cn(
            "p-1.5 rounded transition-colors",
            canRedo
              ? "text-muted-foreground hover:text-foreground hover:bg-accent"
              : "text-muted-foreground/30 cursor-not-allowed"
          )}
        >
          <Redo2 className="h-4 w-4" />
        </button>

        <span className="w-px h-4 bg-border shrink-0" />

        {/* Zoom controls */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setZoom(zoom - 0.25)}
            disabled={zoom <= 0.5}
            title="Zoom out (Cmd+-)"
            className={cn(
              "p-1 rounded transition-colors",
              zoom > 0.5
                ? "text-muted-foreground hover:text-foreground hover:bg-accent"
                : "text-muted-foreground/30 cursor-not-allowed"
            )}
          >
            <Minus className="h-3.5 w-3.5" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-xs text-muted-foreground border border-border rounded px-1.5 py-0.5 hover:text-foreground hover:border-muted-foreground/60 transition-colors min-w-[42px] text-center">
                {Math.round(zoom * 100)}%
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              {ZOOM_LEVELS.map((level) => (
                <DropdownMenuItem key={level} onClick={() => setZoom(level)}>
                  {Math.round(level * 100)}%
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem onClick={() => {
                // Fit to container width — approximate
                const container = document.querySelector(".flex-1.min-w-0.overflow-auto")
                if (container) {
                  const cw = container.clientWidth - 96 // padding
                  setZoom(Math.min(1.5, Math.max(0.5, cw / 794)))
                }
              }}>
                Fit to width
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            onClick={() => setZoom(zoom + 0.25)}
            disabled={zoom >= 1.5}
            title="Zoom in (Cmd+=)"
            className={cn(
              "p-1 rounded transition-colors",
              zoom < 1.5
                ? "text-muted-foreground hover:text-foreground hover:bg-accent"
                : "text-muted-foreground/30 cursor-not-allowed"
            )}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        <span className="w-px h-4 bg-border shrink-0" />

        {/* Shortcuts */}
        {onShowShortcuts && (
          <button
            onClick={onShowShortcuts}
            title="Keyboard shortcuts (?)"
            className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Keyboard className="h-4 w-4" />
          </button>
        )}

        {/* Export dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              Export
              <ChevronDown className="h-3 w-3 ml-0.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onExportPDF} disabled={isExporting}>
              Export PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExportEPUB} disabled={isExporting}>
              Export EPUB
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
