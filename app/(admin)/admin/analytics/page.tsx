"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartCard } from "../_components/chart-card"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts"

interface CreditData {
  dailySeries: Record<string, unknown>[]
  actions: string[]
  topUsers: { userId: string; total: number; email?: string }[]
  dailyActiveUsers: { day: string; count: number }[]
  costTimeSeries: { day: string; total: number }[]
  totalApiCost: number
}

const COLORS = [
  "hsl(25 95% 50%)",
  "hsl(200 80% 50%)",
  "hsl(150 60% 45%)",
  "hsl(280 60% 55%)",
  "hsl(350 70% 50%)",
  "hsl(45 90% 50%)",
]

export default function AnalyticsPage() {
  const [data, setData] = useState<CreditData | null>(null)
  const [days, setDays] = useState("30")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/stats/credits?days=${days}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [days])

  if (loading || !data) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">AI Credit Analytics</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-72 rounded-lg border bg-card animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  // Total credits for area chart
  const totalSeries = data.dailySeries.map((d) => {
    const total = data.actions.reduce(
      (sum, a) => sum + ((d[a] as number) ?? 0),
      0
    )
    return { day: d.day as string, total }
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">AI Analytics</h1>
          {data && (
            <p className="text-sm text-muted-foreground mt-1">
              Est. API cost ({days}d): <span className="font-semibold text-foreground">${data.totalApiCost.toFixed(2)}</span>
            </p>
          )}
        </div>
        <Tabs value={days} onValueChange={setDays}>
          <TabsList>
            <TabsTrigger value="7">7d</TabsTrigger>
            <TabsTrigger value="30">30d</TabsTrigger>
            <TabsTrigger value="90">90d</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="API Spend Over Time (USD)">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data.costTimeSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${v}`} />
              <Tooltip
                formatter={(value) => `$${Number(value).toFixed(3)}`}
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                }}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="hsl(25 95% 50%)"
                fill="hsl(25 95% 50% / 0.15)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="By Action Type">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.dailySeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                }}
              />
              {data.actions.map((action, i) => (
                <Bar
                  key={action}
                  dataKey={action}
                  stackId="a"
                  fill={COLORS[i % COLORS.length]}
                  radius={i === data.actions.length - 1 ? [4, 4, 0, 0] : undefined}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top 10 Users by API Cost (USD)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.topUsers} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${v}`} />
              <YAxis
                type="category"
                dataKey="email"
                tick={{ fontSize: 11 }}
                stroke="hsl(var(--muted-foreground))"
                width={120}
              />
              <Tooltip
                formatter={(value) => `$${Number(value).toFixed(3)}`}
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                }}
              />
              <Bar dataKey="total" fill="hsl(25 95% 50%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Daily Active AI Users">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.dailyActiveUsers}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="hsl(200 80% 50%)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}
