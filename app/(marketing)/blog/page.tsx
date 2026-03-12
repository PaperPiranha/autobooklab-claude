import type { Metadata } from "next"
import { getPublishedPosts } from "@/lib/blog"
import { BlogCard } from "./_components/blog-card"

export const revalidate = 60

export const metadata: Metadata = {
  title: "Blog — AutoBookLab",
  description:
    "Tips, guides, and insights on creating professional eBooks with AI.",
}

export default async function BlogIndexPage() {
  const posts = await getPublishedPosts()

  return (
    <div className="py-24 lg:py-32">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="font-[family-name:var(--font-instrument-serif)] text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-4">
            Blog
          </h1>
          <p className="text-muted-foreground text-lg">
            Tips, guides, and insights on creating professional eBooks with AI.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      </div>
    </div>
  )
}
