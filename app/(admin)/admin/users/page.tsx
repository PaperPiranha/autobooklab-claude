"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DataTable, type Column } from "../_components/data-table"

interface UserRow {
  id: string
  email: string
  plan: string
  credits: number
  books: number
  lastSignIn: string | null
  createdAt: string
  [key: string]: unknown
}

const planColors: Record<string, string> = {
  free: "bg-zinc-500/10 text-zinc-400",
  starter: "bg-blue-500/10 text-blue-400",
  creator: "bg-purple-500/10 text-purple-400",
  pro: "bg-orange-500/10 text-orange-400",
  business: "bg-emerald-500/10 text-emerald-400",
}

const columns: Column<UserRow>[] = [
  { key: "email", label: "Email", sortable: true },
  {
    key: "plan",
    label: "Plan",
    sortable: true,
    render: (row) => (
      <Badge variant="secondary" className={planColors[row.plan] ?? ""}>
        {row.plan}
      </Badge>
    ),
  },
  { key: "credits", label: "Credits", sortable: true },
  { key: "books", label: "Books", sortable: true },
  {
    key: "lastSignIn",
    label: "Last Active",
    sortable: true,
    render: (row) =>
      row.lastSignIn
        ? new Date(row.lastSignIn).toLocaleDateString("en-GB")
        : "Never",
  },
  {
    key: "createdAt",
    label: "Joined",
    sortable: true,
    render: (row) => new Date(row.createdAt).toLocaleDateString("en-GB"),
  },
]

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [planFilter, setPlanFilter] = useState("all")

  useEffect(() => {
    const params = new URLSearchParams()
    if (planFilter && planFilter !== "all") params.set("plan", planFilter)
    fetch(`/api/admin/stats/users?${params}`)
      .then((r) => r.json())
      .then((d) => setUsers(d.users ?? []))
      .finally(() => setLoading(false))
  }, [planFilter])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All plans" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All plans</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="starter">Starter</SelectItem>
            <SelectItem value="creator">Creator</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
            <SelectItem value="business">Business</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 rounded bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={users}
          searchable
          searchPlaceholder="Search by email..."
          searchKey="email"
          onRowClick={(row) => router.push(`/admin/users/${row.id}`)}
        />
      )}
    </div>
  )
}
