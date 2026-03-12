"use client"

import { useRef, useCallback, useState, useEffect } from "react"
import { useEditor as useTipTapEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import TextAlign from "@tiptap/extension-text-align"
import { TextStyle } from "@tiptap/extension-text-style"
import { Color } from "@tiptap/extension-color"
import Underline from "@tiptap/extension-underline"
import Placeholder from "@tiptap/extension-placeholder"
import { Image as ImageIcon, Lock as LockIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PageElement } from "@/lib/editor/types"
import { PAGE_W, PAGE_H } from "@/lib/editor/types"
import { FormatToolbar } from "./format-toolbar"
import { TableElement } from "./table-element"
import { TocElement } from "./toc-element"
import { ShapeElement } from "./shape-element"
import { BlockquoteElement } from "./renderers/blockquote-element"
import { ListElement } from "./renderers/list-element"
import { CtaButtonElement } from "./renderers/cta-button-element"
import { VideoEmbedElement } from "./renderers/video-embed-element"
import { AuthorBioElement } from "./renderers/author-bio-element"
import { IconElement } from "./renderers/icon-element"
import { FloatingToolbar } from "./floating-toolbar"
import { useEditor } from "./editor-context"
import { findAlignmentGuides, applySnap, type AlignmentGuide } from "@/lib/editor/snap"

type HandleDir = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w"

const HANDLE_SIZE = 12 // px
const HANDLE_OFFSET = -(HANDLE_SIZE / 2)

const HANDLE_POSITIONS: Record<HandleDir, { top: string; left: string; cursor: string }> = {
  nw: { top: `${HANDLE_OFFSET}px`, left: `${HANDLE_OFFSET}px`, cursor: "nwse-resize" },
  n:  { top: `${HANDLE_OFFSET}px`, left: `calc(50% + ${HANDLE_OFFSET}px)`, cursor: "ns-resize" },
  ne: { top: `${HANDLE_OFFSET}px`, left: `calc(100% + ${HANDLE_OFFSET}px)`, cursor: "nesw-resize" },
  e:  { top: `calc(50% + ${HANDLE_OFFSET}px)`, left: `calc(100% + ${HANDLE_OFFSET}px)`, cursor: "ew-resize" },
  se: { top: `calc(100% + ${HANDLE_OFFSET}px)`, left: `calc(100% + ${HANDLE_OFFSET}px)`, cursor: "nwse-resize" },
  s:  { top: `calc(100% + ${HANDLE_OFFSET}px)`, left: `calc(50% + ${HANDLE_OFFSET}px)`, cursor: "ns-resize" },
  sw: { top: `calc(100% + ${HANDLE_OFFSET}px)`, left: `${HANDLE_OFFSET}px`, cursor: "nesw-resize" },
  w:  { top: `calc(50% + ${HANDLE_OFFSET}px)`, left: `${HANDLE_OFFSET}px`, cursor: "ew-resize" },
}

const MIN_W = 40
const MIN_H = 20

const TEXT_ELEMENT_TYPES = new Set(["text", "heading", "chapter-heading", "callout"])

interface ElementBlockProps {
  element: PageElement
  isSelected: boolean
  isNavigator?: boolean
  onSelect: () => void
  onUpdate: (updates: Partial<PageElement>) => void
  onGuidesChange?: (guides: AlignmentGuide[]) => void
  allElements?: PageElement[]
}

// ─── TipTap text block ───────────────────────────────────────────────────────

interface TipTapBlockProps {
  element: PageElement
  isSelected: boolean
  isNavigator: boolean
  onUpdate: (updates: Partial<PageElement>) => void
}

function TipTapBlock({ element, isSelected, isNavigator, onUpdate }: TipTapBlockProps) {
  const [isEditing, setIsEditing] = useState(false)
  const { content, styles, type } = element

  const tipTapEditor = useTipTapEditor({
    immediatelyRender: false,
    editable: false,
    extensions: [
      StarterKit.configure({ codeBlock: false, code: false }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Color,
      Placeholder.configure({ placeholder: "Type something…" }),
    ],
    content: content.text || "",
    onUpdate: ({ editor }) => {
      onUpdate({ content: { ...content, text: editor.getHTML() } })
    },
    editorProps: {
      attributes: { class: "outline-none w-full h-full" },
    },
  })

  // Keep content in sync when updated externally (e.g. from properties panel)
  useEffect(() => {
    if (!tipTapEditor) return
    if (isEditing) return
    const currentHTML = tipTapEditor.getHTML()
    if (currentHTML !== content.text) {
      tipTapEditor.commands.setContent(content.text || "")
    }
  }, [content.text, tipTapEditor, isEditing])

  function enterEditMode() {
    if (isNavigator || element.locked) return
    setIsEditing(true)
    tipTapEditor?.setEditable(true)
    // Focus after making editable
    setTimeout(() => tipTapEditor?.commands.focus(), 0)
  }

  function exitEditMode() {
    setIsEditing(false)
    tipTapEditor?.setEditable(false)
  }

  const textStyle: React.CSSProperties = {
    fontSize: styles.fontSize ? `${styles.fontSize}px` : undefined,
    fontWeight: styles.fontWeight,
    color: styles.color,
    textAlign: styles.textAlign,
    fontFamily: styles.fontFamily,
    lineHeight: styles.lineHeight,
    fontStyle: styles.italic ? "italic" : undefined,
  }

  const editorContent = (
    <EditorContent
      editor={tipTapEditor}
      className={cn("w-full h-full", !isEditing && "pointer-events-none")}
      style={textStyle}
      onBlur={(e) => {
        // Only exit if focus is leaving to outside the editor
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          exitEditMode()
        }
      }}
    />
  )

  if (type === "chapter-heading") {
    return (
      <div
        className="w-full h-full flex items-center pl-5 overflow-hidden"
        style={{ borderLeft: "4px solid #F97316" }}
        onDoubleClick={enterEditMode}
      >
        {isEditing && !isNavigator && (
          <div className="absolute" style={{ top: -44, left: 0, zIndex: 1000 }}>
            <FormatToolbar editor={tipTapEditor} />
          </div>
        )}
        <div style={textStyle} className="w-full h-full">
          {editorContent}
        </div>
      </div>
    )
  }

  if (type === "callout") {
    return (
      <div
        className="w-full h-full overflow-hidden"
        style={{
          backgroundColor: styles.backgroundColor,
          padding: styles.padding ? `${styles.padding}px` : undefined,
          borderRadius: styles.borderRadius ? `${styles.borderRadius}px` : undefined,
          borderLeft:
            styles.borderWidth && styles.borderColor
              ? `${styles.borderWidth}px solid ${styles.borderColor}`
              : undefined,
        }}
        onDoubleClick={enterEditMode}
      >
        {isEditing && !isNavigator && (
          <div className="absolute" style={{ top: -44, left: 0, zIndex: 1000 }}>
            <FormatToolbar editor={tipTapEditor} />
          </div>
        )}
        <div style={textStyle} className="w-full h-full">
          {editorContent}
        </div>
      </div>
    )
  }

  // text / heading
  return (
    <div
      className="w-full h-full overflow-hidden"
      style={textStyle}
      onDoubleClick={enterEditMode}
    >
      {isEditing && !isNavigator && (
        <div className="absolute" style={{ top: -44, left: 0, zIndex: 1000 }}>
          <FormatToolbar editor={tipTapEditor} />
        </div>
      )}
      {editorContent}
    </div>
  )
}

// ─── Main ElementBlock ────────────────────────────────────────────────────────

export function ElementBlock({
  element,
  isSelected,
  isNavigator = false,
  onSelect,
  onUpdate,
  onGuidesChange,
  allElements,
}: ElementBlockProps) {
  const { state, dispatch } = useEditor()
  const zoom = state.zoom ?? 1
  const isDraggingRef = useRef(false)
  const dragStartRef = useRef({ x: 0, y: 0, mouseX: 0, mouseY: 0 })
  const isResizingRef = useRef(false)
  const resizeStartRef = useRef({ x: 0, y: 0, w: 0, h: 0, mouseX: 0, mouseY: 0, dir: "" as HandleDir })
  const [dragDims, setDragDims] = useState<{ x: number; y: number } | null>(null)
  const [resizeDims, setResizeDims] = useState<{ w: number; h: number } | null>(null)
  const [isEditingText, setIsEditingText] = useState(false)

  // ─── Move drag ─────────────────────────────────────────────────────────────
  const handleMoveMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isNavigator || element.locked) return
      if ((e.target as HTMLElement).dataset.handle) return
      const target = e.target as HTMLElement
      if (target.closest(".ProseMirror")) return
      e.preventDefault()
      e.stopPropagation()

      onSelect()
      isDraggingRef.current = true
      dragStartRef.current = {
        x: element.x,
        y: element.y,
        mouseX: e.clientX,
        mouseY: e.clientY,
      }

      const others = (allElements ?? []).filter((el) => el.id !== element.id)

      function onMouseMove(ev: MouseEvent) {
        if (!isDraggingRef.current) return
        const dx = (ev.clientX - dragStartRef.current.mouseX) / zoom
        const dy = (ev.clientY - dragStartRef.current.mouseY) / zoom
        let newX = Math.max(0, Math.min(PAGE_W - element.w, dragStartRef.current.x + dx))
        let newY = Math.max(0, Math.min(PAGE_H - element.h, dragStartRef.current.y + dy))

        // Alignment guides & snap
        const guides = findAlignmentGuides({ x: newX, y: newY, w: element.w, h: element.h }, others)
        const snapped = applySnap({ x: newX, y: newY }, element.w, element.h, guides)
        newX = snapped.x
        newY = snapped.y

        onGuidesChange?.(guides)
        setDragDims({ x: Math.round(newX), y: Math.round(newY) })
        onUpdate({ x: newX, y: newY })
      }

      function onMouseUp() {
        isDraggingRef.current = false
        onGuidesChange?.([])
        setDragDims(null)
        document.removeEventListener("mousemove", onMouseMove)
        document.removeEventListener("mouseup", onMouseUp)
      }

      document.addEventListener("mousemove", onMouseMove)
      document.addEventListener("mouseup", onMouseUp)
    },
    [element, isNavigator, onSelect, onUpdate, zoom, allElements, onGuidesChange]
  )

  // ─── Resize drag ───────────────────────────────────────────────────────────
  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent, dir: HandleDir) => {
      if (isNavigator || element.locked) return
      e.preventDefault()
      e.stopPropagation()

      isResizingRef.current = true
      resizeStartRef.current = {
        x: element.x,
        y: element.y,
        w: element.w,
        h: element.h,
        mouseX: e.clientX,
        mouseY: e.clientY,
        dir,
      }

      function onMouseMove(ev: MouseEvent) {
        if (!isResizingRef.current) return
        const dx = (ev.clientX - resizeStartRef.current.mouseX) / zoom
        const dy = (ev.clientY - resizeStartRef.current.mouseY) / zoom
        const s = resizeStartRef.current

        let { x, y, w, h } = s

        if (dir.includes("e")) w = Math.max(MIN_W, s.w + dx)
        if (dir.includes("s")) h = Math.max(MIN_H, s.h + dy)
        if (dir.includes("w")) {
          const newW = Math.max(MIN_W, s.w - dx)
          x = s.x + (s.w - newW)
          w = newW
        }
        if (dir.includes("n")) {
          const newH = Math.max(MIN_H, s.h - dy)
          y = s.y + (s.h - newH)
          h = newH
        }

        x = Math.max(0, x)
        y = Math.max(0, y)
        w = Math.min(w, PAGE_W - x)
        h = Math.min(h, PAGE_H - y)

        setResizeDims({ w: Math.round(w), h: Math.round(h) })
        onUpdate({ x, y, w, h })
      }

      function onMouseUp() {
        isResizingRef.current = false
        setResizeDims(null)
        document.removeEventListener("mousemove", onMouseMove)
        document.removeEventListener("mouseup", onMouseUp)
      }

      document.addEventListener("mousemove", onMouseMove)
      document.addEventListener("mouseup", onMouseUp)
    },
    [element, isNavigator, onUpdate, zoom]
  )

  // ─── Content rendering ─────────────────────────────────────────────────────
  const { type, content, styles } = element

  const textStyle: React.CSSProperties = {
    fontSize: styles.fontSize ? `${styles.fontSize}px` : undefined,
    fontWeight: styles.fontWeight,
    color: styles.color,
    textAlign: styles.textAlign,
    fontFamily: styles.fontFamily,
    lineHeight: styles.lineHeight,
    fontStyle: styles.italic ? "italic" : undefined,
    opacity: styles.opacity != null ? styles.opacity / 100 : undefined,
  }

  let contentNode: React.ReactNode = null

  if (TEXT_ELEMENT_TYPES.has(type)) {
    contentNode = (
      <TipTapBlock
        element={element}
        isSelected={isSelected}
        isNavigator={isNavigator}
        onUpdate={onUpdate}
      />
    )
  } else if (type === "image") {
    if (content.src) {
      contentNode = (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={content.src}
          alt={content.alt ?? ""}
          className="w-full h-full"
          style={{
            objectFit: styles.objectFit ?? "cover",
            borderRadius: styles.borderRadius ? `${styles.borderRadius}px` : undefined,
          }}
          draggable={false}
        />
      )
    } else {
      contentNode = (
        <div
          className="w-full h-full flex flex-col items-center justify-center bg-muted/30 rounded gap-2"
          style={{ borderRadius: styles.borderRadius ? `${styles.borderRadius}px` : undefined }}
        >
          <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
          <span className="text-xs text-muted-foreground/60">Click to add image URL</span>
        </div>
      )
    }
  } else if (type === "captioned-image") {
    const imgH = element.h - 28
    contentNode = (
      <div className="w-full h-full flex flex-col">
        <div style={{ flex: 1, minHeight: 0 }}>
          {content.src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={content.src}
              alt={content.alt ?? ""}
              className="w-full"
              style={{
                objectFit: styles.objectFit ?? "cover",
                borderRadius: styles.borderRadius ? `${styles.borderRadius}px` : undefined,
                height: imgH,
              }}
              draggable={false}
            />
          ) : (
            <div
              className="w-full flex flex-col items-center justify-center bg-muted/30 gap-2"
              style={{
                height: imgH,
                borderRadius: styles.borderRadius ? `${styles.borderRadius}px` : undefined,
              }}
            >
              <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
              <span className="text-xs text-muted-foreground/60">Click to add image URL</span>
            </div>
          )}
        </div>
        <div
          className="outline-none mt-1 text-center shrink-0"
          style={{ fontSize: `${styles.fontSize ?? 13}px`, color: styles.color ?? "#666666" }}
        >
          {content.caption}
        </div>
      </div>
    )
  } else if (type === "divider") {
    contentNode = (
      <div
        className="w-full h-full"
        style={{ backgroundColor: styles.backgroundColor ?? "#e0e0e0" }}
      />
    )
  } else if (type === "page-number") {
    contentNode = (
      <div className="w-full h-full flex items-center justify-center" style={textStyle}>
        {content.text ?? "—"}
      </div>
    )
  } else if (type === "table") {
    contentNode = (
      <TableElement
        rows={content.rows || [["Cell"]]}
        styles={styles}
        isSelected={isSelected}
        onUpdate={(rows) => onUpdate({ content: { ...content, rows } })}
      />
    )
  } else if (type === "toc") {
    contentNode = (
      <TocElement pages={state.pages} styles={styles} />
    )
  } else if (type === "shape") {
    contentNode = (
      <ShapeElement
        w={element.w}
        h={element.h}
        shapeType={content.shapeType || "rect"}
        styles={styles}
      />
    )
  } else if (type === "blockquote") {
    contentNode = (
      <BlockquoteElement element={element} onUpdate={onUpdate} isNavigator={isNavigator} />
    )
  } else if (type === "ordered-list" || type === "unordered-list") {
    contentNode = (
      <ListElement element={element} onUpdate={onUpdate} isNavigator={isNavigator} />
    )
  } else if (type === "cta-button") {
    contentNode = (
      <CtaButtonElement element={element} onUpdate={onUpdate} isNavigator={isNavigator} />
    )
  } else if (type === "video-embed") {
    contentNode = (
      <VideoEmbedElement element={element} onUpdate={onUpdate} />
    )
  } else if (type === "author-bio") {
    contentNode = (
      <AuthorBioElement element={element} onUpdate={onUpdate} isNavigator={isNavigator} />
    )
  } else if (type === "icon-element") {
    contentNode = (
      <IconElement element={element} />
    )
  }

  return (
    <div
      className={cn(
        "absolute select-none group/el",
        !isNavigator && !element.locked && "cursor-move",
        !isNavigator && element.locked && "cursor-default",
        isSelected && "outline outline-2 outline-primary outline-offset-0"
      )}
      style={{
        left: element.x,
        top: element.y,
        width: element.w,
        height: element.h,
        zIndex: element.zIndex,
      }}
      onMouseDown={handleMoveMouseDown}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
    >
      {contentNode}

      {/* Lock indicator */}
      {element.locked && !isNavigator && (
        <div className="absolute top-1 right-1 p-0.5 bg-black/50 rounded z-50">
          <LockIcon className="h-3 w-3 text-white/70" />
        </div>
      )}

      {/* Floating toolbar — shown when selected and not editing text */}
      {isSelected && !isNavigator && !isEditingText && (
        <FloatingToolbar
          element={element}
          onDuplicate={() => dispatch({ type: "DUPLICATE_ELEMENT", elementId: element.id })}
          onDelete={() => dispatch({ type: "DELETE_ELEMENT", elementId: element.id })}
          onToggleLock={() => dispatch({ type: "UPDATE_ELEMENT", elementId: element.id, updates: { locked: !element.locked } })}
          onBringForward={() => dispatch({ type: "BRING_FORWARD", elementId: element.id })}
          onSendBackward={() => dispatch({ type: "SEND_BACKWARD", elementId: element.id })}
        />
      )}

      {/* Dimension tooltip during drag */}
      {dragDims && !isNavigator && (
        <div
          className="absolute z-50 pointer-events-none px-1.5 py-0.5 bg-black/80 text-white text-[10px] font-mono rounded whitespace-nowrap"
          style={{ bottom: -22, left: "50%", transform: "translateX(-50%)" }}
        >
          {dragDims.x}, {dragDims.y}
        </div>
      )}

      {/* Dimension tooltip during resize */}
      {resizeDims && !isNavigator && (
        <div
          className="absolute z-50 pointer-events-none px-1.5 py-0.5 bg-black/80 text-white text-[10px] font-mono rounded whitespace-nowrap"
          style={{ bottom: -22, left: "50%", transform: "translateX(-50%)" }}
        >
          {resizeDims.w} x {resizeDims.h}
        </div>
      )}

      {/* Resize handles */}
      {isSelected && !isNavigator && !element.locked && (
        <>
          {(Object.keys(HANDLE_POSITIONS) as HandleDir[]).map((dir) => {
            const pos = HANDLE_POSITIONS[dir]
            return (
              <div
                key={dir}
                data-handle={dir}
                className="absolute w-3 h-3 bg-primary border border-white rounded-sm z-50"
                style={{
                  top: pos.top,
                  left: pos.left,
                  cursor: pos.cursor,
                }}
                onMouseDown={(e) => handleResizeMouseDown(e, dir)}
              />
            )
          })}
        </>
      )}
    </div>
  )
}
