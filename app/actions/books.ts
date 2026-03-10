"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function createBook(data: {
  title: string
  genre: string
  description: string
  chapters: string[]
}): Promise<{ bookId?: string; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const { data: book, error } = await supabase
    .from("books")
    .insert({
      user_id: user.id,
      title: data.title.trim(),
      genre: data.genre,
      description: data.description.trim(),
    })
    .select()
    .single()

  if (error || !book) {
    return { error: error?.message ?? "Failed to create book" }
  }

  if (data.chapters.length > 0) {
    const chapters = data.chapters
      .filter((t) => t.trim())
      .map((title, position) => ({
        book_id: book.id,
        title: title.trim(),
        position,
      }))
    await supabase.from("chapters").insert(chapters)
  }

  revalidatePath("/dashboard")
  return { bookId: book.id }
}

export async function deleteBook(bookId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/sign-in")

  await supabase.from("books").delete().eq("id", bookId).eq("user_id", user.id)

  revalidatePath("/dashboard")
  redirect("/dashboard")
}

export async function addChapter(bookId: string, title: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  // Get max position
  const { data: existing } = await supabase
    .from("chapters")
    .select("position")
    .eq("book_id", bookId)
    .order("position", { ascending: false })
    .limit(1)
    .single()

  const position = existing ? existing.position + 1 : 0

  const { data: chapter, error } = await supabase
    .from("chapters")
    .insert({ book_id: bookId, title: title.trim(), position })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath(`/books/${bookId}`)
  return { chapterId: chapter.id }
}

export async function updateChapterContent(
  chapterId: string,
  content: string,
  wordCount?: number
) {
  const supabase = await createClient()
  const wc =
    wordCount ??
    (content.replace(/<[^>]+>/g, " ").trim()
      ? content
          .replace(/<[^>]+>/g, " ")
          .trim()
          .split(/\s+/).length
      : 0)

  await supabase
    .from("chapters")
    .update({ content, word_count: wc })
    .eq("id", chapterId)
}

export async function deleteChapter(chapterId: string, bookId: string) {
  const supabase = await createClient()
  await supabase.from("chapters").delete().eq("id", chapterId)
  revalidatePath(`/books/${bookId}`)
}

export async function reorderChapters(bookId: string, orderedIds: string[]) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  // Update positions sequentially — small N, acceptable overhead
  for (const [position, id] of orderedIds.entries()) {
    await supabase.from("chapters").update({ position }).eq("id", id)
  }

  revalidatePath(`/books/${bookId}`)
}

export async function updateChapterTitle(chapterId: string, title: string, bookId: string) {
  const supabase = await createClient()
  await supabase.from("chapters").update({ title: title.trim() }).eq("id", chapterId)
  revalidatePath(`/books/${bookId}`)
}
