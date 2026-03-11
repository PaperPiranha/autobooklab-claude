import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const form = await req.formData()
  const file = form.get("file") as File | null
  const bookId = form.get("bookId") as string | null

  if (!file || !bookId) {
    return Response.json({ error: "file and bookId are required" }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return Response.json({ error: "Invalid file type. Use jpg, png, gif, or webp." }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return Response.json({ error: "File too large. Max 5 MB." }, { status: 400 })
  }

  const ext = file.name.split(".").pop() ?? "jpg"
  const filename = `${crypto.randomUUID()}.${ext}`
  const path = `${user.id}/${bookId}/${filename}`

  const admin = createAdminClient()
  const { error } = await admin.storage
    .from("book-assets")
    .upload(path, await file.arrayBuffer(), {
      contentType: file.type,
      upsert: false,
    })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  const { data: urlData } = admin.storage.from("book-assets").getPublicUrl(path)

  return Response.json({ url: urlData.publicUrl })
}
