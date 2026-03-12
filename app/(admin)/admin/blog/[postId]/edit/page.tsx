"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { BlogEditor } from "../../../_components/blog-editor"

export default function EditBlogPostPage() {
  const { postId } = useParams<{ postId: string }>()
  const [post, setPost] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/blog/${postId}`)
      .then((r) => r.json())
      .then(setPost)
      .finally(() => setLoading(false))
  }, [postId])

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-96 rounded-lg bg-muted animate-pulse" />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Post not found.</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <BlogEditor
        initialData={{
          id: post.id as string,
          title: post.title as string,
          slug: post.slug as string,
          description: post.description as string,
          content: post.content as string,
          author: post.author as string,
          tags: post.tags as string[],
          cover_image_url: post.cover_image_url as string | null,
          published: post.published as boolean,
        }}
      />
    </div>
  )
}
