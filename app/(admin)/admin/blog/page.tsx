"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataTable, type Column } from "../_components/data-table"
import { Plus, Pencil, Trash2, Globe, EyeOff } from "lucide-react"

interface BlogPost {
  id: string
  title: string
  slug: string
  published: boolean
  author: string
  created_at: string
  updated_at: string
  [key: string]: unknown
}

export default function BlogListPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  function fetchPosts() {
    setLoading(true)
    fetch("/api/admin/blog")
      .then((r) => {
        if (!r.ok) return []
        return r.json()
      })
      .then((data) => setPosts(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  async function togglePublish(post: BlogPost) {
    await fetch(`/api/admin/blog/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !post.published }),
    })
    fetchPosts()
  }

  async function handleDelete(post: BlogPost) {
    if (!confirm(`Delete "${post.title}"?`)) return
    await fetch(`/api/admin/blog/${post.id}`, { method: "DELETE" })
    fetchPosts()
  }

  const columns: Column<BlogPost>[] = [
    {
      key: "title",
      label: "Title",
      sortable: true,
      render: (row) => (
        <span className="font-medium">{row.title}</span>
      ),
    },
    {
      key: "published",
      label: "Status",
      render: (row) =>
        row.published ? (
          <Badge className="bg-green-500/10 text-green-400">Published</Badge>
        ) : (
          <Badge variant="secondary">Draft</Badge>
        ),
    },
    { key: "author", label: "Author" },
    {
      key: "updated_at",
      label: "Updated",
      sortable: true,
      render: (row) =>
        new Date(row.updated_at).toLocaleDateString("en-GB"),
    },
    {
      key: "_actions",
      label: "",
      render: (row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/admin/blog/${row.id}/edit`)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => togglePublish(row)}
            title={row.published ? "Unpublish" : "Publish"}
          >
            {row.published ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Globe className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Blog Posts</h1>
        <Button onClick={() => router.push("/admin/blog/new")}>
          <Plus className="h-4 w-4 mr-2" />
          New Post
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 rounded bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={posts}
          searchable
          searchPlaceholder="Search posts..."
          searchKey="title"
          emptyMessage="No blog posts yet. Create your first one!"
        />
      )}
    </div>
  )
}
