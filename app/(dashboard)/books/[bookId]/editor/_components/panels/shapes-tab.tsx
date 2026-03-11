"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useEditor, makeDefaultElement } from "../editor-context"
import * as LucideIcons from "lucide-react"

const ICON_NAMES = [
  "Lightbulb", "Star", "CheckCircle", "AlertCircle", "ArrowRight", "ArrowLeft",
  "Quote", "BookOpen", "Target", "Zap", "Heart", "ThumbsUp", "Award",
  "TrendingUp", "BarChart2", "PieChart", "Users", "User", "Shield",
  "Lock", "Globe", "Mail", "Phone", "MessageSquare", "Bell", "Calendar",
  "Clock", "Map", "Camera", "Video", "Music", "Headphones", "Mic",
  "Download", "Upload", "Share2", "Link", "Search", "Filter", "Settings",
  "Eye", "EyeOff", "Check", "X", "Plus", "Minus", "ChevronRight",
  "ChevronLeft", "Info", "HelpCircle", "FileText", "Folder", "Tag",
  "Bookmark", "Flag", "Hash", "List", "Grid", "Columns", "Layout",
  "Layers", "Package", "Box", "Coffee", "Sun", "Moon", "Cloud",
  "Flame", "Leaf", "Tree", "Feather", "Anchor", "Compass", "Telescope",
  "Rocket", "Sparkles", "Trophy", "Crown", "Diamond", "CircleDot",
  "MousePointerClick", "Cursor", "Hand", "Edit", "Pen", "Scissors",
]

export function ShapesTab() {
  const { dispatch } = useEditor()
  const [iconSearch, setIconSearch] = useState("")

  const filtered = iconSearch
    ? ICON_NAMES.filter((n) => n.toLowerCase().includes(iconSearch.toLowerCase()))
    : ICON_NAMES

  function addIcon(iconName: string) {
    const el = makeDefaultElement("icon-element")
    dispatch({
      type: "ADD_ELEMENT",
      element: { ...el, content: { ...el.content, iconName } },
    })
  }

  function addShape(shapeType: "rect" | "circle" | "line") {
    dispatch({ type: "ADD_ELEMENT", element: makeDefaultElement("shape", shapeType) })
  }

  return (
    <div className="p-3 space-y-4 overflow-y-auto flex-1">
      {/* Icons */}
      <div>
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Icons</p>
        <div className="relative mb-2">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            value={iconSearch}
            onChange={(e) => setIconSearch(e.target.value)}
            placeholder="Search icons…"
            className="h-7 text-xs pl-7"
          />
        </div>
        <div className="grid grid-cols-6 gap-1 max-h-[240px] overflow-y-auto">
          {filtered.map((name) => {
            const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[name]
            if (!Icon) return null
            return (
              <button
                key={name}
                onClick={() => addIcon(name)}
                title={name}
                className="flex items-center justify-center w-9 h-9 rounded border border-transparent hover:bg-muted/60 hover:border-border transition-colors"
              >
                <Icon size={16} className="text-muted-foreground" />
              </button>
            )
          })}
        </div>
      </div>

      {/* Shapes */}
      <div>
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Shapes</p>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => addShape("rect")}
            className="flex flex-col items-center gap-1.5 p-2 rounded-md border border-transparent bg-muted/30 hover:bg-muted/60 hover:border-primary/60 transition-colors"
          >
            <div style={{ width: 28, height: 28, borderRadius: 4, background: "#F97316" }} />
            <span className="text-[10px] text-muted-foreground">Rectangle</span>
          </button>
          <button
            onClick={() => addShape("circle")}
            className="flex flex-col items-center gap-1.5 p-2 rounded-md border border-transparent bg-muted/30 hover:bg-muted/60 hover:border-primary/60 transition-colors"
          >
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#F97316" }} />
            <span className="text-[10px] text-muted-foreground">Circle</span>
          </button>
          <button
            onClick={() => addShape("line")}
            className="flex flex-col items-center gap-1.5 p-2 rounded-md border border-transparent bg-muted/30 hover:bg-muted/60 hover:border-primary/60 transition-colors"
          >
            <div style={{ width: 28, height: 3, background: "#F97316" }} />
            <span className="text-[10px] text-muted-foreground">Line</span>
          </button>
        </div>
      </div>
    </div>
  )
}
