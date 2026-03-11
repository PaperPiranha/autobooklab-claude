"use client"

import {
  Type, Heading, BookOpen, Hash, Minus, Quote, Image as ImageIcon, Square, Circle,
  Table2, List, LayoutTemplate, ListOrdered, MousePointerClick, Video, User,
  AlignLeft, FileInput,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useEditor, makeDefaultElement } from "../editor-context"
import type { ElementType } from "@/lib/editor/types"

function ElementCard({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-1.5 p-2 rounded-md border border-transparent",
        "bg-muted/30 hover:bg-muted/60 hover:border-primary/60",
        "transition-colors cursor-pointer text-center w-full"
      )}
    >
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-[10px] text-muted-foreground leading-tight">{label}</span>
    </button>
  )
}

interface ElementsTabProps {
  onAddElement: (type: ElementType, variant?: string) => void
}

export function ElementsTab({ onAddElement }: ElementsTabProps) {
  const { state, dispatch } = useEditor()

  function addShape(shapeType: "rect" | "circle" | "line") {
    const element = makeDefaultElement("shape", shapeType)
    dispatch({ type: "ADD_ELEMENT", element })
  }

  function addPage() {
    dispatch({ type: "ADD_PAGE" })
  }

  return (
    <div className="p-3 space-y-4 overflow-y-auto flex-1">
      {/* Page */}
      <div>
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Page</p>
        <div className="grid grid-cols-2 gap-2">
          <ElementCard icon={<FileInput className="h-4 w-4" />} label="New Page" onClick={addPage} />
        </div>
      </div>

      {/* Text */}
      <div>
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Text</p>
        <div className="grid grid-cols-2 gap-2">
          <ElementCard icon={<Type className="h-4 w-4" />} label="Text Block" onClick={() => onAddElement("text")} />
          <ElementCard icon={<Heading className="h-4 w-4" />} label="Heading" onClick={() => onAddElement("heading")} />
          <ElementCard icon={<BookOpen className="h-4 w-4" />} label="Chapter Heading" onClick={() => onAddElement("chapter-heading")} />
          <ElementCard icon={<Hash className="h-4 w-4" />} label="Page Number" onClick={() => onAddElement("page-number")} />
        </div>
      </div>

      {/* Rich Text */}
      <div>
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Rich Text</p>
        <div className="grid grid-cols-2 gap-2">
          <ElementCard icon={<Quote className="h-4 w-4" />} label="Blockquote" onClick={() => onAddElement("blockquote")} />
          <ElementCard icon={<ListOrdered className="h-4 w-4" />} label="Ordered List" onClick={() => onAddElement("ordered-list")} />
          <ElementCard icon={<List className="h-4 w-4" />} label="Unordered List" onClick={() => onAddElement("unordered-list")} />
          <ElementCard icon={<MousePointerClick className="h-4 w-4" />} label="CTA Button" onClick={() => onAddElement("cta-button")} />
        </div>
      </div>

      {/* Media */}
      <div>
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Media</p>
        <div className="grid grid-cols-2 gap-2">
          <ElementCard icon={<ImageIcon className="h-4 w-4" />} label="Image" onClick={() => onAddElement("image")} />
          <ElementCard
            icon={<span className="flex flex-col items-center gap-0.5"><ImageIcon className="h-3.5 w-3.5" /><span className="text-[7px] leading-none">caption</span></span>}
            label="Captioned Image"
            onClick={() => onAddElement("captioned-image")}
          />
          <ElementCard icon={<Video className="h-4 w-4" />} label="Video Embed" onClick={() => onAddElement("video-embed")} />
        </div>
      </div>

      {/* Layout */}
      <div>
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Layout</p>
        <div className="grid grid-cols-2 gap-2">
          <ElementCard icon={<Minus className="h-4 w-4" />} label="Divider" onClick={() => onAddElement("divider")} />
          <ElementCard icon={<AlignLeft className="h-4 w-4" />} label="Callout Box" onClick={() => onAddElement("callout")} />
          <ElementCard icon={<User className="h-4 w-4" />} label="Author Bio" onClick={() => onAddElement("author-bio")} />
        </div>
      </div>

      {/* Data */}
      <div>
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Data</p>
        <div className="grid grid-cols-2 gap-2">
          <ElementCard icon={<Table2 className="h-4 w-4" />} label="Table" onClick={() => onAddElement("table")} />
          <ElementCard icon={<List className="h-4 w-4" />} label="Table of Contents" onClick={() => onAddElement("toc")} />
        </div>
      </div>

      {/* Shapes */}
      <div>
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Shapes</p>
        <div className="grid grid-cols-2 gap-2">
          <ElementCard icon={<Square className="h-4 w-4" />} label="Rectangle" onClick={() => addShape("rect")} />
          <ElementCard icon={<Circle className="h-4 w-4" />} label="Circle" onClick={() => addShape("circle")} />
          <ElementCard icon={<Minus className="h-4 w-4" />} label="Line" onClick={() => addShape("line")} />
        </div>
      </div>
    </div>
  )
}
