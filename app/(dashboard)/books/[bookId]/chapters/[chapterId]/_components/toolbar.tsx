"use client"

import { useState } from "react"
import type { Editor } from "@tiptap/react"
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Link as LinkIcon,
  Image as ImageIcon,
  LayoutTemplate,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { templates } from "@/lib/templates"

interface ToolbarProps {
  editor: Editor | null
}

export function Toolbar({ editor }: ToolbarProps) {
  const [showImageDialog, setShowImageDialog] = useState(false)
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const [linkUrl, setLinkUrl] = useState("")

  if (!editor) return null

  function insertImage() {
    if (!imageUrl.trim()) return
    editor?.chain().focus().setImage({ src: imageUrl.trim() }).run()
    setImageUrl("")
    setShowImageDialog(false)
  }

  function insertLink() {
    if (!linkUrl.trim()) return
    editor?.chain().focus().extendMarkRange("link").setLink({ href: linkUrl.trim() }).run()
    setLinkUrl("")
    setShowLinkDialog(false)
  }

  function applyTemplate(html: string) {
    if (!editor) return
    const isEmpty =
      editor.isEmpty ||
      editor.state.doc.textContent.trim() === ""
    if (!isEmpty) {
      if (!confirm("Replace current content with this template?")) return
    }
    editor.chain().focus().setContent(html).run()
    setShowTemplates(false)
  }

  const btn = (active: boolean) =>
    cn(
      "h-7 w-7 flex items-center justify-center rounded text-xs transition-colors",
      active
        ? "bg-primary/20 text-primary"
        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
    )

  const divider = <div className="h-4 w-px bg-border mx-0.5" />

  return (
    <>
      {/* Toolbar bar */}
      <div className="flex items-center gap-0.5 flex-wrap border-b border-border/50 bg-background/50 px-4 py-1.5 shrink-0 backdrop-blur-sm sticky top-0 z-10">
        {/* Text style */}
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={btn(editor.isActive("bold"))}
          title="Bold (⌘B)"
        >
          <Bold className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={btn(editor.isActive("italic"))}
          title="Italic (⌘I)"
        >
          <Italic className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={btn(editor.isActive("underline"))}
          title="Underline (⌘U)"
        >
          <Underline className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={btn(editor.isActive("strike"))}
          title="Strikethrough"
        >
          <Strikethrough className="h-3.5 w-3.5" />
        </button>

        {divider}

        {/* Headings */}
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={btn(editor.isActive("heading", { level: 1 }))}
          title="Heading 1"
        >
          <Heading1 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={btn(editor.isActive("heading", { level: 2 }))}
          title="Heading 2"
        >
          <Heading2 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={btn(editor.isActive("heading", { level: 3 }))}
          title="Heading 3"
        >
          <Heading3 className="h-3.5 w-3.5" />
        </button>

        {divider}

        {/* Lists */}
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={btn(editor.isActive("bulletList"))}
          title="Bullet list"
        >
          <List className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={btn(editor.isActive("orderedList"))}
          title="Ordered list"
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </button>

        {divider}

        {/* Block elements */}
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={btn(editor.isActive("blockquote"))}
          title="Blockquote"
        >
          <Quote className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className={btn(false)}
          title="Horizontal rule"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>

        {divider}

        {/* Link */}
        <button
          onClick={() => {
            if (editor.isActive("link")) {
              editor.chain().focus().unsetLink().run()
            } else {
              setLinkUrl(editor.getAttributes("link").href ?? "")
              setShowLinkDialog(true)
            }
          }}
          className={btn(editor.isActive("link"))}
          title="Insert link"
        >
          <LinkIcon className="h-3.5 w-3.5" />
        </button>

        {/* Image */}
        <button
          onClick={() => setShowImageDialog(true)}
          className={btn(false)}
          title="Insert image"
        >
          <ImageIcon className="h-3.5 w-3.5" />
        </button>

        {divider}

        {/* Templates */}
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          className={cn(
            btn(showTemplates),
            "gap-1 w-auto px-2 text-[11px] font-medium"
          )}
          title="Chapter templates"
        >
          <LayoutTemplate className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Templates</span>
        </button>
      </div>

      {/* Template picker panel */}
      {showTemplates && (
        <div className="border-b border-border bg-card/80 backdrop-blur-sm px-4 py-3 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">
              Choose a starting structure
            </span>
            <button
              onClick={() => setShowTemplates(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => applyTemplate(t.html)}
                className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 hover:border-primary/40 hover:bg-accent/50 px-3 py-2 text-left transition-colors"
              >
                <span className="text-base leading-none">{t.icon}</span>
                <div>
                  <div className="text-xs font-medium">{t.name}</div>
                  <div className="text-[10px] text-muted-foreground">{t.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Image dialog */}
      {showImageDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
            <h3 className="text-base font-semibold mb-4">Insert image</h3>
            <div className="space-y-3">
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/…"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && insertImage()}
              />
              <p className="text-xs text-muted-foreground">
                Paste any image URL, or use the AI panel&apos;s Images tab to search Unsplash.
              </p>
            </div>
            <div className="flex gap-2 mt-5">
              <Button onClick={insertImage} disabled={!imageUrl.trim()} size="sm">
                Insert
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowImageDialog(false)
                  setImageUrl("")
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Link dialog */}
      {showLinkDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
            <h3 className="text-base font-semibold mb-4">Insert link</h3>
            <Input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && insertLink()}
            />
            <div className="flex gap-2 mt-5">
              <Button onClick={insertLink} disabled={!linkUrl.trim()} size="sm">
                Apply
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowLinkDialog(false)
                  setLinkUrl("")
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
