import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const bookId = searchParams.get("bookId")
  if (!bookId) return Response.json({ error: "bookId required" }, { status: 400 })

  const admin = createAdminClient()
  const prefix = `${user.id}/${bookId}/`

  const { data, error } = await admin.storage.from("book-assets").list(prefix, {
    limit: 100,
    offset: 0,
  })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  const images = (data ?? []).map((file) => {
    const { data: urlData } = admin.storage
      .from("book-assets")
      .getPublicUrl(`${prefix}${file.name}`)
    return {
      url: urlData.publicUrl,
      name: file.name,
      size: file.metadata?.size ?? 0,
    }
  })

  return Response.json({ images })
}

export async function DELETE(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const bookId = searchParams.get("bookId")
  const name = searchParams.get("name")
  if (!bookId || !name) return Response.json({ error: "bookId and name required" }, { status: 400 })

  const admin = createAdminClient()
  const path = `${user.id}/${bookId}/${name}`

  const { error } = await admin.storage.from("book-assets").remove([path])
  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ ok: true })
}
