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
} from "lucide-react"
import { useEditor } from "./editor-context"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface EditorToolbarProps {
  book: { id: string; title: string }
  onExportPDF: () => void
  onExportEPUB: () => void
  isExporting: boolean
}

export function EditorToolbar({
  book,
  onExportPDF,
  onExportEPUB,
  isExporting,
}: EditorToolbarProps) {
  const { state, dispatch } = useEditor()
  const { saveStatus } = state

  const canUndo = state.past.length > 0
  const canRedo = state.future.length > 0

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
      <div className="flex items-center gap-1.5 w-[220px] justify-end">
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

        <span className="text-xs text-muted-foreground border border-border rounded px-1.5 py-0.5">
          100%
        </span>
      </div>
    </header>
  )
}
