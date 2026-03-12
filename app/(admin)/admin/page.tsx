"use client"

import { useEffect, useState } from "react"
import {
  Users,
  CreditCard,
  DollarSign,
  BookOpen,
  Download,
} from "lucide-react"
import { StatCard } from "./_components/stat-card"
import { ChartCard } from "./_components/chart-card"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts"

interface OverviewData {
  totalUsers: number
  activePaidSubs: number
  apiCostToday: number
  booksLast7d: number
  exportsToday: number
  apiCostTimeSeries: { day: string; total: number }[]
  signupsSeries: { day: string; count: number }[]
}

export default function AdminOverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/stats/overview")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Admin Overview</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-lg border bg-card animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  // Estimate MRR from paid subs (rough — revenue page has exact)
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Admin Overview</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          title="Total Users"
          value={data.totalUsers}
          icon={Users}
        />
        <StatCard
          title="Active Paid Subs"
          value={data.activePaidSubs}
          icon={CreditCard}
        />
        <StatCard
          title="API Spend Today"
          value={`$${data.apiCostToday.toFixed(2)}`}
          icon={DollarSign}
        />
        <StatCard
          title="Books (7d)"
          value={data.booksLast7d}
          icon={BookOpen}
        />
        <StatCard
          title="Exports Today"
          value={data.exportsToday}
          icon={Download}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="API Spend Last 7 Days (USD)">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.apiCostTimeSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                }}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="hsl(25 95% 50%)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="New Signups (30 Days)">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.signupsSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                }}
              />
              <Bar dataKey="count" fill="hsl(25 95% 50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}
