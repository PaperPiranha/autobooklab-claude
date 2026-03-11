"use client"

import React, { createContext, useContext, useReducer } from "react"
import type { EditorPage, PageElement, ElementType } from "@/lib/editor/types"

// ─── State ───────────────────────────────────────────────────────────────────

interface EditorState {
  pages: EditorPage[]
  bookId: string
  activePageId: string
  selectedElementId: string | null
  saveStatus: "saved" | "saving" | "unsaved"
  past: EditorPage[][]
  future: EditorPage[][]
}

// ─── Actions ─────────────────────────────────────────────────────────────────

type EditorAction =
  | { type: "SET_ACTIVE_PAGE"; pageId: string }
  | { type: "SET_SELECTED_ELEMENT"; elementId: string | null }
  | { type: "SET_SAVE_STATUS"; status: "saved" | "saving" | "unsaved" }
  | { type: "ADD_PAGE" }
  | { type: "DELETE_PAGE"; pageId: string }
  | { type: "RENAME_PAGE"; pageId: string; name: string }
  | { type: "MOVE_PAGE"; fromIndex: number; toIndex: number }
  | { type: "ADD_ELEMENT"; element: PageElement }
  | { type: "UPDATE_ELEMENT"; elementId: string; updates: Partial<PageElement> }
  | { type: "DELETE_ELEMENT"; elementId: string }
  | { type: "SET_PAGE_BG"; pageId: string; backgroundColor: string }
  | { type: "CLEAR_PAGE_ELEMENTS" }
  | { type: "REPLACE_PAGES"; pages: EditorPage[] }
  | { type: "UNDO" }
  | { type: "REDO" }

// ─── Default element factory ─────────────────────────────────────────────────

export function makeDefaultElement(type: ElementType, variant?: string): PageElement {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  void now

  const base = {
    id,
    type,
    zIndex: 1,
    locked: false,
  }

  switch (type) {
    case "text":
      return {
        ...base,
        x: 97, y: 200, w: 600, h: 100,
        content: { text: "Click to edit text" },
        styles: { fontSize: 16, color: "#1a1a1a", textAlign: "left", lineHeight: 1.6 },
      }
    case "heading":
      return {
        ...base,
        x: 72, y: 120, w: 650, h: 90,
        content: { text: "Heading" },
        styles: { fontSize: 36, fontWeight: 700, color: "#1a1a1a", textAlign: "left" },
      }
    case "chapter-heading":
      return {
        ...base,
        x: 72, y: 100, w: 650, h: 160,
        content: { text: "Chapter Title" },
        styles: { fontSize: 48, fontWeight: 700, color: "#1a1a1a", textAlign: "left" },
      }
    case "image":
      return {
        ...base,
        x: 197, y: 200, w: 400, h: 300,
        content: { src: "", alt: "Image" },
        styles: { objectFit: "cover", borderRadius: 4 },
      }
    case "captioned-image":
      return {
        ...base,
        x: 172, y: 200, w: 450, h: 360,
        content: { src: "", alt: "Image", caption: "Image caption" },
        styles: { objectFit: "cover", borderRadius: 4, fontSize: 13, color: "#666666" },
      }
    case "divider":
      return {
        ...base,
        x: 72, y: 500, w: 650, h: 3,
        content: {},
        styles: { backgroundColor: "#e0e0e0" },
      }
    case "callout":
      return {
        ...base,
        x: 97, y: 300, w: 600, h: 110,
        content: { text: "Key insight or important callout" },
        styles: {
          fontSize: 16,
          color: "#1a1a1a",
          backgroundColor: "#fff7ed",
          padding: 20,
          borderRadius: 8,
          borderColor: "#F97316",
          borderWidth: 4,
          textAlign: "left",
        },
      }
    case "page-number":
      return {
        ...base,
        x: 357, y: 1070, w: 80, h: 36,
        content: { text: "—" },
        styles: { fontSize: 13, color: "#888888", textAlign: "center" },
      }
    case "table":
      return {
        ...base,
        x: 97, y: 200, w: 600, h: 200,
        content: {
          rows: [
            ["Header 1", "Header 2", "Header 3"],
            ["Cell", "Cell", "Cell"],
            ["Cell", "Cell", "Cell"],
          ],
          cols: 3,
        },
        styles: { fontSize: 14, color: "#1a1a1a", backgroundColor: "#ffffff", borderColor: "#e0e0e0", borderWidth: 1 },
      }
    case "toc":
      return {
        ...base,
        x: 72, y: 100, w: 650, h: 400,
        content: { text: "Table of Contents" },
        styles: { fontSize: 16, color: "#1a1a1a", lineHeight: 2 },
      }
    case "shape": {
      const shapeType = (variant as "rect" | "circle" | "line") || "rect"
      if (shapeType === "line") {
        return {
          ...base,
          x: 97, y: 300, w: 600, h: 4,
          content: { shapeType: "line" },
          styles: { backgroundColor: "#1a1a1a", strokeColor: "#1a1a1a", strokeWidth: 4, opacity: 100 },
        }
      }
      return {
        ...base,
        x: 200, y: 300, w: 200, h: 200,
        content: { shapeType },
        styles: { backgroundColor: "#F97316", borderRadius: shapeType === "rect" ? 8 : 0, opacity: 100, strokeColor: "transparent", strokeWidth: 0 },
      }
    }
    case "blockquote":
      return {
        ...base,
        x: 97, y: 200, w: 600, h: 160,
        content: { text: "Great things are done by a series of small things brought together.", attribution: "" },
        styles: { fontSize: 22, color: "#1a1a1a", italic: true, textAlign: "left", borderColor: "#F97316", borderWidth: 4, padding: 20, lineHeight: 1.5 },
      }
    case "ordered-list":
      return {
        ...base,
        x: 97, y: 200, w: 400, h: 200,
        content: { items: ["First item", "Second item", "Third item"] },
        styles: { fontSize: 16, color: "#1a1a1a", lineHeight: 1.7 },
      }
    case "unordered-list":
      return {
        ...base,
        x: 97, y: 200, w: 400, h: 200,
        content: { items: ["First item", "Second item", "Third item"] },
        styles: { fontSize: 16, color: "#1a1a1a", lineHeight: 1.7 },
      }
    case "cta-button":
      return {
        ...base,
        x: 277, y: 500, w: 240, h: 60,
        content: { text: "Get Started Now", url: "" },
        styles: { fontSize: 16, fontWeight: 700, color: "#ffffff", backgroundColor: "#F97316", borderRadius: 8, textAlign: "center" },
      }
    case "video-embed":
      return {
        ...base,
        x: 117, y: 200, w: 560, h: 315,
        content: { url: "", videoId: "", platform: "youtube" },
        styles: { borderRadius: 8 },
      }
    case "author-bio":
      return {
        ...base,
        x: 72, y: 400, w: 650, h: 120,
        content: { name: "Author Name", bio: "Short author bio goes here.", src: "" },
        styles: { fontSize: 14, color: "#1a1a1a", backgroundColor: "#f9f9f9", padding: 16, borderRadius: 8 },
      }
    case "icon-element":
      return {
        ...base,
        x: 357, y: 300, w: 80, h: 80,
        content: { iconName: "Star", color: "#F97316" },
        styles: { opacity: 100 },
      }
    default:
      return {
        ...base,
        x: 97, y: 200, w: 600, h: 100,
        content: { text: "Element" },
        styles: { fontSize: 16, color: "#1a1a1a" },
      }
  }
}

function makeBlankPage(bookId: string, orderIndex: number): EditorPage {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    bookId,
    orderIndex,
    name: `Page ${orderIndex + 1}`,
    backgroundColor: "#ffffff",
    elements: [],
    createdAt: now,
    updatedAt: now,
  }
}

// ─── Helper: push to past ────────────────────────────────────────────────────

function withHistory(state: EditorState, newPages: EditorPage[]): Partial<EditorState> {
  return {
    pages: newPages,
    past: [...state.past.slice(-29), state.pages],
    future: [],
  }
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "SET_ACTIVE_PAGE":
      return { ...state, activePageId: action.pageId, selectedElementId: null }

    case "SET_SELECTED_ELEMENT":
      return { ...state, selectedElementId: action.elementId }

    case "SET_SAVE_STATUS":
      return { ...state, saveStatus: action.status }

    case "ADD_PAGE": {
      const newPage = makeBlankPage(state.bookId, state.pages.length)
      return {
        ...state,
        ...withHistory(state, [...state.pages, newPage]),
        activePageId: newPage.id,
        selectedElementId: null,
      }
    }

    case "DELETE_PAGE": {
      if (state.pages.length <= 1) return state
      const newPages = state.pages
        .filter((p) => p.id !== action.pageId)
        .map((p, i) => ({ ...p, orderIndex: i }))
      const newActiveId =
        state.activePageId === action.pageId ? newPages[0].id : state.activePageId
      return {
        ...state,
        ...withHistory(state, newPages),
        activePageId: newActiveId,
        selectedElementId: state.activePageId === action.pageId ? null : state.selectedElementId,
      }
    }

    case "RENAME_PAGE": {
      const newPages = state.pages.map((p) =>
        p.id === action.pageId ? { ...p, name: action.name } : p
      )
      return {
        ...state,
        ...withHistory(state, newPages),
      }
    }

    case "MOVE_PAGE": {
      const { fromIndex, toIndex } = action
      if (fromIndex === toIndex) return state
      const pages = [...state.pages]
      const [moved] = pages.splice(fromIndex, 1)
      pages.splice(toIndex, 0, moved)
      return {
        ...state,
        ...withHistory(state, pages.map((p, i) => ({ ...p, orderIndex: i }))),
      }
    }

    case "ADD_ELEMENT": {
      const maxZ = state.pages
        .find((p) => p.id === state.activePageId)
        ?.elements.reduce((max, el) => Math.max(max, el.zIndex), 0) ?? 0
      const elementWithZ = { ...action.element, zIndex: maxZ + 1 }
      const newPages = state.pages.map((p) =>
        p.id === state.activePageId
          ? { ...p, elements: [...p.elements, elementWithZ] }
          : p
      )
      return {
        ...state,
        ...withHistory(state, newPages),
        selectedElementId: action.element.id,
      }
    }

    case "UPDATE_ELEMENT": {
      const newPages = state.pages.map((p) =>
        p.id === state.activePageId
          ? {
              ...p,
              elements: p.elements.map((el) =>
                el.id === action.elementId ? { ...el, ...action.updates } : el
              ),
            }
          : p
      )
      return {
        ...state,
        ...withHistory(state, newPages),
      }
    }

    case "DELETE_ELEMENT": {
      const newPages = state.pages.map((p) =>
        p.id === state.activePageId
          ? { ...p, elements: p.elements.filter((el) => el.id !== action.elementId) }
          : p
      )
      return {
        ...state,
        ...withHistory(state, newPages),
        selectedElementId:
          state.selectedElementId === action.elementId ? null : state.selectedElementId,
      }
    }

    case "SET_PAGE_BG": {
      const newPages = state.pages.map((p) =>
        p.id === action.pageId ? { ...p, backgroundColor: action.backgroundColor } : p
      )
      return {
        ...state,
        ...withHistory(state, newPages),
      }
    }

    case "CLEAR_PAGE_ELEMENTS": {
      const newPages = state.pages.map((p) =>
        p.id === state.activePageId ? { ...p, elements: [] } : p
      )
      return {
        ...state,
        ...withHistory(state, newPages),
        selectedElementId: null,
      }
    }

    case "REPLACE_PAGES": {
      return {
        ...state,
        ...withHistory(state, action.pages),
        activePageId: action.pages[0]?.id ?? state.activePageId,
        selectedElementId: null,
      }
    }

    case "UNDO": {
      if (state.past.length === 0) return state
      const previous = state.past[state.past.length - 1]
      return {
        ...state,
        pages: previous,
        past: state.past.slice(0, -1),
        future: [state.pages, ...state.future.slice(0, 29)],
        selectedElementId: null,
      }
    }

    case "REDO": {
      if (state.future.length === 0) return state
      const next = state.future[0]
      return {
        ...state,
        pages: next,
        past: [...state.past.slice(-29), state.pages],
        future: state.future.slice(1),
        selectedElementId: null,
      }
    }

    default:
      return state
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface EditorContextValue {
  state: EditorState
  dispatch: React.Dispatch<EditorAction>
}

const EditorContext = createContext<EditorContextValue | null>(null)

export function EditorProvider({
  children,
  bookId,
  initialPages,
}: {
  children: React.ReactNode
  bookId: string
  initialPages: EditorPage[]
}) {
  const startPages =
    initialPages.length > 0 ? initialPages : [makeBlankPage(bookId, 0)]

  const [state, dispatch] = useReducer(editorReducer, {
    pages: startPages,
    bookId,
    activePageId: startPages[0].id,
    selectedElementId: null,
    saveStatus: "saved",
    past: [],
    future: [],
  })

  return (
    <EditorContext.Provider value={{ state, dispatch }}>
      {children}
    </EditorContext.Provider>
  )
}

export function useEditor(): EditorContextValue {
  const ctx = useContext(EditorContext)
  if (!ctx) throw new Error("useEditor must be used within EditorProvider")
  return ctx
}
