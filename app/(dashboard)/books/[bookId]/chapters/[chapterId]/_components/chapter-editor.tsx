"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import Placeholder from "@tiptap/extension-placeholder"
import CharacterCount from "@tiptap/extension-character-count"
import Typography from "@tiptap/extension-typography"
import Link from "@tiptap/extension-link"
import Underline from "@tiptap/extension-underline"
import { Check, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { updateChapterContent } from "@/app/actions/books"
import { Toolbar } from "./toolbar"
import { AiPanel } from "./ai-panel"
import type { Chapter } from "@/lib/types"

type SaveStatus = "saved" | "saving" | "unsaved"

interface Book {
  id: string
  title: string
  genre: string
  description: string
}

/** Plain text from previous textarea editor → HTML paragraphs */
function normalizeContent(raw: string): string {
  if (!raw) return "<p></p>"
  if (raw.trimStart().startsWith("<")) return raw
  return raw
    .split(/\n\n+/)
    .map((para) => `<p>${para.replace(/\n/g, "<br>")}</p>`)
    .join("")
}

export function ChapterEditor({
  chapter,
  book,
  initialCredits,
}: {
  chapter: Chapter
  book: Book
  initialCredits: number
}) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved")
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [credits, setCredits] = useState(initialCredits)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestContentRef = useRef(chapter.content)

  const save = useCallback(
    async (html: string, wordCount: number) => {
      setSaveStatus("saving")
      // Store word count alongside content
      await updateChapterContent(chapter.id, html, wordCount)
      setSaveStatus("saved")
    },
    [chapter.id]
  )

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ HTMLAttributes: { class: "rounded-md" } }),
      Placeholder.configure({ placeholder: "Start writing… or use AI to generate a draft →" }),
      CharacterCount,
      Typography,
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener noreferrer" } }),
      Underline,
    ],
    content: normalizeContent(chapter.content),
    editorProps: {
      attributes: { class: "focus:outline-none" },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML()
      const wc = ed.storage.characterCount.words() as number
      latestContentRef.current = html
      setSaveStatus("unsaved")
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => save(html, wc), 1500)
    },
  })

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
        if (latestContentRef.current !== chapter.content) {
          const wc = editor?.storage?.characterCount?.words?.() ?? 0
          save(latestContentRef.current, wc)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const wordCount = (editor?.storage?.characterCount?.words?.() as number) ?? 0

  // Selected text for AI rewrite
  const selectedText = (() => {
    if (!editor) return ""
    const { from, to, empty } = editor.state.selection
    if (empty) return ""
    return editor.state.doc.textBetween(from, to, " ")
  })()

  function insertContent(content: string, replaceSelection = false) {
    if (!editor) return
    if (replaceSelection && !editor.state.selection.empty) {
      editor.chain().focus().deleteSelection().insertContent(content).run()
    } else {
      editor.chain().focus().insertContent(content).run()
    }
  }

  function insertImage(src: string, alt: string, credit: string) {
    if (!editor) return
    editor
      .chain()
      .focus()
      .setImage({ src, alt })
      .insertContent(`<p><em>Photo by ${credit}</em></p>`)
      .run()
  }

  return (
    <div className="flex flex-1 min-h-0">
      {/* Editor column */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Toolbar (sticky) */}
        <div className="shrink-0">
          {/* AI toggle + save status micro-bar */}
          <div className="flex items-center justify-between border-b border-border/30 bg-background px-6 py-1.5">
            <Button
              variant="ghost"
              size="sm"
              className={`gap-1.5 h-7 text-xs ${isPanelOpen ? "text-primary" : "text-muted-foreground"}`}
              onClick={() => setIsPanelOpen((o) => !o)}
            >
              <Sparkles className="h-3.5 w-3.5" />
              AI
            </Button>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {saveStatus === "saving" && (
                <><Loader2 className="h-3 w-3 animate-spin" />Saving…</>
              )}
              {saveStatus === "saved" && (
                <><Check className="h-3 w-3 text-primary" />Saved</>
              )}
              {saveStatus === "unsaved" && "Unsaved changes"}
            </span>
          </div>
          <Toolbar editor={editor} />
        </div>

        {/* Chapter title + content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-16 pt-10 pb-4">
            <h2
              className="text-3xl font-normal text-foreground"
              style={{ fontFamily: "var(--font-instrument-serif)" }}
            >
              {chapter.title}
            </h2>
          </div>
          <div className="px-16 pb-16">
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-16 py-3 text-xs text-muted-foreground shrink-0">
          <span>{wordCount.toLocaleString()} words</span>
          {selectedText && (
            <span className="text-primary/70">
              {selectedText.trim().split(/\s+/).length} words selected
            </span>
          )}
        </div>
      </div>

      {/* AI Panel */}
      {isPanelOpen && (
        <AiPanel
          book={book}
          chapter={{ ...chapter, content: latestContentRef.current }}
          selectedText={selectedText}
          onInsert={insertContent}
          onInsertImage={insertImage}
          onClose={() => setIsPanelOpen(false)}
          credits={credits}
          onCreditsChange={(delta) => setCredits((c) => c + delta)}
        />
      )}
    </div>
  )
}
