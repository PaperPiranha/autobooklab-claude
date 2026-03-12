import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isAdmin } from "@/lib/admin"

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({}, { status: 404 })
  }

  const page = parseInt(request.nextUrl.searchParams.get("page") ?? "1", 10)
  const perPage = parseInt(
    request.nextUrl.searchParams.get("perPage") ?? "50",
    10
  )
  const search = request.nextUrl.searchParams.get("search") ?? ""
  const planFilter = request.nextUrl.searchParams.get("plan") ?? ""

  const admin = createAdminClient()

  // Get all users from auth
  const { data: authData } = await admin.auth.admin.listUsers({
    page,
    perPage,
  })
  const users = authData?.users ?? []

  if (users.length === 0) {
    return NextResponse.json({ users: [], total: 0 })
  }

  const userIds = users.map((u) => u.id)

  // Get subscriptions and credits in parallel
  const [subsRes, creditsRes, booksRes] = await Promise.all([
    admin.from("subscriptions").select("user_id, plan, status").in("user_id", userIds),
    admin.from("credits").select("user_id, balance").in("user_id", userIds),
    admin.from("books").select("user_id").in("user_id", userIds),
  ])

  const subMap = new Map(subsRes.data?.map((s) => [s.user_id, s]) ?? [])
  const creditMap = new Map(creditsRes.data?.map((c) => [c.user_id, c.balance]) ?? [])

  // Count books per user
  const bookCount = new Map<string, number>()
  booksRes.data?.forEach((b) => {
    bookCount.set(b.user_id, (bookCount.get(b.user_id) ?? 0) + 1)
  })

  let enriched = users.map((u) => ({
    id: u.id,
    email: u.email ?? "",
    plan: (subMap.get(u.id)?.plan as string) ?? "free",
    status: (subMap.get(u.id)?.status as string) ?? "active",
    credits: creditMap.get(u.id) ?? 0,
    books: bookCount.get(u.id) ?? 0,
    lastSignIn: u.last_sign_in_at ?? null,
    createdAt: u.created_at,
  }))

  // Apply filters
  if (search) {
    const q = search.toLowerCase()
    enriched = enriched.filter((u) => u.email.toLowerCase().includes(q))
  }
  if (planFilter) {
    enriched = enriched.filter((u) => u.plan === planFilter)
  }

  return NextResponse.json({
    users: enriched,
    total: enriched.length,
  })
}
