"use client"

import { useEffect, useState } from "react"
import { BookOpen, FileText, Download } from "lucide-react"
import { StatCard } from "../_components/stat-card"
import { DataTable, type Column } from "../_components/data-table"

interface ContentData {
  totalBooks: number
  totalChapters: number
  totalExports: number
  topCreators: { userId: string; count: number; email?: string }[]
  recentExports: Record<string, unknown>[]
}

const creatorColumns: Column<Record<string, unknown>>[] = [
  { key: "email", label: "User" },
  { key: "count", label: "Books", sortable: true },
]

const exportColumns: Column<Record<string, unknown>>[] = [
  { key: "format", label: "Format" },
  {
    key: "created_at",
    label: "Date",
    render: (r) =>
      new Date(r.created_at as string).toLocaleString("en-GB"),
  },
]

export default function ContentPage() {
  const [data, setData] = useState<ContentData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/stats/exports")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Content Overview</h1>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 rounded-lg border bg-card animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Content Overview</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard title="Total Books" value={data.totalBooks} icon={BookOpen} />
        <StatCard
          title="Total Chapters"
          value={data.totalChapters}
          icon={FileText}
        />
        <StatCard
          title="Total Exports"
          value={data.totalExports}
          icon={Download}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">
            Most Prolific Users (Top 10)
          </h2>
          <DataTable
            columns={creatorColumns}
            data={data.topCreators as unknown as Record<string, unknown>[]}
            emptyMessage="No books created yet."
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Recent Exports</h2>
          <DataTable
            columns={exportColumns}
            data={data.recentExports}
            emptyMessage="No exports yet."
          />
        </div>
      </div>
    </div>
  )
}
