import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getPostBySlug, getPublishedPosts } from "@/lib/blog"
import { BlogPostLayout } from "../_components/blog-post-layout"

export const revalidate = 60

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return { title: "Post Not Found" }

  return {
    title: `${post.title} — AutoBookLab Blog`,
    description: post.description,
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  return (
    <BlogPostLayout
      meta={{
        title: post.title,
        description: post.description,
        date: post.published_at ?? post.created_at,
        slug: post.slug,
        author: post.author,
        tags: post.tags,
      }}
      content={post.content}
    />
  )
}
