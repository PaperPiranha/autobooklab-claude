"use client"

import {
  Type,
  Heading,
  BookOpen,
  Hash,
  Minus,
  Quote,
  Image as ImageIcon,
  Square,
  Circle,
  Minus as LineIcon,
  Table2,
  List,
  LayoutTemplate,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useEditor } from "./editor-context"
import { makeDefaultElement } from "./editor-context"
import type { ElementType } from "@/lib/editor/types"

interface ElementCardProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
}

function ElementCard({ icon, label, onClick }: ElementCardProps) {
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

interface TemplateCardProps {
  label: string
  description: string
  preview: React.ReactNode
  onClick: () => void
}

function TemplateCard({ label, description, preview, onClick }: TemplateCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-md border border-transparent p-2",
        "bg-muted/30 hover:bg-muted/60 hover:border-primary/60",
        "transition-colors cursor-pointer"
      )}
    >
      <div className="w-full aspect-[794/1123] bg-white rounded mb-1.5 overflow-hidden relative border border-border/40">
        {preview}
      </div>
      <div className="text-[10px] font-medium text-foreground leading-tight">{label}</div>
      <div className="text-[9px] text-muted-foreground leading-tight mt-0.5">{description}</div>
    </button>
  )
}

// ─── Mini wireframe previews ────────────────────────────────────────────────

function PreviewBar({ top, left, width, height, color }: { top: string; left: string; width: string; height: string; color: string }) {
  return (
    <div
      className="absolute rounded-sm"
      style={{ top, left, width, height, backgroundColor: color }}
    />
  )
}

function CoverPreview() {
  return (
    <>
      <div className="absolute inset-0 bg-[#1a1a1a]" />
      <PreviewBar top="30%" left="15%" width="70%" height="8%" color="#ffffff" />
      <PreviewBar top="42%" left="20%" width="60%" height="4%" color="rgba(255,255,255,0.5)" />
      <PreviewBar top="52%" left="30%" width="40%" height="2%" color="#F97316" />
    </>
  )
}

function ChapterOpenerPreview() {
  return (
    <>
      <PreviewBar top="15%" left="10%" width="80%" height="9%" color="#374151" />
      <PreviewBar top="32%" left="13%" width="74%" height="40%" color="#e5e7eb" />
    </>
  )
}

function FullQuotePreview() {
  return (
    <>
      <PreviewBar top="35%" left="10%" width="80%" height="25%" color="#f3f4f6" />
      <PreviewBar top="40%" left="20%" width="60%" height="4%" color="#9ca3af" />
      <PreviewBar top="48%" left="25%" width="50%" height="4%" color="#9ca3af" />
    </>
  )
}

function TwoColumnPreview() {
  return (
    <>
      <PreviewBar top="10%" left="5%" width="42%" height="80%" color="#e5e7eb" />
      <PreviewBar top="10%" left="53%" width="42%" height="80%" color="#e5e7eb" />
    </>
  )
}

function ImageCaptionPreview() {
  return (
    <>
      <PreviewBar top="8%" left="10%" width="80%" height="50%" color="#93c5fd" />
      <PreviewBar top="62%" left="10%" width="80%" height="8%" color="#e5e7eb" />
    </>
  )
}

// ─── Main panel ─────────────────────────────────────────────────────────────

interface ElementsPanelProps {
  onAddElement: (type: ElementType) => void
}

export function ElementsPanel({ onAddElement }: ElementsPanelProps) {
  const { state, dispatch } = useEditor()

  function addShape(shapeType: "rect" | "circle" | "line") {
    const element = makeDefaultElement("shape", shapeType)
    dispatch({ type: "ADD_ELEMENT", element })
  }

  function applyTemplate(templateFn: () => void) {
    dispatch({ type: "CLEAR_PAGE_ELEMENTS" })
    templateFn()
  }

  function applyCoverTemplate() {
    applyTemplate(() => {
      dispatch({
        type: "SET_PAGE_BG",
        pageId: state.activePageId,
        backgroundColor: "#1a1a1a",
      })
      dispatch({
        type: "ADD_ELEMENT",
        element: {
          ...makeDefaultElement("chapter-heading"),
          x: 72, y: 200,
          content: { text: "Book Title" },
          styles: { fontSize: 56, fontWeight: 700, color: "#ffffff", textAlign: "center" },
        },
      })
      dispatch({
        type: "ADD_ELEMENT",
        element: {
          ...makeDefaultElement("text"),
          x: 97, y: 380,
          content: { text: "Subtitle or tagline" },
          styles: { fontSize: 20, color: "rgba(255,255,255,0.7)", textAlign: "center" },
        },
      })
      dispatch({
        type: "ADD_ELEMENT",
        element: {
          ...makeDefaultElement("divider"),
          x: 197, y: 460, w: 400,
          styles: { backgroundColor: "#F97316" },
        },
      })
    })
  }

  function applyChapterOpenerTemplate() {
    applyTemplate(() => {
      dispatch({ type: "ADD_ELEMENT", element: { ...makeDefaultElement("chapter-heading"), x: 72, y: 150 } })
      dispatch({
        type: "ADD_ELEMENT",
        element: { ...makeDefaultElement("text"), x: 97, y: 340, w: 600, h: 400 },
      })
    })
  }

  function applyFullQuoteTemplate() {
    applyTemplate(() => {
      dispatch({
        type: "ADD_ELEMENT",
        element: {
          ...makeDefaultElement("callout"),
          x: 72, y: 300, w: 650, h: 200,
          content: { text: "\u201cGreat things are done by a series of small things brought together.\u201d" },
          styles: { fontSize: 28, textAlign: "center", color: "#1a1a1a", backgroundColor: "transparent", borderWidth: 0 },
        },
      })
    })
  }

  function applyTwoColumnTemplate() {
    applyTemplate(() => {
      dispatch({ type: "ADD_ELEMENT", element: { ...makeDefaultElement("text"), x: 40, y: 100, w: 340, h: 900 } })
      dispatch({ type: "ADD_ELEMENT", element: { ...makeDefaultElement("text"), x: 414, y: 100, w: 340, h: 900 } })
    })
  }

  function applyImageCaptionTemplate() {
    applyTemplate(() => {
      dispatch({ type: "ADD_ELEMENT", element: { ...makeDefaultElement("image"), x: 72, y: 80, w: 650, h: 500 } })
      dispatch({
        type: "ADD_ELEMENT",
        element: {
          ...makeDefaultElement("text"),
          x: 72, y: 620, w: 650, h: 80,
          content: { text: "Chapter introduction text\u2026" },
        },
      })
    })
  }

  return (
    <aside className="w-[280px] shrink-0 bg-sidebar border-r border-border overflow-y-auto flex flex-col">
      <div className="px-3 pt-3 pb-2 border-b border-border">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Elements
        </h2>
      </div>

      <div className="p-3 space-y-4 flex-1">
        {/* Text */}
        <div>
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Text
          </p>
          <div className="grid grid-cols-2 gap-2">
            <ElementCard
              icon={<Type className="h-4 w-4" />}
              label="Text Block"
              onClick={() => onAddElement("text")}
            />
            <ElementCard
              icon={<Heading className="h-4 w-4" />}
              label="Heading"
              onClick={() => onAddElement("heading")}
            />
            <ElementCard
              icon={<BookOpen className="h-4 w-4" />}
              label="Chapter Heading"
              onClick={() => onAddElement("chapter-heading")}
            />
            <ElementCard
              icon={<Hash className="h-4 w-4" />}
              label="Page Number"
              onClick={() => onAddElement("page-number")}
            />
          </div>
        </div>

        {/* Layout */}
        <div>
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Layout
          </p>
          <div className="grid grid-cols-2 gap-2">
            <ElementCard
              icon={<Minus className="h-4 w-4" />}
              label="Divider"
              onClick={() => onAddElement("divider")}
            />
            <ElementCard
              icon={<Quote className="h-4 w-4" />}
              label="Callout Box"
              onClick={() => onAddElement("callout")}
            />
          </div>
        </div>

        {/* Media */}
        <div>
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Media
          </p>
          <div className="grid grid-cols-2 gap-2">
            <ElementCard
              icon={<ImageIcon className="h-4 w-4" />}
              label="Image"
              onClick={() => onAddElement("image")}
            />
            <ElementCard
              icon={
                <span className="flex flex-col items-center gap-0.5">
                  <ImageIcon className="h-3.5 w-3.5" />
                  <span className="text-[7px] leading-none">caption</span>
                </span>
              }
              label="Captioned Image"
              onClick={() => onAddElement("captioned-image")}
            />
          </div>
        </div>

        {/* Shapes */}
        <div>
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Shapes
          </p>
          <div className="grid grid-cols-2 gap-2">
            <ElementCard
              icon={<Square className="h-4 w-4" />}
              label="Rectangle"
              onClick={() => addShape("rect")}
            />
            <ElementCard
              icon={<Circle className="h-4 w-4" />}
              label="Circle"
              onClick={() => addShape("circle")}
            />
            <ElementCard
              icon={<LineIcon className="h-4 w-4" />}
              label="Line"
              onClick={() => addShape("line")}
            />
          </div>
        </div>

        {/* Structure */}
        <div>
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Structure
          </p>
          <div className="grid grid-cols-2 gap-2">
            <ElementCard
              icon={<Table2 className="h-4 w-4" />}
              label="Table"
              onClick={() => onAddElement("table")}
            />
            <ElementCard
              icon={<List className="h-4 w-4" />}
              label="Table of Contents"
              onClick={() => onAddElement("toc")}
            />
          </div>
        </div>

        {/* Page Templates */}
        <div>
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
            <LayoutTemplate className="h-3 w-3" />
            Page Templates
          </p>
          <div className="grid grid-cols-2 gap-2">
            <TemplateCard
              label="Cover Page"
              description="Dark bg, title & subtitle"
              preview={<CoverPreview />}
              onClick={applyCoverTemplate}
            />
            <TemplateCard
              label="Chapter Opener"
              description="Heading + body text"
              preview={<ChapterOpenerPreview />}
              onClick={applyChapterOpenerTemplate}
            />
            <TemplateCard
              label="Full Quote"
              description="Centered callout quote"
              preview={<FullQuotePreview />}
              onClick={applyFullQuoteTemplate}
            />
            <TemplateCard
              label="Two Column"
              description="Side-by-side text blocks"
              preview={<TwoColumnPreview />}
              onClick={applyTwoColumnTemplate}
            />
            <TemplateCard
              label="Image + Caption"
              description="Hero image with text"
              preview={<ImageCaptionPreview />}
              onClick={applyImageCaptionTemplate}
            />
          </div>
        </div>
      </div>
    </aside>
  )
}
