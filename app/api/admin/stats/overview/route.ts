import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isAdmin } from "@/lib/admin"
import { API_COST_PER_ACTION } from "@/lib/api-costs"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({}, { status: 404 })
  }

  const admin = createAdminClient()

  const [paidSubsRes, booksRes, exportsRes] = await Promise.all([
    admin
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")
      .neq("plan", "free"),
    admin
      .from("books")
      .select("*", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString()),
    admin
      .from("export_usage")
      .select("*", { count: "exact", head: true })
      .gte("created_at", new Date().toISOString().split("T")[0]),
  ])

  // API cost today
  const todayStart = new Date().toISOString().split("T")[0]
  const { data: costTodayData } = await admin
    .from("credit_transactions")
    .select("action")
    .lt("amount", 0)
    .gte("created_at", todayStart)
  const apiCostToday = costTodayData?.reduce(
    (sum, tx) => sum + (API_COST_PER_ACTION[tx.action] ?? 0),
    0
  ) ?? 0

  // API cost last 7 days for mini chart
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString()
  const { data: costWeekData } = await admin
    .from("credit_transactions")
    .select("created_at, action")
    .lt("amount", 0)
    .gte("created_at", sevenDaysAgo)
  const costByDay = new Map<string, number>()
  costWeekData?.forEach((tx) => {
    const day = tx.created_at.split("T")[0]
    const cost = API_COST_PER_ACTION[tx.action] ?? 0
    costByDay.set(day, (costByDay.get(day) ?? 0) + cost)
  })
  const apiCostTimeSeries = Array.from(costByDay.entries())
    .map(([day, total]) => ({ day, total: Math.round(total * 1000) / 1000 }))
    .sort((a, b) => a.day.localeCompare(b.day))

  // Signups last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString()
  const { data: allUsers } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })
  const signupsByDay: Record<string, number> = {}
  let totalUsers = 0
  allUsers?.users?.forEach((u) => {
    totalUsers++
    if (u.created_at >= thirtyDaysAgo) {
      const day = u.created_at.split("T")[0]
      signupsByDay[day] = (signupsByDay[day] ?? 0) + 1
    }
  })
  const signupsSeries = Object.entries(signupsByDay)
    .map(([day, count]) => ({ day, count }))
    .sort((a, b) => a.day.localeCompare(b.day))

  return NextResponse.json({
    totalUsers,
    activePaidSubs: paidSubsRes.count ?? 0,
    apiCostToday: Math.round(apiCostToday * 1000) / 1000,
    booksLast7d: booksRes.count ?? 0,
    exportsToday: exportsRes.count ?? 0,
    apiCostTimeSeries,
    signupsSeries,
  })
}
