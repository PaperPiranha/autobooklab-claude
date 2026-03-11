"use client"

import { useEffect, useState } from "react"
import { Trash2, Star } from "lucide-react"
import { useEditor } from "../editor-context"
import type { PageElement } from "@/lib/editor/types"

interface FavouritesTabProps {
  userId?: string
}

function elementTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    text: "Text Block",
    heading: "Heading",
    "chapter-heading": "Chapter Heading",
    image: "Image",
    "captioned-image": "Captioned Image",
    divider: "Divider",
    callout: "Callout",
    "page-number": "Page Number",
    table: "Table",
    toc: "Table of Contents",
    shape: "Shape",
    blockquote: "Blockquote",
    "ordered-list": "Ordered List",
    "unordered-list": "Unordered List",
    "cta-button": "CTA Button",
    "video-embed": "Video Embed",
    "author-bio": "Author Bio",
    "icon-element": "Icon",
  }
  return labels[type] ?? type
}

export function FavouritesTab({ userId }: FavouritesTabProps) {
  const { dispatch } = useEditor()
  const [favourites, setFavourites] = useState<PageElement[]>([])

  const storageKey = `autobooklab:favourites:${userId ?? "anon"}`

  function loadFavourites() {
    try {
      const stored = localStorage.getItem(storageKey)
      setFavourites(stored ? JSON.parse(stored) : [])
    } catch {
      setFavourites([])
    }
  }

  useEffect(() => {
    loadFavourites()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  function insertFavourite(fav: PageElement) {
    const el: PageElement = {
      ...fav,
      id: crypto.randomUUID(),
      x: (fav.x ?? 97) + 16,
      y: (fav.y ?? 100) + 16,
    }
    dispatch({ type: "ADD_ELEMENT", element: el })
  }

  function removeFavourite(index: number) {
    const updated = favourites.filter((_, i) => i !== index)
    setFavourites(updated)
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated))
    } catch {
      // ignore
    }
  }

  return (
    <div className="p-3 overflow-y-auto flex-1">
      {favourites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
          <Star className="h-8 w-8 opacity-30" />
          <p className="text-xs text-center leading-relaxed">
            Select any element on the canvas, then click{" "}
            <span className="text-yellow-500">⭐ Save to Favourites</span>
            {" "}in the Properties panel to save it here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-3">
            {favourites.length} saved {favourites.length === 1 ? "element" : "elements"}
          </p>
          {favourites.map((fav, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-2 p-2.5 rounded-md border border-transparent bg-muted/30 hover:bg-muted/60 hover:border-primary/60 transition-colors"
            >
              <button
                onClick={() => insertFavourite(fav)}
                className="flex-1 text-left"
              >
                <div className="text-xs font-medium text-foreground">{elementTypeLabel(fav.type)}</div>
                {fav.content.text && (
                  <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                    {fav.content.text.replace(/<[^>]+>/g, "").slice(0, 40)}
                  </div>
                )}
              </button>
              <button
                onClick={() => removeFavourite(i)}
                className="text-muted-foreground/40 hover:text-destructive transition-colors shrink-0"
                title="Remove"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
