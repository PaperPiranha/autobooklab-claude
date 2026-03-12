"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft } from "lucide-react"
import { DataTable, type Column } from "../../_components/data-table"

interface UserDetail {
  user: {
    id: string
    email: string
    createdAt: string
    lastSignIn: string | null
    emailConfirmed: string | null
  }
  subscription: { plan: string; status: string }
  credits: { balance: number }
  books: { id: string; title: string; created_at: string }[]
  transactions: {
    id: string
    action: string
    amount: number
    created_at: string
  }[]
  exports: {
    id: string
    format: string
    created_at: string
  }[]
}

const txColumns: Column<Record<string, unknown>>[] = [
  {
    key: "created_at",
    label: "Date",
    render: (r) =>
      new Date(r.created_at as string).toLocaleString("en-GB"),
  },
  { key: "action", label: "Action" },
  {
    key: "amount",
    label: "Amount",
    render: (r) => {
      const amt = r.amount as number
      return (
        <span className={amt < 0 ? "text-red-400" : "text-green-400"}>
          {amt > 0 ? "+" : ""}
          {amt}
        </span>
      )
    },
  },
]

const bookColumns: Column<Record<string, unknown>>[] = [
  { key: "title", label: "Title" },
  {
    key: "created_at",
    label: "Created",
    render: (r) =>
      new Date(r.created_at as string).toLocaleDateString("en-GB"),
  },
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

export default function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>()
  const [data, setData] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/stats/users/${userId}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [userId])

  if (loading || !data) {
    return (
      <div className="p-8">
        <div className="h-40 rounded-lg bg-muted animate-pulse" />
      </div>
    )
  }

  return (
    <div className="p-8">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Users
      </Link>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            {data.user.email}
            <Badge variant="secondary">{data.subscription.plan}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Credits</p>
              <p className="font-medium">{data.credits.balance}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Books</p>
              <p className="font-medium">{data.books.length}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Joined</p>
              <p className="font-medium">
                {new Date(data.user.createdAt).toLocaleDateString("en-GB")}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Last Sign In</p>
              <p className="font-medium">
                {data.user.lastSignIn
                  ? new Date(data.user.lastSignIn).toLocaleDateString("en-GB")
                  : "Never"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="transactions">
        <TabsList>
          <TabsTrigger value="transactions">
            Credit Transactions ({data.transactions.length})
          </TabsTrigger>
          <TabsTrigger value="books">
            Books ({data.books.length})
          </TabsTrigger>
          <TabsTrigger value="exports">
            Exports ({data.exports.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="mt-4">
          <DataTable
            columns={txColumns}
            data={data.transactions as unknown as Record<string, unknown>[]}
            pageSize={15}
          />
        </TabsContent>

        <TabsContent value="books" className="mt-4">
          <DataTable
            columns={bookColumns}
            data={data.books as unknown as Record<string, unknown>[]}
          />
        </TabsContent>

        <TabsContent value="exports" className="mt-4">
          <DataTable
            columns={exportColumns}
            data={data.exports as unknown as Record<string, unknown>[]}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
