"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getUserPlanFeatures } from "@/lib/plans"

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

  // Enforce book limit per plan
  const { features } = await getUserPlanFeatures(user.id)
  if (features.maxBooks !== -1) {
    const { count } = await supabase
      .from("books")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
    if ((count ?? 0) >= features.maxBooks) {
      return { error: `You've reached the ${features.maxBooks}-book limit on your current plan. Please upgrade to create more books.` }
    }
  }

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
  _wordCount?: number
) {
  const supabase = await createClient()
  // Always derive from content — client-side count can be 0 when TipTap
  // cleans up before the unmount flush, so content is the source of truth.
  const stripped = content.replace(/<[^>]+>/g, " ").trim()
  const wc = stripped ? stripped.split(/\s+/).filter(Boolean).length : 0

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

export async function publishBook(bookId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  await supabase
    .from("books")
    .update({ status: "published" })
    .eq("id", bookId)
    .eq("user_id", user.id)

  revalidatePath(`/books/${bookId}`)
  revalidatePath(`/p/${bookId}`)
  return {}
}

export async function unpublishBook(bookId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  await supabase
    .from("books")
    .update({ status: "draft" })
    .eq("id", bookId)
    .eq("user_id", user.id)

  revalidatePath(`/books/${bookId}`)
  revalidatePath(`/p/${bookId}`)
  return {}
}

export async function createBookFromImport(data: {
  title: string
  genre: string
  description: string
  chapterTitle: string
  content: string
}): Promise<{ bookId?: string; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  // Enforce book limit per plan
  const { features: importFeatures } = await getUserPlanFeatures(user.id)
  if (importFeatures.maxBooks !== -1) {
    const { count } = await supabase
      .from("books")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
    if ((count ?? 0) >= importFeatures.maxBooks) {
      return { error: `You've reached the ${importFeatures.maxBooks}-book limit on your current plan. Please upgrade to create more books.` }
    }
  }

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

  if (error || !book) return { error: error?.message ?? "Failed to create book" }

  const stripped = data.content.replace(/<[^>]+>/g, " ").trim()
  const wc = stripped ? stripped.split(/\s+/).filter(Boolean).length : 0

  await supabase.from("chapters").insert({
    book_id: book.id,
    title: (data.chapterTitle || "Chapter 1").trim(),
    position: 0,
    content: data.content,
    word_count: wc,
  })

  revalidatePath("/dashboard")
  return { bookId: book.id }
}
