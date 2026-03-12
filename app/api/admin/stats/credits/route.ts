import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isAdmin } from "@/lib/admin"
import { API_COST_PER_ACTION } from "@/lib/api-costs"

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({}, { status: 404 })
  }

  const days = parseInt(
    request.nextUrl.searchParams.get("days") ?? "30",
    10
  )
  const admin = createAdminClient()
  const since = new Date(Date.now() - days * 86400000).toISOString()

  // Credit usage by day and action
  const { data: byDayAction } = await admin
    .from("credit_transactions")
    .select("created_at, action, amount")
    .lt("amount", 0)
    .gte("created_at", since)
    .order("created_at")

  // Group by day + action
  const dailyMap = new Map<string, Record<string, number>>()
  const actionSet = new Set<string>()
  byDayAction?.forEach((tx) => {
    const day = tx.created_at.split("T")[0]
    const action = tx.action ?? "unknown"
    actionSet.add(action)
    if (!dailyMap.has(day)) dailyMap.set(day, {})
    const entry = dailyMap.get(day)!
    entry[action] = (entry[action] ?? 0) + Math.abs(tx.amount)
  })
  const dailySeries = Array.from(dailyMap.entries())
    .map(([day, actions]) => ({ day, ...actions }))
    .sort((a, b) => a.day.localeCompare(b.day))

  // API cost time series by day
  const costByDay = new Map<string, number>()
  byDayAction?.forEach((tx) => {
    const day = tx.created_at.split("T")[0]
    const action = tx.action ?? "unknown"
    const cost = API_COST_PER_ACTION[action] ?? 0
    costByDay.set(day, (costByDay.get(day) ?? 0) + cost)
  })
  const costTimeSeries = Array.from(costByDay.entries())
    .map(([day, total]) => ({ day, total: Math.round(total * 1000) / 1000 }))
    .sort((a, b) => a.day.localeCompare(b.day))

  // Total API cost for the period
  const totalApiCost = byDayAction?.reduce(
    (sum, tx) => sum + (API_COST_PER_ACTION[tx.action] ?? 0),
    0
  ) ?? 0

  // Top users by API cost
  const userSpend = new Map<string, number>()
  byDayAction?.forEach((tx) => {
    const uid = (tx as Record<string, unknown>).user_id as string | undefined
    if (uid) {
      const cost = API_COST_PER_ACTION[tx.action] ?? 0
      userSpend.set(uid, (userSpend.get(uid) ?? 0) + cost)
    }
  })
  const topUsers = Array.from(userSpend.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([userId, total]) => ({ userId, total: Math.round(total * 1000) / 1000 }))

  // Enrich top users with email
  if (topUsers.length > 0) {
    const { data: allUsers } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    })
    const emailMap = new Map<string, string>()
    allUsers?.users?.forEach((u) => emailMap.set(u.id, u.email ?? ""))
    topUsers.forEach((u) => {
      ;(u as Record<string, unknown>).email =
        emailMap.get(u.userId) ?? u.userId.slice(0, 8)
    })
  }

  // Daily active AI users
  const dailyActiveMap = new Map<string, Set<string>>()
  byDayAction?.forEach((tx) => {
    const day = tx.created_at.split("T")[0]
    const uid = (tx as Record<string, unknown>).user_id as string | undefined
    if (uid) {
      if (!dailyActiveMap.has(day)) dailyActiveMap.set(day, new Set())
      dailyActiveMap.get(day)!.add(uid)
    }
  })
  const dailyActiveUsers = Array.from(dailyActiveMap.entries())
    .map(([day, users]) => ({ day, count: users.size }))
    .sort((a, b) => a.day.localeCompare(b.day))

  return NextResponse.json({
    dailySeries,
    actions: Array.from(actionSet),
    topUsers,
    dailyActiveUsers,
    costTimeSeries,
    totalApiCost: Math.round(totalApiCost * 100) / 100,
  })
}
