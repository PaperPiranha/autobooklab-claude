import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isAdmin } from "@/lib/admin"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({}, { status: 404 })
  }

  const admin = createAdminClient()

  const [booksRes, chaptersRes, exportsRes, recentExportsRes] =
    await Promise.all([
      admin.from("books").select("*", { count: "exact", head: true }),
      admin.from("chapters").select("*", { count: "exact", head: true }),
      admin.from("export_usage").select("*", { count: "exact", head: true }),
      admin
        .from("export_usage")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20),
    ])

  // Most prolific users
  const { data: booksByUser } = await admin
    .from("books")
    .select("user_id")

  const userBookCount = new Map<string, number>()
  booksByUser?.forEach((b) => {
    userBookCount.set(
      b.user_id,
      (userBookCount.get(b.user_id) ?? 0) + 1
    )
  })
  const topCreators = Array.from(userBookCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([userId, count]) => ({ userId, count }))

  // Enrich with emails
  if (topCreators.length > 0) {
    const { data: allUsers } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    })
    const emailMap = new Map<string, string>()
    allUsers?.users?.forEach((u) => emailMap.set(u.id, u.email ?? ""))
    topCreators.forEach((c) => {
      ;(c as Record<string, unknown>).email =
        emailMap.get(c.userId) ?? c.userId.slice(0, 8)
    })
  }

  return NextResponse.json({
    totalBooks: booksRes.count ?? 0,
    totalChapters: chaptersRes.count ?? 0,
    totalExports: exportsRes.count ?? 0,
    topCreators,
    recentExports: recentExportsRes.data ?? [],
  })
}
