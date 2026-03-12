"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { EditorProvider, useEditor, makeDefaultElement } from "./editor-context"
import { EditorToolbar } from "./editor-toolbar"
import { LeftPanel } from "./left-panel"
import { CanvasArea } from "./canvas-area"
import { NavigatorPanel } from "./navigator-panel"
import { ShortcutsDialog } from "./shortcuts-dialog"
import { useEditorKeyboard } from "./hooks/use-editor-keyboard"
import { savePages } from "@/app/actions/pages"
import { updateBookCoverImage } from "@/app/actions/books"
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
  userId?: string
}

async function captureCoverThumbnail(bookId: string, pages: EditorPage[]) {
  const coverPage = pages.find((p) => p.isCover)
  if (!coverPage) return

  try {
    const { toBlob } = await import("html-to-image")
    const coverCanvas = document.querySelector(`[data-page-id="${coverPage.id}"]`) as HTMLElement | null
    if (!coverCanvas) return

    const blob = await toBlob(coverCanvas, {
      width: 400,
      height: Math.round(400 * (1123 / 794)),
      pixelRatio: 1,
      cacheBust: true,
    })
    if (!blob) return

    const form = new FormData()
    form.append("file", new File([blob], "cover-thumb.webp", { type: "image/webp" }))
    form.append("bookId", bookId)
    const res = await fetch("/api/images/upload", { method: "POST", body: form })
    const data = await res.json()
    if (res.ok && data.url) {
      await updateBookCoverImage(bookId, data.url)
    }
  } catch {
    // Non-critical — silently fail
  }
}

function AutoSaveWatcher({ bookId }: { bookId: string }) {
  const { state, dispatch } = useEditor()
  const prevPagesRef = useRef<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRender = useRef(true)
  const pagesRef = useRef(state.pages)
  const coverThumbTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
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

        // Debounced cover thumbnail capture (5s after save)
        if (coverThumbTimerRef.current) clearTimeout(coverThumbTimerRef.current)
        coverThumbTimerRef.current = setTimeout(() => {
          captureCoverThumbnail(bookId, pagesRef.current)
        }, 5000)
      } catch (err) {
        console.error("Auto-save failed:", err)
        dispatch({ type: "SET_SAVE_STATUS", status: "unsaved" })
      }
    }, 1500)
  }, [state.pages, bookId, dispatch])

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        savePages(bookId, pagesRef.current).catch(console.error)
      }
      if (coverThumbTimerRef.current) clearTimeout(coverThumbTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}

function EditorLayout({ book, userId }: { book: BookInfo; userId?: string }) {
  const { dispatch } = useEditor()
  const [isExporting, setIsExporting] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [leftPanelTab, setLeftPanelTab] = useState<string | null>(null)

  // Keyboard shortcuts hook (replaces old useEffect)
  useEditorKeyboard(() => setShowShortcuts(true))

  function handleAddElement(type: ElementType) {
    dispatch({ type: "ADD_ELEMENT", element: makeDefaultElement(type) })
  }

  const handleOpenTab = useCallback((tab: string) => {
    setLeftPanelTab(tab)
  }, [])

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
        onShowShortcuts={() => setShowShortcuts(true)}
      />
      <div className="flex flex-1 min-h-0">
        <LeftPanel
          onAddElement={handleAddElement}
          bookId={book.id}
          bookTitle={book.title}
          bookGenre={book.genre}
          bookDescription={book.description}
          userId={userId}
          activeTab={leftPanelTab}
          onTabChange={setLeftPanelTab}
        />
        <CanvasArea bookId={book.id} onOpenTab={handleOpenTab} />
        <NavigatorPanel />
      </div>
      <ShortcutsDialog open={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </div>
  )
}

export function EditorShell({ book, initialPages, userId }: EditorShellProps) {
  return (
    <EditorProvider bookId={book.id} initialPages={initialPages}>
      <AutoSaveWatcher bookId={book.id} />
      <EditorLayout book={book} userId={userId} />
    </EditorProvider>
  )
}
