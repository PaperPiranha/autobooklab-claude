"use client"

import { useEffect, useRef, useState } from "react"
import { EditorProvider, useEditor, makeDefaultElement } from "./editor-context"
import { EditorToolbar } from "./editor-toolbar"
import { ElementsPanel } from "./elements-panel"
import { CanvasArea } from "./canvas-area"
import { NavigatorPanel } from "./navigator-panel"
import { EditorAIPanel } from "./editor-ai-panel"
import { savePages } from "@/app/actions/pages"
import type { EditorPage, ElementType } from "@/lib/editor/types"

interface BookInfo {
  id: string
  title: string
  genre: string
  description: string
}

interface EditorShellProps {
  book: BookInfo
  initialPages: EditorPage[]
}

function AutoSaveWatcher({ bookId }: { bookId: string }) {
  const { state, dispatch } = useEditor()
  const prevPagesRef = useRef<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRender = useRef(true)
  // Keep a ref to latest pages for unmount flush
  const pagesRef = useRef(state.pages)
  pagesRef.current = state.pages

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      prevPagesRef.current = JSON.stringify(state.pages)
      return
    }

    const serialized = JSON.stringify(state.pages)
    if (serialized === prevPagesRef.current) return
    prevPagesRef.current = serialized

    dispatch({ type: "SET_SAVE_STATUS", status: "unsaved" })

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(async () => {
      dispatch({ type: "SET_SAVE_STATUS", status: "saving" })
      try {
        await savePages(bookId, state.pages)
        dispatch({ type: "SET_SAVE_STATUS", status: "saved" })
      } catch (err) {
        console.error("Auto-save failed:", err)
        dispatch({ type: "SET_SAVE_STATUS", status: "unsaved" })
      }
    }, 1500)
  }, [state.pages, bookId, dispatch])

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        savePages(bookId, pagesRef.current).catch(console.error)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}

function EditorLayout({ book }: { book: BookInfo }) {
  const { dispatch } = useEditor()
  const [aiOpen, setAiOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  function handleAddElement(type: ElementType) {
    dispatch({ type: "ADD_ELEMENT", element: makeDefaultElement(type) })
  }

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey
      if (!mod) return
      if (e.key === "z" && !e.shiftKey) {
        e.preventDefault()
        dispatch({ type: "UNDO" })
      }
      if (e.key === "z" && e.shiftKey) {
        e.preventDefault()
        dispatch({ type: "REDO" })
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [dispatch])

  async function handleExportPDF() {
    setIsExporting(true)
    try {
      const res = await fetch("/api/export/visual-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: book.id }),
      })
      const data = await res.json()
      if (data.url) window.open(data.url, "_blank")
    } finally {
      setIsExporting(false)
    }
  }

  async function handleExportEPUB() {
    setIsExporting(true)
    try {
      const res = await fetch("/api/export/visual-epub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: book.id }),
      })
      const data = await res.json()
      if (data.url) window.open(data.url, "_blank")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <EditorToolbar
        book={book}
        onExportPDF={handleExportPDF}
        onExportEPUB={handleExportEPUB}
        isExporting={isExporting}
        onToggleAI={() => setAiOpen((o) => !o)}
        aiOpen={aiOpen}
      />
      <div className="flex flex-1 min-h-0">
        <ElementsPanel onAddElement={handleAddElement} />
        <CanvasArea bookId={book.id} />
        {aiOpen && (
          <EditorAIPanel
            book={book}
            onClose={() => setAiOpen(false)}
          />
        )}
        <NavigatorPanel />
      </div>
    </div>
  )
}

export function EditorShell({ book, initialPages }: EditorShellProps) {
  return (
    <EditorProvider bookId={book.id} initialPages={initialPages}>
      <AutoSaveWatcher bookId={book.id} />
      <EditorLayout book={book} />
    </EditorProvider>
  )
}
