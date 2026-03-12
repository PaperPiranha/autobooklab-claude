"use client"

import { X } from "lucide-react"

interface ShortcutsDialogProps {
  open: boolean
  onClose: () => void
}

const SHORTCUTS = [
  { section: "General", items: [
    { keys: "?", label: "Show keyboard shortcuts" },
    { keys: "Escape", label: "Deselect element" },
    { keys: "Cmd+Z", label: "Undo" },
    { keys: "Cmd+Shift+Z", label: "Redo" },
  ]},
  { section: "Elements", items: [
    { keys: "Delete / Backspace", label: "Delete selected element" },
    { keys: "Arrow keys", label: "Nudge 1px" },
    { keys: "Shift+Arrow", label: "Nudge 10px" },
    { keys: "Cmd+D", label: "Duplicate element" },
    { keys: "Cmd+L", label: "Toggle lock" },
  ]},
  { section: "Layers", items: [
    { keys: "Cmd+]", label: "Bring forward" },
    { keys: "Cmd+[", label: "Send backward" },
  ]},
  { section: "Zoom", items: [
    { keys: "Cmd+=", label: "Zoom in" },
    { keys: "Cmd+-", label: "Zoom out" },
    { keys: "Cmd+0", label: "Reset zoom" },
  ]},
]

export function ShortcutsDialog({ open, onClose }: ShortcutsDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-background border border-border rounded-lg shadow-2xl w-[420px] max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold">Keyboard Shortcuts</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4 space-y-5">
          {SHORTCUTS.map((section) => (
            <div key={section.section}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {section.section}
              </p>
              <div className="space-y-1.5">
                {section.items.map((item) => (
                  <div key={item.keys} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{item.label}</span>
                    <kbd className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border font-mono">
                      {item.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
