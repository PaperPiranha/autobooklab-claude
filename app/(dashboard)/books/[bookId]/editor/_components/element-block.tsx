"use client"

import { useRef, useCallback, useState, useEffect } from "react"
import { useEditor as useTipTapEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import TextAlign from "@tiptap/extension-text-align"
import { TextStyle } from "@tiptap/extension-text-style"
import { Color } from "@tiptap/extension-color"
import Underline from "@tiptap/extension-underline"
import Placeholder from "@tiptap/extension-placeholder"
import { Image as ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PageElement } from "@/lib/editor/types"
import { PAGE_W, PAGE_H } from "@/lib/editor/types"
import { FormatToolbar } from "./format-toolbar"
import { TableElement } from "./table-element"
import { TocElement } from "./toc-element"
import { ShapeElement } from "./shape-element"
import { useEditor } from "./editor-context"

type HandleDir = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w"

const HANDLE_POSITIONS: Record<HandleDir, { top: string; left: string; cursor: string }> = {
  nw: { top: "-4px", left: "-4px", cursor: "nwse-resize" },
  n:  { top: "-4px", left: "calc(50% - 4px)", cursor: "ns-resize" },
  ne: { top: "-4px", left: "calc(100% - 4px)", cursor: "nesw-resize" },
  e:  { top: "calc(50% - 4px)", left: "calc(100% - 4px)", cursor: "ew-resize" },
  se: { top: "calc(100% - 4px)", left: "calc(100% - 4px)", cursor: "nwse-resize" },
  s:  { top: "calc(100% - 4px)", left: "calc(50% - 4px)", cursor: "ns-resize" },
  sw: { top: "calc(100% - 4px)", left: "-4px", cursor: "nesw-resize" },
  w:  { top: "calc(50% - 4px)", left: "-4px", cursor: "ew-resize" },
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
}: ElementBlockProps) {
  const { state } = useEditor()
  const isDraggingRef = useRef(false)
  const dragStartRef = useRef({ x: 0, y: 0, mouseX: 0, mouseY: 0 })
  const isResizingRef = useRef(false)
  const resizeStartRef = useRef({ x: 0, y: 0, w: 0, h: 0, mouseX: 0, mouseY: 0, dir: "" as HandleDir })

  // ─── Move drag ─────────────────────────────────────────────────────────────
  const handleMoveMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isNavigator || element.locked) return
      if ((e.target as HTMLElement).dataset.handle) return
      // Don't start drag when inside TipTap editor
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

      function onMouseMove(ev: MouseEvent) {
        if (!isDraggingRef.current) return
        const dx = ev.clientX - dragStartRef.current.mouseX
        const dy = ev.clientY - dragStartRef.current.mouseY
        const newX = Math.max(0, Math.min(PAGE_W - element.w, dragStartRef.current.x + dx))
        const newY = Math.max(0, Math.min(PAGE_H - element.h, dragStartRef.current.y + dy))
        onUpdate({ x: newX, y: newY })
      }

      function onMouseUp() {
        isDraggingRef.current = false
        document.removeEventListener("mousemove", onMouseMove)
        document.removeEventListener("mouseup", onMouseUp)
      }

      document.addEventListener("mousemove", onMouseMove)
      document.addEventListener("mouseup", onMouseUp)
    },
    [element, isNavigator, onSelect, onUpdate]
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
        const dx = ev.clientX - resizeStartRef.current.mouseX
        const dy = ev.clientY - resizeStartRef.current.mouseY
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

        onUpdate({ x, y, w, h })
      }

      function onMouseUp() {
        isResizingRef.current = false
        document.removeEventListener("mousemove", onMouseMove)
        document.removeEventListener("mouseup", onMouseUp)
      }

      document.addEventListener("mousemove", onMouseMove)
      document.addEventListener("mouseup", onMouseUp)
    },
    [element, isNavigator, onUpdate]
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
  }

  return (
    <div
      className={cn(
        "absolute select-none",
        !isNavigator && !element.locked && "cursor-move",
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

      {/* Resize handles */}
      {isSelected && !isNavigator && (
        <>
          {(Object.keys(HANDLE_POSITIONS) as HandleDir[]).map((dir) => {
            const pos = HANDLE_POSITIONS[dir]
            return (
              <div
                key={dir}
                data-handle={dir}
                className="absolute w-2 h-2 bg-primary border border-white rounded-sm z-50"
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
