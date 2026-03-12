"use client"

import { Copy, Trash2, Lock, Unlock, ArrowUp, ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PageElement } from "@/lib/editor/types"

interface FloatingToolbarProps {
  element: PageElement
  onDuplicate: () => void
  onDelete: () => void
  onToggleLock: () => void
  onBringForward: () => void
  onSendBackward: () => void
}

const TYPE_LABELS: Record<string, string> = {
  text: "Text",
  heading: "Heading",
  "chapter-heading": "Chapter Heading",
  image: "Image",
  "captioned-image": "Captioned Image",
  divider: "Divider",
  callout: "Callout",
  "page-number": "Page Number",
  table: "Table",
  toc: "ToC",
  shape: "Shape",
  blockquote: "Blockquote",
  "ordered-list": "Ordered List",
  "unordered-list": "Unordered List",
  "cta-button": "CTA Button",
  "video-embed": "Video",
  "author-bio": "Author Bio",
  "icon-element": "Icon",
}

export function FloatingToolbar({
  element,
  onDuplicate,
  onDelete,
  onToggleLock,
  onBringForward,
  onSendBackward,
}: FloatingToolbarProps) {
  return (
    <div
      className="absolute flex items-center gap-0.5 bg-background border border-border rounded-md shadow-lg px-1 py-0.5 z-[1000]"
      style={{ top: -36, left: "50%", transform: "translateX(-50%)" }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <span className="text-[10px] text-muted-foreground px-1.5 select-none">
        {TYPE_LABELS[element.type] ?? element.type}
      </span>
      <span className="w-px h-4 bg-border" />
      <ToolbarButton icon={Copy} title="Duplicate (Cmd+D)" onClick={onDuplicate} />
      <ToolbarButton icon={ArrowUp} title="Bring Forward (Cmd+])" onClick={onBringForward} />
      <ToolbarButton icon={ArrowDown} title="Send Backward (Cmd+[)" onClick={onSendBackward} />
      <ToolbarButton
        icon={element.locked ? Lock : Unlock}
        title={element.locked ? "Unlock (Cmd+L)" : "Lock (Cmd+L)"}
        onClick={onToggleLock}
        active={element.locked}
      />
      <span className="w-px h-4 bg-border" />
      <ToolbarButton icon={Trash2} title="Delete" onClick={onDelete} destructive />
    </div>
  )
}

function ToolbarButton({
  icon: Icon,
  title,
  onClick,
  destructive,
  active,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  onClick: () => void
  destructive?: boolean
  active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "p-1 rounded transition-colors",
        destructive
          ? "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          : active
            ? "text-primary bg-primary/10"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  )
}
