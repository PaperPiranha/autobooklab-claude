"use client"

import { useEffect, useState } from "react"
import { CreditCard, Users, UserMinus, PoundSterling } from "lucide-react"
import { StatCard } from "../_components/stat-card"
import { ChartCard } from "../_components/chart-card"
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts"

interface RevenueData {
  mrr: number
  paidSubs: number
  freeUsers: number
  churn30d: number
  planDistribution: { plan: string; count: number; revenue: number }[]
  subscriptionTrend: { month: string; count: number }[]
}

const PIE_COLORS = [
  "hsl(0 0% 40%)",
  "hsl(200 80% 50%)",
  "hsl(280 60% 55%)",
  "hsl(25 95% 50%)",
  "hsl(150 60% 45%)",
]

export default function RevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/stats/revenue")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Revenue & Subscriptions</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-lg border bg-card animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Revenue & Subscriptions</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Est. MRR"
          value={`£${data.mrr.toLocaleString()}`}
          icon={PoundSterling}
        />
        <StatCard
          title="Paid Subscribers"
          value={data.paidSubs}
          icon={CreditCard}
        />
        <StatCard
          title="Free Users"
          value={data.freeUsers}
          icon={Users}
        />
        <StatCard
          title="Churn (30d)"
          value={data.churn30d}
          icon={UserMinus}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard title="Plan Distribution">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data.planDistribution}
                dataKey="count"
                nameKey="plan"
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={50}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                label={({ name, value }: any) => `${name} (${value})`}
                labelLine={false}
              >
                {data.planDistribution.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Revenue by Tier (Monthly)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.planDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="plan" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                formatter={(value) => `£${value}`}
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                }}
              />
              <Bar dataKey="revenue" fill="hsl(25 95% 50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Subscription Trend">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.subscriptionTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                name="New Subs"
                stroke="hsl(25 95% 50%)"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}
