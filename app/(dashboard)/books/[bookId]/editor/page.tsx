import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getPages } from "@/app/actions/pages"
import { EditorShell } from "./_components/editor-shell"

interface PageProps {
  params: Promise<{ bookId: string }>
}

export default async function EditorPage({ params }: PageProps) {
  const { bookId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/sign-in")

  const { data: book } = await supabase
    .from("books")
    .select("id, title, genre, description")
    .eq("id", bookId)
    .eq("user_id", user.id)
    .single()

  if (!book) notFound()

  const initialPages = await getPages(bookId)

  return (
    <EditorShell
      book={{
        id: book.id,
        title: book.title,
        genre: book.genre ?? "",
        description: book.description ?? "",
      }}
      initialPages={initialPages}
    />
  )
}
