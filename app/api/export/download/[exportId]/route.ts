import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ exportId: string }> }
) {
  const { exportId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { data: exp } = await supabase
    .from("exports")
    .select("file_path, format, status")
    .eq("id", exportId)
    .eq("user_id", user.id)
    .single()

  if (!exp || exp.status !== "ready" || !exp.file_path) {
    return Response.json({ error: "Export not found" }, { status: 404 })
  }

  const { data: signed } = await supabase.storage
    .from("exports")
    .createSignedUrl(exp.file_path, 60 * 60) // 1 hour

  if (!signed?.signedUrl) {
    return Response.json({ error: "Could not generate download URL" }, { status: 500 })
  }

  return Response.redirect(signed.signedUrl)
}
