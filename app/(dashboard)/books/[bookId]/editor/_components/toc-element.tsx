"use client"

import type { EditorPage, ElementStyles } from "@/lib/editor/types"

interface TocEntry {
  title: string
  pageNumber: number
}

interface TocElementProps {
  pages: EditorPage[]
  styles: ElementStyles
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim()
}

export function TocElement({ pages, styles }: TocElementProps) {
  const entries: TocEntry[] = []

  for (const page of pages) {
    for (const element of page.elements) {
      if (element.type === "chapter-heading" && element.content.text) {
        const title = stripHtml(element.content.text)
        if (title) {
          entries.push({ title, pageNumber: page.orderIndex + 1 })
        }
      }
    }
  }

  const fontSize = styles.fontSize ?? 16
  const color = styles.color ?? "#1a1a1a"
  const lineHeight = styles.lineHeight ?? 2

  return (
    <div
      className="w-full h-full overflow-hidden px-4 py-3"
      style={{ color, fontFamily: styles.fontFamily }}
    >
      <div
        className="font-bold mb-4"
        style={{ fontSize: `${Math.round(fontSize * 1.4)}px` }}
      >
        Contents
      </div>

      {entries.length === 0 ? (
        <div
          className="text-muted-foreground italic"
          style={{ fontSize: `${fontSize}px` }}
        >
          No chapter headings found. Add Chapter Heading elements to pages.
        </div>
      ) : (
        <div className="flex flex-col" style={{ gap: `${(lineHeight - 1) * fontSize}px` }}>
          {entries.map((entry, idx) => (
            <div
              key={idx}
              className="flex items-end w-full"
              style={{ fontSize: `${fontSize}px`, lineHeight: String(lineHeight) }}
            >
              <span className="shrink-0 max-w-[80%] truncate">{entry.title}</span>
              <span
                className="flex-1 mx-2 mb-1 border-b border-dotted"
                style={{ borderColor: color }}
              />
              <span className="shrink-0">{entry.pageNumber}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
