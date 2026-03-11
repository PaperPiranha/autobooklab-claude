"use client"

import type { Editor } from "@tiptap/react"
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Eraser,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface FormatToolbarProps {
  editor: Editor | null
}

function ToolbarButton({
  onClick,
  isActive,
  title,
  children,
}: {
  onClick: () => void
  isActive?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault()
        onClick()
      }}
      title={title}
      className={cn(
        "flex items-center justify-center w-7 h-7 rounded text-white/80 hover:bg-white/10 transition-colors text-xs font-medium",
        isActive && "bg-white/20 text-white"
      )}
    >
      {children}
    </button>
  )
}

function Separator() {
  return <div className="w-px h-5 bg-white/20 mx-0.5 shrink-0" />
}

export function FormatToolbar({ editor }: FormatToolbarProps) {
  if (!editor) return null

  return (
    <div className="flex items-center gap-0.5 px-1.5 py-1 bg-zinc-900 border border-zinc-700 rounded shadow-xl">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        title="Bold"
      >
        <Bold className="h-3.5 w-3.5" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        title="Italic"
      >
        <Italic className="h-3.5 w-3.5" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive("underline")}
        title="Underline"
      >
        <Underline className="h-3.5 w-3.5" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive("strike")}
        title="Strikethrough"
      >
        <Strikethrough className="h-3.5 w-3.5" />
      </ToolbarButton>

      <Separator />

      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        isActive={editor.isActive({ textAlign: "left" })}
        title="Align left"
      >
        <AlignLeft className="h-3.5 w-3.5" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        isActive={editor.isActive({ textAlign: "center" })}
        title="Align center"
      >
        <AlignCenter className="h-3.5 w-3.5" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        isActive={editor.isActive({ textAlign: "right" })}
        title="Align right"
      >
        <AlignRight className="h-3.5 w-3.5" />
      </ToolbarButton>

      <Separator />

      {/* Text color */}
      <div className="relative flex items-center justify-center w-7 h-7" title="Text color">
        <label className="cursor-pointer flex items-center justify-center w-full h-full rounded hover:bg-white/10 transition-colors">
          <span className="text-xs font-bold text-white/80" style={{ fontFamily: "serif" }}>A</span>
          <div
            className="absolute bottom-1 left-1/2 -translate-x-1/2 w-3.5 h-0.5 rounded-sm"
            style={{ backgroundColor: editor.getAttributes("textStyle").color ?? "#ffffff" }}
          />
          <input
            type="color"
            className="absolute opacity-0 w-0 h-0"
            value={editor.getAttributes("textStyle").color ?? "#ffffff"}
            onMouseDown={(e) => e.stopPropagation()}
            onChange={(e) => {
              editor.chain().focus().setColor(e.target.value).run()
            }}
          />
        </label>
      </div>

      <Separator />

      <ToolbarButton
        onClick={() => editor.chain().focus().unsetAllMarks().run()}
        title="Clear formatting"
      >
        <Eraser className="h-3.5 w-3.5" />
      </ToolbarButton>
    </div>
  )
}
