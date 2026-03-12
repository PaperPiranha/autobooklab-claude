"use server"

import { createClient } from "@/lib/supabase/server"
import type { EditorPage, PageElement } from "@/lib/editor/types"

interface PageRow {
  id: string
  book_id: string
  order_index: number
  name: string
  background_color: string
  elements: PageElement[]
  is_cover: boolean
  page_type: string
  created_at: string
  updated_at: string
}

function rowToPage(row: PageRow): EditorPage {
  return {
    id: row.id,
    bookId: row.book_id,
    orderIndex: row.order_index,
    name: row.name,
    backgroundColor: row.background_color,
    elements: (row.elements as PageElement[]) ?? [],
    isCover: row.is_cover ?? false,
    pageType: (row.page_type as EditorPage["pageType"]) ?? "content",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getPages(bookId: string): Promise<EditorPage[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .eq("book_id", bookId)
    .order("order_index", { ascending: true })

  if (error) {
    console.error("getPages error:", error)
    return []
  }

  return (data as PageRow[]).map(rowToPage)
}

export async function savePages(bookId: string, pages: EditorPage[]): Promise<void> {
  const supabase = await createClient()

  // Fetch existing page IDs for this book
  const { data: existing } = await supabase
    .from("pages")
    .select("id")
    .eq("book_id", bookId)

  const existingIds = new Set((existing ?? []).map((r: { id: string }) => r.id))
  const incomingIds = new Set(pages.map((p) => p.id))

  // Delete pages that were removed
  const toDelete = [...existingIds].filter((id) => !incomingIds.has(id))
  if (toDelete.length > 0) {
    await supabase.from("pages").delete().in("id", toDelete)
  }

  // Upsert all incoming pages
  if (pages.length > 0) {
    const rows = pages.map((page) => ({
      id: page.id,
      book_id: bookId,
      order_index: page.orderIndex,
      name: page.name,
      background_color: page.backgroundColor,
      elements: page.elements,
      is_cover: page.isCover ?? false,
      page_type: page.pageType ?? "content",
    }))

    const { error } = await supabase.from("pages").upsert(rows, { onConflict: "id" })
    if (error) {
      console.error("savePages upsert error:", error)
      throw new Error(error.message)
    }
  }
}
