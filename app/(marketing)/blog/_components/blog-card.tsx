import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { CalendarDays } from "lucide-react"
import type { BlogPost } from "@/lib/blog"

export function BlogCard({ post }: { post: BlogPost }) {
  const date = post.published_at ?? post.created_at

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block rounded-xl border border-border bg-card/50 p-6 transition-colors hover:border-orange-500/30 hover:bg-orange-500/[0.02]"
    >
      <div className="flex flex-wrap gap-2 mb-3">
        {post.tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="text-xs">
            {tag}
          </Badge>
        ))}
      </div>
      <h2 className="text-lg font-semibold mb-2 group-hover:text-orange-500 transition-colors">
        {post.title}
      </h2>
      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
        {post.description}
      </p>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" />
          {new Date(date).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </span>
        <span>{post.author}</span>
      </div>
    </Link>
  )
}
