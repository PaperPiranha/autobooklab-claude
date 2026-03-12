"use client"

import { useEditor, makeDefaultElement } from "../editor-context"

function PreviewBar({ top, left, width, height, color = "#e5e7eb" }: { top: string; left: string; width: string; height: string; color?: string }) {
  return <div className="absolute rounded-sm" style={{ top, left, width, height, backgroundColor: color }} />
}

function LayoutCard({ label, description, preview, onClick }: { label: string; description: string; preview: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-md border border-transparent p-2 bg-muted/30 hover:bg-muted/60 hover:border-primary/60 transition-colors cursor-pointer"
    >
      <div className="w-full aspect-[794/400] bg-white rounded mb-1.5 overflow-hidden relative border border-border/40">
        {preview}
      </div>
      <div className="text-[10px] font-medium text-foreground leading-tight">{label}</div>
      <div className="text-[9px] text-muted-foreground leading-tight mt-0.5">{description}</div>
    </button>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDispatch = (action: any) => void
type AnyState = { activePageId: string; [key: string]: unknown }

interface Layout {
  label: string
  description: string
  preview: React.ReactNode
  apply: (dispatch: AnyDispatch, state: AnyState) => void
}

export function LayoutsTab() {
  const { dispatch, state } = useEditor()

  function apply(fn: (dispatch: AnyDispatch, state: AnyState) => void) {
    fn(dispatch, state as unknown as AnyState)
  }

  const layouts: Layout[] = [
    {
      label: "Full-Bleed Image Cover",
      description: "Full-page image + overlaid title",
      preview: (
        <>
          <div className="absolute inset-0 bg-[#93c5fd]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <PreviewBar top="55%" left="10%" width="80%" height="10%" color="#ffffff" />
          <PreviewBar top="70%" left="20%" width="60%" height="5%" color="rgba(255,255,255,0.6)" />
        </>
      ),
      apply: (dispatch, state) => {
        dispatch({ type: "SET_PAGE_BG", pageId: state.activePageId, backgroundColor: "#000000" })
        dispatch({
          type: "ADD_ELEMENT",
          element: { ...makeDefaultElement("image"), x: 0, y: 0, w: 794, h: 1123, zIndex: 0, content: { src: "", alt: "Cover background" }, styles: { objectFit: "cover", borderRadius: 0 } },
        })
        dispatch({
          type: "ADD_ELEMENT",
          element: { ...makeDefaultElement("chapter-heading"), x: 72, y: 600, w: 650, h: 180, content: { text: "Book Title" }, styles: { fontSize: 56, fontWeight: 700, color: "#ffffff", textAlign: "center" } },
        })
        dispatch({
          type: "ADD_ELEMENT",
          element: { ...makeDefaultElement("text"), x: 122, y: 790, w: 550, h: 60, content: { text: "Subtitle or tagline" }, styles: { fontSize: 20, color: "rgba(255,255,255,0.8)", textAlign: "center" } },
        })
      },
    },
    {
      label: "Split Cover",
      description: "Image top, title on accent bg bottom",
      preview: (
        <>
          <PreviewBar top="0" left="0" width="100%" height="55%" color="#93c5fd" />
          <div className="absolute bottom-0 left-0 right-0 top-[55%] bg-[#F97316]" />
          <PreviewBar top="65%" left="15%" width="70%" height="10%" color="#ffffff" />
          <PreviewBar top="80%" left="25%" width="50%" height="5%" color="rgba(255,255,255,0.6)" />
        </>
      ),
      apply: (dispatch, state) => {
        dispatch({ type: "SET_PAGE_BG", pageId: state.activePageId, backgroundColor: "#F97316" })
        dispatch({
          type: "ADD_ELEMENT",
          element: { ...makeDefaultElement("image"), x: 0, y: 0, w: 794, h: 560, content: { src: "", alt: "Cover image" }, styles: { objectFit: "cover", borderRadius: 0 } },
        })
        dispatch({
          type: "ADD_ELEMENT",
          element: { ...makeDefaultElement("chapter-heading"), x: 72, y: 620, w: 650, h: 140, content: { text: "Book Title" }, styles: { fontSize: 52, fontWeight: 700, color: "#ffffff", textAlign: "center" } },
        })
        dispatch({
          type: "ADD_ELEMENT",
          element: { ...makeDefaultElement("text"), x: 122, y: 780, w: 550, h: 60, content: { text: "Subtitle or tagline" }, styles: { fontSize: 18, color: "rgba(255,255,255,0.7)", textAlign: "center" } },
        })
      },
    },
    {
      label: "Minimal Text Cover",
      description: "Solid colour, large centred title",
      preview: (
        <>
          <div className="absolute inset-0 bg-[#1a1a1a]" />
          <PreviewBar top="38%" left="15%" width="70%" height="14%" color="#ffffff" />
          <PreviewBar top="58%" left="30%" width="40%" height="4%" color="rgba(255,255,255,0.4)" />
        </>
      ),
      apply: (dispatch, state) => {
        dispatch({ type: "SET_PAGE_BG", pageId: state.activePageId, backgroundColor: "#1a1a1a" })
        dispatch({
          type: "ADD_ELEMENT",
          element: { ...makeDefaultElement("chapter-heading"), x: 72, y: 380, w: 650, h: 200, content: { text: "Book Title" }, styles: { fontSize: 64, fontWeight: 700, color: "#ffffff", textAlign: "center", lineHeight: 1.1 } },
        })
        dispatch({
          type: "ADD_ELEMENT",
          element: { ...makeDefaultElement("text"), x: 172, y: 600, w: 450, h: 60, content: { text: "Subtitle goes here" }, styles: { fontSize: 18, color: "rgba(255,255,255,0.5)", textAlign: "center" } },
        })
      },
    },
    {
      label: "Photo Band Cover",
      description: "Image strip across middle",
      preview: (
        <>
          <div className="absolute inset-0 bg-white" />
          <PreviewBar top="8%" left="15%" width="70%" height="8%" color="#374151" />
          <PreviewBar top="30%" left="0" width="100%" height="40%" color="#93c5fd" />
          <PreviewBar top="80%" left="25%" width="50%" height="5%" color="#9ca3af" />
        </>
      ),
      apply: (dispatch, state) => {
        dispatch({ type: "SET_PAGE_BG", pageId: state.activePageId, backgroundColor: "#ffffff" })
        dispatch({
          type: "ADD_ELEMENT",
          element: { ...makeDefaultElement("chapter-heading"), x: 72, y: 80, w: 650, h: 140, content: { text: "Book Title" }, styles: { fontSize: 48, fontWeight: 700, color: "#1a1a1a", textAlign: "center" } },
        })
        dispatch({
          type: "ADD_ELEMENT",
          element: { ...makeDefaultElement("image"), x: 0, y: 340, w: 794, h: 440, content: { src: "", alt: "Cover image band" }, styles: { objectFit: "cover", borderRadius: 0 } },
        })
        dispatch({
          type: "ADD_ELEMENT",
          element: { ...makeDefaultElement("text"), x: 172, y: 850, w: 450, h: 60, content: { text: "Author Name" }, styles: { fontSize: 18, color: "#666666", textAlign: "center" } },
        })
      },
    },
    {
      label: "Cover Page",
      description: "Dark bg, title & subtitle",
      preview: (
        <>
          <div className="absolute inset-0 bg-[#1a1a1a]" />
          <PreviewBar top="30%" left="15%" width="70%" height="12%" color="#ffffff" />
          <PreviewBar top="48%" left="20%" width="60%" height="6%" color="rgba(255,255,255,0.5)" />
          <PreviewBar top="62%" left="30%" width="40%" height="3%" color="#F97316" />
        </>
      ),
      apply: (dispatch, state) => {
        dispatch({ type: "SET_PAGE_BG", pageId: state.activePageId, backgroundColor: "#1a1a1a" })
        dispatch({
          type: "ADD_ELEMENT",
          element: { ...makeDefaultElement("chapter-heading"), x: 72, y: 200, content: { text: "Book Title" }, styles: { fontSize: 56, fontWeight: 700, color: "#ffffff", textAlign: "center" } },
        })
        dispatch({
          type: "ADD_ELEMENT",
          element: { ...makeDefaultElement("text"), x: 97, y: 380, content: { text: "Subtitle or tagline" }, styles: { fontSize: 20, color: "rgba(255,255,255,0.7)", textAlign: "center" } },
        })
        dispatch({
          type: "ADD_ELEMENT",
          element: { ...makeDefaultElement("divider"), x: 197, y: 460, w: 400, styles: { backgroundColor: "#F97316" } },
        })
      },
    },
    {
      label: "Chapter Opener",
      description: "Chapter number + title + intro",
      preview: (
        <>
          <PreviewBar top="15%" left="10%" width="80%" height="10%" color="#374151" />
          <PreviewBar top="32%" left="13%" width="74%" height="50%" color="#e5e7eb" />
        </>
      ),
      apply: (dispatch) => {
        dispatch({ type: "ADD_ELEMENT", element: { ...makeDefaultElement("chapter-heading"), x: 72, y: 150 } })
        dispatch({ type: "ADD_ELEMENT", element: { ...makeDefaultElement("text"), x: 97, y: 340, w: 600, h: 400 } })
      },
    },
    {
      label: "2 Equal Columns",
      description: "Two text blocks side by side",
      preview: (
        <>
          <PreviewBar top="10%" left="5%" width="42%" height="80%" color="#e5e7eb" />
          <PreviewBar top="10%" left="53%" width="42%" height="80%" color="#e5e7eb" />
        </>
      ),
      apply: (dispatch) => {
        dispatch({ type: "ADD_ELEMENT", element: { ...makeDefaultElement("text"), x: 40, y: 100, w: 340, h: 900 } })
        dispatch({ type: "ADD_ELEMENT", element: { ...makeDefaultElement("text"), x: 414, y: 100, w: 340, h: 900 } })
      },
    },
    {
      label: "3 Columns",
      description: "Three text blocks",
      preview: (
        <>
          <PreviewBar top="10%" left="4%" width="28%" height="80%" color="#e5e7eb" />
          <PreviewBar top="10%" left="36%" width="28%" height="80%" color="#e5e7eb" />
          <PreviewBar top="10%" left="68%" width="28%" height="80%" color="#e5e7eb" />
        </>
      ),
      apply: (dispatch) => {
        dispatch({ type: "ADD_ELEMENT", element: { ...makeDefaultElement("text"), x: 30, y: 100, w: 218, h: 900 } })
        dispatch({ type: "ADD_ELEMENT", element: { ...makeDefaultElement("text"), x: 288, y: 100, w: 218, h: 900 } })
        dispatch({ type: "ADD_ELEMENT", element: { ...makeDefaultElement("text"), x: 546, y: 100, w: 218, h: 900 } })
      },
    },
    {
      label: "1/3 Sidebar Left",
      description: "Narrow text left, wide right",
      preview: (
        <>
          <PreviewBar top="10%" left="4%" width="20%" height="80%" color="#dbeafe" />
          <PreviewBar top="10%" left="28%" width="68%" height="80%" color="#e5e7eb" />
        </>
      ),
      apply: (dispatch) => {
        dispatch({ type: "ADD_ELEMENT", element: { ...makeDefaultElement("text"), x: 30, y: 100, w: 180, h: 900 } })
        dispatch({ type: "ADD_ELEMENT", element: { ...makeDefaultElement("text"), x: 234, y: 100, w: 530, h: 900 } })
      },
    },
    {
      label: "3/1 Sidebar Right",
      description: "Wide text left, narrow right",
      preview: (
        <>
          <PreviewBar top="10%" left="4%" width="68%" height="80%" color="#e5e7eb" />
          <PreviewBar top="10%" left="76%" width="20%" height="80%" color="#dbeafe" />
        </>
      ),
      apply: (dispatch) => {
        dispatch({ type: "ADD_ELEMENT", element: { ...makeDefaultElement("text"), x: 30, y: 100, w: 530, h: 900 } })
        dispatch({ type: "ADD_ELEMENT", element: { ...makeDefaultElement("text"), x: 584, y: 100, w: 180, h: 900 } })
      },
    },
    {
      label: "Image + Text Right",
      description: "Image left, text block right",
      preview: (
        <>
          <PreviewBar top="10%" left="4%" width="46%" height="80%" color="#93c5fd" />
          <PreviewBar top="10%" left="54%" width="42%" height="80%" color="#e5e7eb" />
        </>
      ),
      apply: (dispatch) => {
        dispatch({ type: "ADD_ELEMENT", element: { ...makeDefaultElement("image"), x: 30, y: 100, w: 360, h: 900 } })
        dispatch({ type: "ADD_ELEMENT", element: { ...makeDefaultElement("text"), x: 414, y: 100, w: 350, h: 900 } })
      },
    },
    {
      label: "Text + Image Right",
      description: "Text left, image right",
      preview: (
        <>
          <PreviewBar top="10%" left="4%" width="42%" height="80%" color="#e5e7eb" />
          <PreviewBar top="10%" left="50%" width="46%" height="80%" color="#93c5fd" />
        </>
      ),
      apply: (dispatch) => {
        dispatch({ type: "ADD_ELEMENT", element: { ...makeDefaultElement("text"), x: 30, y: 100, w: 350, h: 900 } })
        dispatch({ type: "ADD_ELEMENT", element: { ...makeDefaultElement("image"), x: 404, y: 100, w: 360, h: 900 } })
      },
    },
    {
      label: "Image Grid 2",
      description: "Two images side by side",
      preview: (
        <>
          <PreviewBar top="10%" left="4%" width="44%" height="80%" color="#93c5fd" />
          <PreviewBar top="10%" left="52%" width="44%" height="80%" color="#93c5fd" />
        </>
      ),
      apply: (dispatch) => {
        dispatch({ type: "ADD_ELEMENT", element: { ...makeDefaultElement("image"), x: 30, y: 100, w: 355, h: 500 } })
        dispatch({ type: "ADD_ELEMENT", element: { ...makeDefaultElement("image"), x: 409, y: 100, w: 355, h: 500 } })
      },
    },
    {
      label: "Full-Width Quote",
      description: "Centred blockquote element",
      preview: (
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <div style={{ borderLeft: "3px solid #F97316", paddingLeft: 12, fontStyle: "italic", fontSize: 9, color: "#555", lineHeight: 1.6 }}>
            "Great things are done by a series of small things."
          </div>
        </div>
      ),
      apply: (dispatch) => {
        dispatch({ type: "ADD_ELEMENT", element: { ...makeDefaultElement("blockquote"), x: 72, y: 300, w: 650, h: 200 } })
      },
    },
  ]

  return (
    <div className="p-3 space-y-2 overflow-y-auto flex-1">
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-3">
        Click to add layout elements
      </p>
      <div className="grid grid-cols-2 gap-2">
        {layouts.map((layout) => (
          <LayoutCard
            key={layout.label}
            label={layout.label}
            description={layout.description}
            preview={layout.preview}
            onClick={() => apply(layout.apply)}
          />
        ))}
      </div>
    </div>
  )
}
