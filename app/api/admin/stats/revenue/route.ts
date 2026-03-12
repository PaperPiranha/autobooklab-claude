import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isAdmin } from "@/lib/admin"
import { PLANS, type Plan } from "@/lib/stripe"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({}, { status: 404 })
  }

  const admin = createAdminClient()

  // All subscriptions
  const { data: subs } = await admin
    .from("subscriptions")
    .select("plan, status, created_at")

  const activeSubs = subs?.filter((s) => s.status === "active") ?? []
  const paidSubs = activeSubs.filter((s) => s.plan !== "free")

  // MRR
  const mrr = paidSubs.reduce((sum, sub) => {
    const plan = sub.plan as Plan
    return sum + (PLANS[plan]?.priceGBP ?? 0)
  }, 0)

  // Plan distribution
  const planDist: Record<string, number> = {}
  activeSubs.forEach((s) => {
    planDist[s.plan] = (planDist[s.plan] ?? 0) + 1
  })
  const planDistribution = Object.entries(planDist).map(([plan, count]) => ({
    plan: PLANS[plan as Plan]?.name ?? plan,
    count,
    revenue: count * (PLANS[plan as Plan]?.priceGBP ?? 0),
  }))

  // Subscription trend (last 6 months, by created_at month)
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  const monthlyMap = new Map<string, number>()
  subs?.forEach((s) => {
    if (new Date(s.created_at) >= sixMonthsAgo) {
      const month = s.created_at.slice(0, 7)
      monthlyMap.set(month, (monthlyMap.get(month) ?? 0) + 1)
    }
  })
  const subscriptionTrend = Array.from(monthlyMap.entries())
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month))

  // Total users
  const { data: allUsers } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1,
  })
  const totalUsers = allUsers?.users?.length ?? 0

  // 30-day churn estimate (subs cancelled in last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString()
  const { count: churned } = await admin
    .from("subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("status", "canceled")
    .gte("updated_at", thirtyDaysAgo)

  return NextResponse.json({
    mrr,
    paidSubs: paidSubs.length,
    freeUsers: totalUsers - paidSubs.length,
    churn30d: churned ?? 0,
    planDistribution,
    subscriptionTrend,
  })
}
